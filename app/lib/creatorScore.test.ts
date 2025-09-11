/**
 * Unit tests for creator score calculations
 */

import { describe, it, expect } from 'vitest';
import {
  clamp01,
  accuracyFromBrier,
  consistencyFromStd,
  volumeScoreFromNotional,
  recencyWeights,
  weightedAverage,
  calculateTotalScore,
  isProvisional,
  calculateTrend,
  formatScore,
  SCORE
} from './creatorScore';

describe('creatorScore', () => {
  describe('clamp01', () => {
    it('should clamp values between 0 and 1', () => {
      expect(clamp01(-0.5)).toBe(0);
      expect(clamp01(0)).toBe(0);
      expect(clamp01(0.5)).toBe(0.5);
      expect(clamp01(1)).toBe(1);
      expect(clamp01(1.5)).toBe(1);
    });
  });

  describe('accuracyFromBrier', () => {
    it('should convert Brier score to accuracy', () => {
      expect(accuracyFromBrier(0)).toBe(1); // Perfect Brier = perfect accuracy
      expect(accuracyFromBrier(0.25)).toBe(0.75);
      expect(accuracyFromBrier(0.5)).toBe(0.5);
      expect(accuracyFromBrier(1)).toBe(0); // Worst Brier = no accuracy
    });

    it('should clamp accuracy to [0,1]', () => {
      expect(accuracyFromBrier(-0.5)).toBe(1); // Negative Brier = perfect accuracy
      expect(accuracyFromBrier(1.5)).toBe(0); // Brier > 1 = no accuracy
    });
  });

  describe('consistencyFromStd', () => {
    it('should convert standard deviation to consistency', () => {
      expect(consistencyFromStd(0)).toBe(1); // No std = perfect consistency
      expect(consistencyFromStd(1)).toBe(0.5);
      expect(consistencyFromStd(2)).toBe(1/3);
    });

    it('should clamp consistency to [0,1]', () => {
      expect(consistencyFromStd(-1)).toBe(1); // Negative std = perfect consistency
    });
  });

  describe('volumeScoreFromNotional', () => {
    it('should calculate volume score correctly', () => {
      expect(volumeScoreFromNotional(0)).toBe(0);
      expect(volumeScoreFromNotional(50000)).toBe(1); // log1p(50000)/log1p(50000) = 1
      expect(volumeScoreFromNotional(100000)).toBe(1); // Clamped to 1
    });

    it('should clamp volume score to [0,1]', () => {
      expect(volumeScoreFromNotional(-1000)).toBe(0);
    });

    it('should use custom normalization', () => {
      const customNorm = 100000;
      expect(volumeScoreFromNotional(customNorm, customNorm)).toBe(1); // log1p(100000)/log1p(100000) = 1
    });
  });

  describe('recencyWeights', () => {
    it('should generate exponential decay weights', () => {
      const days = [0, 1, 2, 3, 4];
      const weights = recencyWeights(days, 14);
      
      expect(weights).toHaveLength(5);
      expect(weights[0]).toBeGreaterThan(weights[1]); // Today > yesterday
      expect(weights[1]).toBeGreaterThan(weights[2]); // Yesterday > day before
      expect(weights[0]).toBeCloseTo(0.22, 2); // First weight after normalization
    });

    it('should normalize weights to sum to 1', () => {
      const days = [0, 1, 2, 3, 4];
      const weights = recencyWeights(days, 14);
      const sum = weights.reduce((s, w) => s + w, 0);
      expect(sum).toBeCloseTo(1, 10);
    });

    it('should use custom half-life', () => {
      const days = [0, 1, 2];
      const weights7d = recencyWeights(days, 7);
      const weights14d = recencyWeights(days, 14);
      
      // Shorter half-life should decay faster
      expect(weights7d[1] / weights7d[0]).toBeLessThan(weights14d[1] / weights14d[0]);
    });
  });

  describe('weightedAverage', () => {
    it('should calculate weighted average correctly', () => {
      const values = [1, 2, 3, 4];
      const weights = [0.25, 0.25, 0.25, 0.25];
      expect(weightedAverage(values, weights)).toBe(2.5);
    });

    it('should handle unequal weights', () => {
      const values = [1, 2, 3];
      const weights = [0.5, 0.3, 0.2];
      expect(weightedAverage(values, weights)).toBeCloseTo(1.7, 10);
    });

    it('should return 0 for empty arrays', () => {
      expect(weightedAverage([], [])).toBe(0);
    });

    it('should return 0 for mismatched lengths', () => {
      expect(weightedAverage([1, 2], [0.5])).toBe(0);
    });
  });

  describe('calculateTotalScore', () => {
    it('should calculate total score with correct weights', () => {
      const accuracy = 0.8;
      const consistency = 0.6;
      const volumeScore = 0.4;
      const recencyScore = 0.2;
      
      const expected = 
        SCORE.W_ACC * accuracy +
        SCORE.W_CONS * consistency +
        SCORE.W_VOL * volumeScore +
        SCORE.W_REC * recencyScore;
      
      expect(calculateTotalScore(accuracy, consistency, volumeScore, recencyScore))
        .toBeCloseTo(expected, 10);
    });

    it('should clamp component scores', () => {
      const result = calculateTotalScore(1.5, -0.5, 0.5, 0.5);
      expect(result).toBeLessThanOrEqual(1);
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('isProvisional', () => {
    it('should mark scores as provisional when maturedN < 50', () => {
      expect(isProvisional(49)).toBe(true);
      expect(isProvisional(50)).toBe(false);
      expect(isProvisional(100)).toBe(false);
    });
  });

  describe('calculateTrend', () => {
    it('should detect upward trend', () => {
      expect(calculateTrend(0.8, 0.6)).toBe('up');
    });

    it('should detect downward trend', () => {
      expect(calculateTrend(0.6, 0.8)).toBe('down');
    });

    it('should detect flat trend for small changes', () => {
      expect(calculateTrend(0.6, 0.605)).toBe('flat');
    });

    it('should use 1% threshold', () => {
      expect(calculateTrend(0.6, 0.594)).toBe('flat'); // 1% decrease
      expect(calculateTrend(0.588, 0.6)).toBe('down'); // >1% decrease (0.588 - 0.6 = -0.012 = -2%)
    });
  });

  describe('formatScore', () => {
    it('should format score as percentage', () => {
      expect(formatScore(0.5)).toBe('50.000%');
      expect(formatScore(0.1234)).toBe('12.340%');
    });

    it('should use custom precision', () => {
      expect(formatScore(0.1234, 2)).toBe('12.34%');
      expect(formatScore(0.1234, 0)).toBe('12%');
    });
  });

  describe('SCORE constants', () => {
    it('should have correct weight values', () => {
      expect(SCORE.W_ACC).toBe(0.45);
      expect(SCORE.W_CONS).toBe(0.25);
      expect(SCORE.W_VOL).toBe(0.20);
      expect(SCORE.W_REC).toBe(0.10);
    });

    it('should have weights sum to 1', () => {
      const sum = SCORE.W_ACC + SCORE.W_CONS + SCORE.W_VOL + SCORE.W_REC;
      expect(sum).toBeCloseTo(1, 10);
    });

    it('should have correct other constants', () => {
      expect(SCORE.HALF_LIFE_DAYS).toBe(14);
      expect(SCORE.VOL_NORM).toBe(50000);
      expect(SCORE.PROVISIONAL_THRESHOLD).toBe(50);
    });
  });
});
