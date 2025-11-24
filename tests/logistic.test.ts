/**
 * Tests for Logistic Regression Model
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fit, predictProba, predict, saveModel, loadModel, validateModel, getFeatureImportance } from '../src/models/logistic';
import { createFeatureVector, FeatureVector } from '../src/models/features';

describe('Logistic Regression', () => {
  let mockData: FeatureVector[];
  let mockLabels: boolean[];

  beforeEach(() => {
    // Create mock training data
    mockData = [
      createFeatureVector({ oddsMid: 0.7, fgi: 80, liquidity: 500000 }), // High confidence YES
      createFeatureVector({ oddsMid: 0.3, fgi: 20, liquidity: 100000 }), // High confidence NO
      createFeatureVector({ oddsMid: 0.6, fgi: 60, liquidity: 300000 }), // Medium confidence YES
      createFeatureVector({ oddsMid: 0.4, fgi: 40, liquidity: 200000 }), // Medium confidence NO
      createFeatureVector({ oddsMid: 0.8, fgi: 90, liquidity: 800000 }), // Very high confidence YES
      createFeatureVector({ oddsMid: 0.2, fgi: 10, liquidity: 50000 }),  // Very high confidence NO
    ];

    mockLabels = [true, false, true, false, true, false];
  });

  it('should train model successfully', () => {
    const model = fit(mockData, mockLabels, {
      learningRate: 0.1,
      maxIterations: 20,
      convergenceThreshold: 1e-4,
    });

    expect(model.coefficients).toHaveLength(8); // 8 features
    expect(model.bias).toBeDefined();
    expect(model.trainingHistory.length).toBeGreaterThan(0);
    expect(model.metadata.trainingSamples).toBe(6);
  });

  it('should predict probabilities monotonically', () => {
    const model = fit(mockData, mockLabels, {
      learningRate: 0.1,
      maxIterations: 20,
    });

    // Create test data with increasing odds_mid (should increase probability)
    const testData = [
      createFeatureVector({ oddsMid: 0.1, fgi: 50, liquidity: 100000 }),
      createFeatureVector({ oddsMid: 0.3, fgi: 50, liquidity: 100000 }),
      createFeatureVector({ oddsMid: 0.5, fgi: 50, liquidity: 100000 }),
      createFeatureVector({ oddsMid: 0.7, fgi: 50, liquidity: 100000 }),
      createFeatureVector({ oddsMid: 0.9, fgi: 50, liquidity: 100000 }),
    ];

    const predictions = predictProba(model, testData);

    // Check monotonicity - higher odds_mid should give higher probability
    for (let i = 1; i < predictions.length; i++) {
      expect(predictions[i]).toBeGreaterThanOrEqual(predictions[i - 1]);
    }
  });

  it('should predict binary outcomes correctly', () => {
    const model = fit(mockData, mockLabels, {
      learningRate: 0.1,
      maxIterations: 50,
    });

    const predictions = predict(model, mockData);

    // Should predict correctly for most cases
    expect(predictions).toHaveLength(6);
    const correct = predictions.filter((p, i) => p === mockLabels[i]).length;
    expect(correct).toBeGreaterThanOrEqual(4);
  });

  it('should save and load model correctly', () => {
    const originalModel = fit(mockData, mockLabels, {
      learningRate: 0.1,
      maxIterations: 20,
    });

    const modelJson = saveModel(originalModel, 'test-model');
    const loadedModel = loadModel(modelJson);

    expect(loadedModel.coefficients).toEqual(originalModel.coefficients);
    expect(loadedModel.bias).toBe(originalModel.bias);
    expect(loadedModel.featureNames).toEqual(originalModel.featureNames);
    expect(loadedModel.metadata.trainingSamples).toBe(originalModel.metadata.trainingSamples);
  });

  it('should validate model performance', () => {
    const model = fit(mockData, mockLabels, {
      learningRate: 0.5,
      maxIterations: 100,
    });

    const validation = validateModel(model, mockData, mockLabels);

    expect(validation.accuracy).toBeGreaterThan(0.5); // Should be better than random
    expect(validation.logLoss).toBeGreaterThan(0);
    expect(validation.brierScore).toBeGreaterThan(0);
    expect(validation.brierScore).toBeLessThan(1);
  });

  it('should calculate feature importance', () => {
    const model = fit(mockData, mockLabels, {
      learningRate: 0.1,
      maxIterations: 20,
    });

    const importance = getFeatureImportance(model);

    expect(Object.keys(importance)).toHaveLength(8);
    expect(importance.odds_mid).toBeGreaterThan(0);
    expect(importance.fgi).toBeGreaterThan(0);
    expect(importance.liquidity).toBeGreaterThan(0);
  });

  it('should handle empty training data', () => {
    expect(() => {
      fit([], []);
    }).toThrow('Invalid training data');
  });

  it('should handle mismatched data lengths', () => {
    expect(() => {
      fit(mockData, [true, false]);
    }).toThrow('Invalid training data');
  });

  it('should converge within max iterations', () => {
    const model = fit(mockData, mockLabels, {
      learningRate: 0.1,
      maxIterations: 5,
    });

    expect(model.trainingHistory.length).toBeLessThanOrEqual(5);
    expect(model.metadata.convergenceIterations).toBeLessThanOrEqual(5);
  });

  it('should improve with more iterations', () => {
    const model5 = fit(mockData, mockLabels, {
      learningRate: 0.1,
      maxIterations: 5,
    });

    const model20 = fit(mockData, mockLabels, {
      learningRate: 0.1,
      maxIterations: 20,
    });

    const val5 = validateModel(model5, mockData, mockLabels);
    const val20 = validateModel(model20, mockData, mockLabels);

    // More iterations should generally improve performance
    expect(val20.brierScore).toBeLessThanOrEqual(val5.brierScore);
  });
});
