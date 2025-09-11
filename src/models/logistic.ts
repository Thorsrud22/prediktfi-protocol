/**
 * Logistic Regression Baseline Model
 * 
 * Implements logistic regression with batch gradient descent
 * No external dependencies - pure TypeScript implementation
 */

import { FeatureVector } from './features';

export interface LogisticModel {
  coefficients: number[];
  bias: number;
  featureNames: (keyof FeatureVector)[];
  trainingHistory: {
    iteration: number;
    loss: number;
    accuracy: number;
  }[];
  metadata: {
    trainedAt: Date;
    trainingSamples: number;
    convergenceIterations: number;
  };
}

export interface TrainingConfig {
  learningRate: number;
  maxIterations: number;
  convergenceThreshold: number;
  regularization: number; // L2 regularization strength
}

const DEFAULT_CONFIG: TrainingConfig = {
  learningRate: 0.01,
  maxIterations: 50,
  convergenceThreshold: 1e-6,
  regularization: 0.01,
};

/**
 * Sigmoid activation function
 */
function sigmoid(z: number): number {
  // Clamp z to prevent overflow
  const clampedZ = Math.max(-500, Math.min(500, z));
  return 1 / (1 + Math.exp(-clampedZ));
}

/**
 * Log loss function
 */
function logLoss(yTrue: number[], yPred: number[]): number {
  let loss = 0;
  for (let i = 0; i < yTrue.length; i++) {
    const y = yTrue[i];
    const p = Math.max(1e-15, Math.min(1 - 1e-15, yPred[i])); // Clamp to prevent log(0)
    loss += -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
  }
  return loss / yTrue.length;
}

/**
 * Calculate accuracy
 */
function accuracy(yTrue: number[], yPred: number[]): number {
  let correct = 0;
  for (let i = 0; i < yTrue.length; i++) {
    if ((yPred[i] > 0.5) === (yTrue[i] > 0.5)) {
      correct++;
    }
  }
  return correct / yTrue.length;
}

/**
 * Initialize model with random weights
 */
function initializeModel(featureCount: number): LogisticModel {
  const coefficients = new Array(featureCount).fill(0).map(() => (Math.random() - 0.5) * 0.1);
  const bias = (Math.random() - 0.5) * 0.1;
  
  return {
    coefficients,
    bias,
    featureNames: [
      'odds_mid', 'odds_spread', 'liquidity', 'funding_8h', 
      'funding_1d', 'fgi', 'pnl30d', 'vol30d'
    ],
    trainingHistory: [],
    metadata: {
      trainedAt: new Date(),
      trainingSamples: 0,
      convergenceIterations: 0,
    },
  };
}

/**
 * Train logistic regression model
 */
export function fit(
  X: FeatureVector[],
  y: boolean[],
  config: Partial<TrainingConfig> = {}
): LogisticModel {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  if (X.length === 0 || X.length !== y.length) {
    throw new Error('Invalid training data: X and y must have same length > 0');
  }
  
  const featureCount = Object.keys(X[0]).length;
  const model = initializeModel(featureCount);
  
  const yNumeric = y.map(b => b ? 1 : 0);
  let previousLoss = Infinity;
  
  console.log(`Training logistic regression on ${X.length} samples...`);
  
  for (let iter = 0; iter < cfg.maxIterations; iter++) {
    // Forward pass
    const predictions = X.map(x => predictSingle(model, x));
    const currentLoss = logLoss(yNumeric, predictions);
    const currentAccuracy = accuracy(yNumeric, predictions);
    
    // Record training history
    model.trainingHistory.push({
      iteration: iter,
      loss: currentLoss,
      accuracy: currentAccuracy,
    });
    
    // Check convergence
    if (Math.abs(previousLoss - currentLoss) < cfg.convergenceThreshold) {
      console.log(`Converged at iteration ${iter} (loss: ${currentLoss.toFixed(6)})`);
      model.metadata.convergenceIterations = iter;
      break;
    }
    
    previousLoss = currentLoss;
    
    // Gradient descent
    const gradients = computeGradients(X, yNumeric, predictions, model, cfg.regularization);
    
    // Update weights
    for (let i = 0; i < model.coefficients.length; i++) {
      model.coefficients[i] -= cfg.learningRate * gradients.coefficients[i];
    }
    model.bias -= cfg.learningRate * gradients.bias;
    
    // Log progress every 10 iterations
    if (iter % 10 === 0) {
      console.log(`Iteration ${iter}: loss=${currentLoss.toFixed(6)}, accuracy=${currentAccuracy.toFixed(3)}`);
    }
  }
  
  model.metadata.trainingSamples = X.length;
  model.metadata.trainedAt = new Date();
  
  console.log(`Training completed: ${model.trainingHistory.length} iterations, final accuracy: ${model.trainingHistory[model.trainingHistory.length - 1]?.accuracy.toFixed(3)}`);
  
  return model;
}

/**
 * Compute gradients for gradient descent
 */
function computeGradients(
  X: FeatureVector[],
  y: number[],
  predictions: number[],
  model: LogisticModel,
  regularization: number
): { coefficients: number[]; bias: number } {
  const gradients = {
    coefficients: new Array(model.coefficients.length).fill(0),
    bias: 0,
  };
  
  for (let i = 0; i < X.length; i++) {
    const error = predictions[i] - y[i];
    const features = Object.values(X[i]);
    
    // Update coefficient gradients
    for (let j = 0; j < model.coefficients.length; j++) {
      gradients.coefficients[j] += error * features[j];
    }
    
    // Update bias gradient
    gradients.bias += error;
  }
  
  // Average gradients
  const n = X.length;
  for (let j = 0; j < model.coefficients.length; j++) {
    gradients.coefficients[j] = gradients.coefficients[j] / n + regularization * model.coefficients[j];
  }
  gradients.bias = gradients.bias / n;
  
  return gradients;
}

/**
 * Predict probability for a single sample
 */
function predictSingle(model: LogisticModel, features: FeatureVector): number {
  const featureValues = Object.values(features);
  let z = model.bias;
  
  for (let i = 0; i < model.coefficients.length; i++) {
    z += model.coefficients[i] * featureValues[i];
  }
  
  return sigmoid(z);
}

/**
 * Predict probabilities for multiple samples
 */
export function predictProba(model: LogisticModel, X: FeatureVector[]): number[] {
  return X.map(features => predictSingle(model, features));
}

/**
 * Predict binary outcomes (threshold = 0.5)
 */
export function predict(model: LogisticModel, X: FeatureVector[]): boolean[] {
  return predictProba(model, X).map(p => p > 0.5);
}

/**
 * Save model to JSON
 */
export function saveModel(model: LogisticModel, modelId: string): string {
  const modelData = {
    ...model,
    metadata: {
      ...model.metadata,
      trainedAt: model.metadata.trainedAt.toISOString(),
    },
  };
  
  return JSON.stringify(modelData, null, 2);
}

/**
 * Load model from JSON
 */
export function loadModel(jsonData: string): LogisticModel {
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
 * Get feature importance (absolute coefficient values)
 */
export function getFeatureImportance(model: LogisticModel): Record<string, number> {
  const importance: Record<string, number> = {};
  
  for (let i = 0; i < model.coefficients.length; i++) {
    const featureName = model.featureNames[i];
    importance[featureName] = Math.abs(model.coefficients[i]);
  }
  
  return importance;
}

/**
 * Validate model performance on test set
 */
export function validateModel(
  model: LogisticModel,
  XTest: FeatureVector[],
  yTest: boolean[]
): {
  accuracy: number;
  logLoss: number;
  brierScore: number;
} {
  const predictions = predictProba(model, XTest);
  const yNumeric = yTest.map(b => b ? 1 : 0);
  
  const acc = accuracy(yNumeric, predictions);
  const logLossValue = logLoss(yNumeric, predictions);
  
  // Brier score: mean((prediction - actual)^2)
  let brierScore = 0;
  for (let i = 0; i < predictions.length; i++) {
    brierScore += Math.pow(predictions[i] - yNumeric[i], 2);
  }
  brierScore /= predictions.length;
  
  return {
    accuracy: acc,
    logLoss: logLossValue,
    brierScore,
  };
}
