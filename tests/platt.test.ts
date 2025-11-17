/**
 * Tests for Platt Scaling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  fitPlattScaling, 
  calibrateProbabilities, 
  calibrate, 
  savePlattScaling, 
  loadPlattScaling,
  validateCalibration 
} from '../src/models/platt';

describe('Platt Scaling', () => {
  let mockProbabilities: number[];
  let mockOutcomes: boolean[];

  beforeEach(() => {
    // Create mock data with some calibration issues
    mockProbabilities = [
      0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95,
      0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95,
    ];
    
    // Create outcomes that are slightly miscalibrated
    mockOutcomes = [
      false, false, false, false, false, true, true, true, true, true,
      false, false, false, false, false, true, true, true, true, true,
    ];
  });

  it('should fit Platt scaling successfully', () => {
    const scaling = fitPlattScaling(mockProbabilities, mockOutcomes, 0.2);
    
    expect(scaling.a).toBeDefined();
    expect(scaling.b).toBeDefined();
    expect(scaling.metadata.holdoutSamples).toBeGreaterThan(0);
    expect(scaling.metadata.originalBrierScore).toBeGreaterThan(0);
    expect(scaling.metadata.calibratedBrierScore).toBeGreaterThan(0);
  });

  it('should improve Brier score on holdout set', () => {
    const scaling = fitPlattScaling(mockProbabilities, mockOutcomes, 0.2);
    
    // Calibrated Brier score should be better than original
    expect(scaling.metadata.calibratedBrierScore).toBeLessThanOrEqual(scaling.metadata.originalBrierScore);
    expect(scaling.metadata.improvement).toBeGreaterThanOrEqual(-0.05);
  });

  it('should calibrate probabilities correctly', () => {
    const scaling = fitPlattScaling(mockProbabilities, mockOutcomes, 0.2);
    const calibrated = calibrateProbabilities(mockProbabilities, scaling);
    
    expect(calibrated).toHaveLength(mockProbabilities.length);
    
    // All probabilities should be in [0, 1] range
    calibrated.forEach(p => {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    });
  });

  it('should maintain monotonicity after calibration', () => {
    const sortedProbs = [...mockProbabilities].sort((a, b) => a - b);
    const scaling = fitPlattScaling(sortedProbs, mockOutcomes, 0.2);
    const calibrated = calibrateProbabilities(sortedProbs, scaling);
    
    // Calibrated probabilities should maintain order
    for (let i = 1; i < calibrated.length; i++) {
      expect(calibrated[i]).toBeGreaterThanOrEqual(calibrated[i - 1]);
    }
  });

  it('should handle perfect calibration case', () => {
    // Create perfectly calibrated data with enough samples
    const perfectProbs = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.1, 0.2, 0.3, 0.4, 0.5];
    const perfectOutcomes = [false, false, false, false, false, true, true, true, true, true, false, false, false, false, false];
    
    const scaling = fitPlattScaling(perfectProbs, perfectOutcomes, 0.2);
    
    // Should result in near-identity transformation
    expect(Math.abs(scaling.a - 1.0)).toBeLessThan(0.5);
    expect(Math.abs(scaling.b)).toBeLessThan(0.5);
  });

  it('should save and load scaling correctly', () => {
    const originalScaling = fitPlattScaling(mockProbabilities, mockOutcomes, 0.2);
    
    const scalingJson = savePlattScaling(originalScaling, 'test-model');
    const loadedScaling = loadPlattScaling(scalingJson);
    
    expect(loadedScaling.a).toBe(originalScaling.a);
    expect(loadedScaling.b).toBe(originalScaling.b);
    expect(loadedScaling.metadata.holdoutSamples).toBe(originalScaling.metadata.holdoutSamples);
    expect(loadedScaling.metadata.originalBrierScore).toBe(originalScaling.metadata.originalBrierScore);
  });

  it('should validate calibration quality', () => {
    const scaling = fitPlattScaling(mockProbabilities, mockOutcomes, 0.2);
    const calibrated = calibrateProbabilities(mockProbabilities, scaling);
    
    const validation = validateCalibration(calibrated, mockOutcomes);
    
    expect(validation.brierScore).toBeGreaterThan(0);
    expect(validation.brierScore).toBeLessThan(1);
    expect(validation.reliability).toBeGreaterThan(0);
    expect(validation.resolution).toBeGreaterThan(0);
    expect(validation.uncertainty).toBeGreaterThan(0);
  });

  it('should handle edge cases', () => {
    // Test with very few samples
    const fewProbs = [0.3, 0.7];
    const fewOutcomes = [false, true];
    
    expect(() => {
      fitPlattScaling(fewProbs, fewOutcomes, 0.2);
    }).toThrow('Need at least 10 samples for Platt scaling');
  });

  it('should handle mismatched data lengths', () => {
    expect(() => {
      fitPlattScaling(mockProbabilities, [true, false]);
    }).toThrow('Raw probabilities and actual outcomes must have same length');
  });

  it('should work with full calibration pipeline', () => {
    const result = calibrate(mockProbabilities, mockOutcomes, 0.2);
    
    expect(result.calibratedProbabilities).toHaveLength(mockProbabilities.length);
    expect(result.originalProbabilities).toEqual(mockProbabilities);
    expect(result.plattScaling.a).toBeDefined();
    expect(result.plattScaling.b).toBeDefined();
  });

  it('should improve calibration on holdout set', () => {
    const result = calibrate(mockProbabilities, mockOutcomes, 0.2);
    
    // The improvement should be non-negative
    expect(result.plattScaling.metadata.improvement).toBeGreaterThanOrEqual(-0.05);
  });

  it('should handle extreme probabilities', () => {
    const extremeProbs = [0.01, 0.99, 0.001, 0.999, 0.01, 0.99, 0.001, 0.999, 0.01, 0.99, 0.001, 0.999];
    const extremeOutcomes = [false, true, false, true, false, true, false, true, false, true, false, true];
    
    const scaling = fitPlattScaling(extremeProbs, extremeOutcomes, 0.2);
    const calibrated = calibrateProbabilities(extremeProbs, scaling);
    
    // Should still produce valid probabilities
    calibrated.forEach(p => {
      expect(p).toBeGreaterThan(0);
      expect(p).toBeLessThan(1);
    });
  });
});
