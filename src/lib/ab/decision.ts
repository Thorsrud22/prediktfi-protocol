/**
 * A/B Test Decision Logic
 * 
 * Implements statistical decision making for CTA A/B tests
 */

export interface ABTestMetrics {
  variant: string;
  nView: number;
  nCopy: number;
  nSignFromCopy: number;
  convViewCopy: number;
  convCopySign: number;
  convViewCopyCI: [number, number];
  convCopySignCI: [number, number];
}

export interface ABTestDecision {
  experimentKey: string;
  decision: 'ADOPT' | 'STOP' | 'CONTINUE';
  variant: string | null;
  delta: number;
  pValue: number;
  futilityProb: number;
  metrics: {
    A: ABTestMetrics;
    B: ABTestMetrics;
  };
  sampleSize: {
    total: number;
    target: number;
    underpowered: boolean;
  };
  reasoning: string;
}

/**
 * Calculate Wilson confidence interval for binomial proportion
 */
export function wilsonCI(successes: number, trials: number, confidence: number = 0.95): [number, number] {
  if (trials === 0) return [0, 0];
  
  const z = confidence === 0.95 ? 1.96 : 1.645; // 95% or 90% CI
  const p = successes / trials;
  const n = trials;
  
  const center = (p + (z * z) / (2 * n)) / (1 + (z * z) / n);
  const margin = (z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / (1 + (z * z) / n);
  
  return [
    Math.max(0, center - margin),
    Math.min(1, center + margin)
  ];
}

/**
 * Calculate chi-square test for 2x2 contingency table
 */
export function chiSquareTest(
  a: number, b: number, // Variant A: success, failure
  c: number, d: number  // Variant B: success, failure
): { chiSquare: number; pValue: number; df: number } {
  const n = a + b + c + d;
  if (n === 0) return { chiSquare: 0, pValue: 1, df: 1 };
  
  // Expected frequencies
  const e1 = ((a + b) * (a + c)) / n;
  const e2 = ((a + b) * (b + d)) / n;
  const e3 = ((c + d) * (a + c)) / n;
  const e4 = ((c + d) * (b + d)) / n;
  
  // Chi-square statistic
  const chiSquare = 
    Math.pow(a - e1, 2) / e1 +
    Math.pow(b - e2, 2) / e2 +
    Math.pow(c - e3, 2) / e3 +
    Math.pow(d - e4, 2) / e4;
  
  // Degrees of freedom for 2x2 table
  const df = 1;
  
  // Approximate p-value using chi-square distribution
  // For simplicity, we'll use a rough approximation
  const pValue = chiSquare > 3.84 ? 0.05 : (chiSquare > 2.71 ? 0.1 : 0.2);
  
  return { chiSquare, pValue, df };
}

/**
 * Calculate futility probability
 * Probability that true effect is less than minimum detectable effect
 */
export function futilityProbability(
  observedDelta: number,
  minDetectableEffect: number,
  nA: number,
  nB: number
): number {
  // Simplified futility calculation
  // In practice, this would use more sophisticated Bayesian methods
  const se = Math.sqrt((0.5 * 0.5) / nA + (0.5 * 0.5) / nB);
  const z = (observedDelta - minDetectableEffect) / se;
  
  // Standard normal CDF approximation
  return 1 - (1 + Math.sign(z) * Math.sqrt(1 - Math.exp(-2 * z * z / Math.PI))) / 2;
}

/**
 * Make A/B test decision based on metrics
 */
export function makeABTestDecision(
  experimentKey: string,
  metricsA: Omit<ABTestMetrics, 'convViewCopyCI' | 'convCopySignCI'>,
  metricsB: Omit<ABTestMetrics, 'convViewCopyCI' | 'convCopySignCI'>
): ABTestDecision {
  // Add confidence intervals
  const metricsAWithCI: ABTestMetrics = {
    ...metricsA,
    convViewCopyCI: wilsonCI(metricsA.nCopy, metricsA.nView),
    convCopySignCI: wilsonCI(metricsA.nSignFromCopy, metricsA.nCopy),
  };
  
  const metricsBWithCI: ABTestMetrics = {
    ...metricsB,
    convViewCopyCI: wilsonCI(metricsB.nCopy, metricsB.nView),
    convCopySignCI: wilsonCI(metricsB.nSignFromCopy, metricsB.nCopy),
  };
  
  // Calculate delta (B - A)
  const delta = metricsB.convViewCopy - metricsA.convViewCopy;
  
  // Chi-square test for view→copy conversion
  const { pValue } = chiSquareTest(
    metricsA.nCopy, metricsA.nView - metricsA.nCopy,
    metricsB.nCopy, metricsB.nView - metricsB.nCopy
  );
  
  // Check if copy→sign conversion is similar
  const copySignDelta = Math.abs(metricsB.convCopySign - metricsA.convCopySign);
  
  // Calculate futility probability
  const futilityProb = futilityProbability(delta, 0.05, metricsA.nView, metricsB.nView);
  
  // Sample size check
  const totalSamples = metricsA.nView + metricsB.nView;
  const targetSamples = 1800; // 900 per variant
  const underpowered = totalSamples < targetSamples;
  
  // Decision logic
  let decision: 'ADOPT' | 'STOP' | 'CONTINUE';
  let variant: string | null = null;
  let reasoning: string;
  
  if (underpowered) {
    decision = 'CONTINUE';
    reasoning = `Insufficient sample size: ${totalSamples}/${targetSamples} (need 900 per variant)`;
  } else if (delta >= 0.05 && pValue < 0.05 && copySignDelta <= 0.00) {
    decision = 'ADOPT';
    variant = 'B';
    reasoning = `Significant improvement: +${(delta * 100).toFixed(1)}pp (p=${pValue.toFixed(3)})`;
  } else if (futilityProb < 0.20) {
    decision = 'STOP';
    reasoning = `Futility detected: ${(futilityProb * 100).toFixed(1)}% chance of reaching significance`;
  } else {
    decision = 'CONTINUE';
    reasoning = `Inconclusive: Δ=${(delta * 100).toFixed(1)}pp, p=${pValue.toFixed(3)}, futility=${(futilityProb * 100).toFixed(1)}%`;
  }
  
  return {
    experimentKey,
    decision,
    variant,
    delta,
    pValue,
    futilityProb,
    metrics: {
      A: metricsAWithCI,
      B: metricsBWithCI,
    },
    sampleSize: {
      total: totalSamples,
      target: targetSamples,
      underpowered,
    },
    reasoning,
  };
}

/**
 * Format decision for display in digest
 */
export function formatABTestDecision(decision: ABTestDecision): string {
  const { metrics, delta, pValue, decision: decisionType, variant, reasoning } = decision;
  
  let result = `## CTA A/B (${decision.experimentKey})\n\n`;
  
  // Variant A metrics
  result += `**A:** ${(metrics.A.convViewCopy * 100).toFixed(1)}% view→copy `;
  result += `[${(metrics.A.convViewCopyCI[0] * 100).toFixed(1)}%, ${(metrics.A.convViewCopyCI[1] * 100).toFixed(1)}%] `;
  result += `(${metrics.A.nView} views, ${metrics.A.nCopy} copies)\n`;
  result += `Copy→sign: ${(metrics.A.convCopySign * 100).toFixed(1)}% `;
  result += `[${(metrics.A.convCopySignCI[0] * 100).toFixed(1)}%, ${(metrics.A.convCopySignCI[1] * 100).toFixed(1)}%]\n\n`;
  
  // Variant B metrics
  result += `**B:** ${(metrics.B.convViewCopy * 100).toFixed(1)}% view→copy `;
  result += `[${(metrics.B.convViewCopyCI[0] * 100).toFixed(1)}%, ${(metrics.B.convViewCopyCI[1] * 100).toFixed(1)}%] `;
  result += `(${metrics.B.nView} views, ${metrics.B.nCopy} copies)\n`;
  result += `Copy→sign: ${(metrics.B.convCopySign * 100).toFixed(1)}% `;
  result += `[${(metrics.B.convCopySignCI[0] * 100).toFixed(1)}%, ${(metrics.B.convCopySignCI[1] * 100).toFixed(1)}%]\n\n`;
  
  // Decision
  result += `**Decision:** ${decisionType}`;
  if (variant) result += ` (${variant})`;
  result += `\n`;
  result += `**Δ:** ${(delta * 100).toFixed(1)}pp, **p-value:** ${pValue.toFixed(3)}\n`;
  result += `**Reasoning:** ${reasoning}\n`;
  
  if (decision.sampleSize.underpowered) {
    result += `⚠️ **UNDERPOWERED:** ${decision.sampleSize.total}/${decision.sampleSize.target} samples\n`;
  }
  
  return result;
}
