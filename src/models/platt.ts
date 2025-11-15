/**
 * Platt Scaling for Probability Calibration
 * 
 * Implements Platt scaling to calibrate raw model probabilities
 * Uses sigmoid: p_calibrated = sigmoid(a * logit(p_raw) + b)
 */

export interface PlattScaling {
  a: number;  // Scale parameter
  b: number;  // Shift parameter
  metadata: {
    trainedAt: Date;
    holdoutSamples: number;
    originalBrierScore: number;
    calibratedBrierScore: number;
    improvement: number;
  };
}

export interface CalibrationResult {
  calibratedProbabilities: number[];
  originalProbabilities: number[];
  plattScaling: PlattScaling;
}

/**
 * Logit function (inverse of sigmoid)
 */
function logit(p: number): number {
  const clampedP = Math.max(1e-15, Math.min(1 - 1e-15, p));
  return Math.log(clampedP / (1 - clampedP));
}

/**
 * Sigmoid function
 */
function sigmoid(z: number): number {
  const clampedZ = Math.max(-500, Math.min(500, z));
  return 1 / (1 + Math.exp(-clampedZ));
}

/**
 * Brier score calculation
 */
function brierScore(predictions: number[], actuals: number[]): number {
  let score = 0;
  for (let i = 0; i < predictions.length; i++) {
    score += Math.pow(predictions[i] - actuals[i], 2);
  }
  return score / predictions.length;
}

/**
 * Train Platt scaling on holdout set
 */
export function fitPlattScaling(
  rawProbabilities: number[],
  actualOutcomes: boolean[],
  holdoutRatio: number = 0.2
): PlattScaling {
  if (rawProbabilities.length !== actualOutcomes.length) {
    throw new Error('Raw probabilities and actual outcomes must have same length');
  }
  
  if (rawProbabilities.length < 10) {
    throw new Error('Need at least 10 samples for Platt scaling');
  }
  
  // Split into training and holdout sets
  const totalSamples = rawProbabilities.length;
  const holdoutSize = Math.max(5, Math.floor(totalSamples * holdoutRatio));
  const trainingSize = totalSamples - holdoutSize;
  
  // Shuffle indices
  const indices = Array.from({ length: totalSamples }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  const trainingIndices = indices.slice(0, trainingSize);
  const holdoutIndices = indices.slice(trainingSize);
  
  // Extract training data
  const trainProbs = trainingIndices.map(i => rawProbabilities[i]);
  const trainOutcomes = trainingIndices.map(i => actualOutcomes[i] ? 1 : 0);
  
  // Extract holdout data
  const holdoutProbs = holdoutIndices.map(i => rawProbabilities[i]);
  const holdoutOutcomes = holdoutIndices.map(i => actualOutcomes[i] ? 1 : 0);
  
  console.log(`Training Platt scaling on ${trainingSize} samples, holdout: ${holdoutSize}`);
  
  // Calculate original Brier score on holdout
  const originalBrier = brierScore(holdoutProbs, holdoutOutcomes);
  
  // Convert probabilities to logits
  const logits = trainProbs.map(logit);
  
  // Simple linear regression: logit(p_cal) = a * logit(p_raw) + b
  // We'll use a simple gradient descent approach
  let a = 1.0;  // Start with identity transformation
  let b = 0.0;  // No shift initially
  
  const learningRate = 0.01;
  const maxIterations = 1000;
  const convergenceThreshold = 1e-6;
  
  let previousLoss = Infinity;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    // Forward pass
    const calibratedProbs = logits.map(logit => sigmoid(a * logit + b));
    
    // Calculate loss (Brier score)
    const currentLoss = brierScore(calibratedProbs, trainOutcomes);
    
    // Check convergence
    if (Math.abs(previousLoss - currentLoss) < convergenceThreshold) {
      console.log(`Platt scaling converged at iteration ${iter}`);
      break;
    }
    
    previousLoss = currentLoss;
    
    // Calculate gradients
    let gradA = 0;
    let gradB = 0;
    
    for (let i = 0; i < calibratedProbs.length; i++) {
      const error = calibratedProbs[i] - trainOutcomes[i];
      const logit = logits[i];
      
      // Gradient w.r.t. a
      gradA += error * calibratedProbs[i] * (1 - calibratedProbs[i]) * logit;
      
      // Gradient w.r.t. b
      gradB += error * calibratedProbs[i] * (1 - calibratedProbs[i]);
    }
    
    // Update parameters
    a -= learningRate * gradA / calibratedProbs.length;
    b -= learningRate * gradB / calibratedProbs.length;
    
    // Log progress every 100 iterations
    if (iter % 100 === 0) {
      console.log(`Platt iteration ${iter}: loss=${currentLoss.toFixed(6)}, a=${a.toFixed(4)}, b=${b.toFixed(4)}`);
    }
  }
  
  // Evaluate on holdout set
  const holdoutLogits = holdoutProbs.map(logit);
  const calibratedHoldoutProbs = holdoutLogits.map(logit => sigmoid(a * logit + b));
  const calibratedBrier = brierScore(calibratedHoldoutProbs, holdoutOutcomes);
  
  const improvement = originalBrier - calibratedBrier;
  
  console.log(`Platt scaling results:`);
  console.log(`  Original Brier score: ${originalBrier.toFixed(6)}`);
  console.log(`  Calibrated Brier score: ${calibratedBrier.toFixed(6)}`);
  console.log(`  Improvement: ${improvement.toFixed(6)}`);
  console.log(`  Parameters: a=${a.toFixed(4)}, b=${b.toFixed(4)}`);
  
  return {
    a,
    b,
    metadata: {
      trainedAt: new Date(),
      holdoutSamples: holdoutSize,
      originalBrierScore: originalBrier,
      calibratedBrierScore: calibratedBrier,
      improvement,
    },
  };
}

/**
 * Apply Platt scaling to raw probabilities
 */
export function calibrateProbabilities(
  rawProbabilities: number[],
  plattScaling: PlattScaling
): number[] {
  return rawProbabilities.map(p => {
    const logitP = logit(p);
    return sigmoid(plattScaling.a * logitP + plattScaling.b);
  });
}

/**
 * Calibrate probabilities and return full result
 */
export function calibrate(
  rawProbabilities: number[],
  actualOutcomes: boolean[],
  holdoutRatio: number = 0.2
): CalibrationResult {
  const plattScaling = fitPlattScaling(rawProbabilities, actualOutcomes, holdoutRatio);
  const calibratedProbabilities = calibrateProbabilities(rawProbabilities, plattScaling);
  
  return {
    calibratedProbabilities,
    originalProbabilities: rawProbabilities,
    plattScaling,
  };
}

/**
 * Save Platt scaling parameters
 */
export function savePlattScaling(scaling: PlattScaling, modelId: string): string {
  const data = {
    ...scaling,
    metadata: {
      ...scaling.metadata,
      trainedAt: scaling.metadata.trainedAt.toISOString(),
    },
  };
  
  return JSON.stringify(data, null, 2);
}

/**
 * Load Platt scaling parameters
 */
export function loadPlattScaling(jsonData: string): PlattScaling {
  const data = JSON.parse(jsonData);
  
  return {
    ...data,
    metadata: {
      ...data.metadata,
      trainedAt: new Date(data.metadata.trainedAt),
    },
  };
}

/**
 * Validate calibration quality
 */
export function validateCalibration(
  calibratedProbs: number[],
  actualOutcomes: boolean[]
): {
  brierScore: number;
  reliability: number;
  resolution: number;
  uncertainty: number;
} {
  const actuals = actualOutcomes.map<number>(b => (b ? 1 : 0));
  const brierScoreValue = brierScore(calibratedProbs, actuals);
  
  // Reliability: mean((prediction - bin_mean)^2)
  // Resolution: mean((bin_mean - overall_mean)^2)
  // Uncertainty: overall_mean * (1 - overall_mean)
  
  const overallMean = actuals.reduce<number>((sum, a) => sum + a, 0) / actuals.length;
  const uncertainty = overallMean * (1 - overallMean);
  
  // Simple binning for reliability calculation
  const bins = 10;
  const binSize = 1 / bins;
  let reliability = 0;
  let resolution = 0;
  
  for (let i = 0; i < bins; i++) {
    const binStart = i * binSize;
    const binEnd = (i + 1) * binSize;
    
    const binIndices = calibratedProbs
      .map((p, idx) => p >= binStart && p < binEnd ? idx : -1)
      .filter(idx => idx !== -1);
    
    if (binIndices.length > 0) {
      const binProbs = binIndices.map(idx => calibratedProbs[idx]);
      const binActuals = binIndices.map(idx => actuals[idx]);
      const binMean = binActuals.reduce<number>((sum, a) => sum + a, 0) / binActuals.length;
      const binProbMean = binProbs.reduce((sum, p) => sum + p, 0) / binProbs.length;
      
      // Reliability: mean((prediction - bin_mean)^2) for this bin
      const binReliability = binProbs.reduce((sum, p) => sum + Math.pow(p - binMean, 2), 0) / binProbs.length;
      reliability += binReliability * binIndices.length;
      
      // Resolution: (bin_mean - overall_mean)^2 * bin_weight
      resolution += Math.pow(binMean - overallMean, 2) * binIndices.length;
    }
  }
  
  reliability /= calibratedProbs.length;
  resolution /= calibratedProbs.length;
  
  return {
    brierScore: brierScoreValue,
    reliability,
    resolution,
    uncertainty,
  };
}
