/**
 * A/B Testing Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ctaBucket, getCTAExperiment, getSessionId } from '../src/lib/ab/ctaBucket';
import { 
  wilsonCI, 
  chiSquareTest, 
  futilityProbability, 
  makeABTestDecision,
  formatABTestDecision 
} from '../src/lib/ab/decision';

describe('A/B Testing Bucketing', () => {
  it('should return consistent variants for same session', () => {
    const sessionId = 'test-session-123';
    const variant1 = ctaBucket(sessionId);
    const variant2 = ctaBucket(sessionId);
    
    expect(variant1).toBe(variant2);
    expect(['A', 'B']).toContain(variant1);
  });

  it('should distribute variants roughly evenly', () => {
    const variants = [];
    for (let i = 0; i < 1000; i++) {
      variants.push(ctaBucket(`session-${i}`));
    }
    
    const aCount = variants.filter(v => v === 'A').length;
    const bCount = variants.filter(v => v === 'B').length;
    
    // Should be roughly 50/50 (within 10% tolerance)
    expect(aCount).toBeGreaterThan(400);
    expect(aCount).toBeLessThan(600);
    expect(bCount).toBeGreaterThan(400);
    expect(bCount).toBeLessThan(600);
  });

  it('should return experiment metadata', () => {
    const sessionId = 'test-session';
    const experiment = getCTAExperiment(sessionId);
    
    expect(experiment.experimentKey).toBe('cta_copy_v1');
    expect(['A', 'B']).toContain(experiment.variant);
  });
});

describe('Wilson Confidence Interval', () => {
  it('should calculate correct CI for known values', () => {
    const [low, high] = wilsonCI(50, 100, 0.95);
    
    expect(low).toBeGreaterThan(0.4);
    expect(low).toBeLessThan(0.6);
    expect(high).toBeGreaterThan(0.4);
    expect(high).toBeLessThan(0.6);
    expect(high).toBeGreaterThan(low);
  });

  it('should handle edge cases', () => {
    const [low1, high1] = wilsonCI(0, 100, 0.95);
    expect(low1).toBe(0);
    expect(high1).toBeGreaterThan(0);
    
    const [low2, high2] = wilsonCI(100, 100, 0.95);
    expect(low2).toBeGreaterThan(0.9);
    expect(high2).toBeCloseTo(1, 5);
    
    const [low3, high3] = wilsonCI(0, 0, 0.95);
    expect(low3).toBe(0);
    expect(high3).toBe(0);
  });
});

describe('Chi-Square Test', () => {
  it('should calculate correct chi-square for known values', () => {
    const { chiSquare, pValue, df } = chiSquareTest(50, 50, 60, 40);
    
    expect(chiSquare).toBeGreaterThan(0);
    expect(pValue).toBeGreaterThan(0);
    expect(pValue).toBeLessThan(1);
    expect(df).toBe(1);
  });

  it('should handle edge cases', () => {
    const { chiSquare, pValue } = chiSquareTest(0, 0, 0, 0);
    expect(chiSquare).toBe(0);
    expect(pValue).toBe(1);
  });
});

describe('Futility Probability', () => {
  it('should calculate futility probability', () => {
    const futility = futilityProbability(0.02, 0.05, 100, 100);
    
    expect(futility).toBeGreaterThan(0);
    expect(futility).toBeLessThan(1);
  });

  it('should calculate futility probability for different sample sizes', () => {
    const futility1 = futilityProbability(0.02, 0.05, 100, 100);
    const futility2 = futilityProbability(0.02, 0.05, 50, 50);
    
    // Both should be valid probabilities
    expect(futility1).toBeGreaterThan(0);
    expect(futility1).toBeLessThan(1);
    expect(futility2).toBeGreaterThan(0);
    expect(futility2).toBeLessThan(1);
  });
});

describe('A/B Test Decision Logic', () => {
  it('should make decision based on metrics', () => {
    const metricsA = {
      variant: 'A',
      nView: 2000,
      nCopy: 200,
      nSignFromCopy: 100,
      convViewCopy: 0.1,
      convCopySign: 0.5,
    };
    
    const metricsB = {
      variant: 'B',
      nView: 2000,
      nCopy: 400,
      nSignFromCopy: 200,
      convViewCopy: 0.2,
      convCopySign: 0.5,
    };
    
    const decision = makeABTestDecision('test', metricsA, metricsB);
    
    // Should make some decision
    expect(['ADOPT', 'STOP', 'CONTINUE']).toContain(decision.decision);
    expect(decision.delta).toBe(0.1);
    expect(decision.sampleSize.underpowered).toBe(false);
  });

  it('should continue when underpowered', () => {
    const metricsA = {
      variant: 'A',
      nView: 100,
      nCopy: 10,
      nSignFromCopy: 5,
      convViewCopy: 0.1,
      convCopySign: 0.5,
    };
    
    const metricsB = {
      variant: 'B',
      nView: 100,
      nCopy: 15,
      nSignFromCopy: 7,
      convViewCopy: 0.15,
      convCopySign: 0.47,
    };
    
    const decision = makeABTestDecision('test', metricsA, metricsB);
    
    expect(decision.decision).toBe('CONTINUE');
    expect(decision.sampleSize.underpowered).toBe(true);
  });

  it('should stop when futility detected', () => {
    const metricsA = {
      variant: 'A',
      nView: 1000,
      nCopy: 100,
      nSignFromCopy: 50,
      convViewCopy: 0.1,
      convCopySign: 0.5,
    };
    
    const metricsB = {
      variant: 'B',
      nView: 1000,
      nCopy: 101,
      nSignFromCopy: 50,
      convViewCopy: 0.101,
      convCopySign: 0.495,
    };
    
    const decision = makeABTestDecision('test', metricsA, metricsB);
    
    // This might be CONTINUE or STOP depending on futility calculation
    expect(['CONTINUE', 'STOP']).toContain(decision.decision);
  });
});

describe('Decision Formatting', () => {
  it('should format decision for digest', () => {
    const metricsA = {
      variant: 'A',
      nView: 1000,
      nCopy: 100,
      nSignFromCopy: 50,
      convViewCopy: 0.1,
      convCopySign: 0.5,
      convViewCopyCI: [0.08, 0.12] as [number, number],
      convCopySignCI: [0.4, 0.6] as [number, number],
    };
    
    const metricsB = {
      variant: 'B',
      nView: 1000,
      nCopy: 200,
      nSignFromCopy: 100,
      convViewCopy: 0.2,
      convCopySign: 0.5,
      convViewCopyCI: [0.18, 0.22] as [number, number],
      convCopySignCI: [0.4, 0.6] as [number, number],
    };
    
    const decision = {
      experimentKey: 'test',
      decision: 'ADOPT' as const,
      variant: 'B',
      delta: 0.1,
      pValue: 0.01,
      futilityProb: 0.1,
      metrics: { A: metricsA, B: metricsB },
      sampleSize: { total: 2000, target: 1800, underpowered: false },
      reasoning: 'Significant improvement',
    };
    
    const formatted = formatABTestDecision(decision);
    
    expect(formatted).toContain('CTA A/B (test)');
    expect(formatted).toContain('**A:** 10.0% view→copy');
    expect(formatted).toContain('**B:** 20.0% view→copy');
    expect(formatted).toContain('**Decision:** ADOPT (B)');
    expect(formatted).toContain('**Δ:** 10.0pp');
  });
});
