/**
 * Unit tests for winsorize utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  winsorize,
  winsorizeByPair,
  getAlphaForSampleSize,
  winsorizedMean,
  winsorizedStd
} from '../app/lib/winsorize';

describe('winsorize', () => {
  describe('winsorize', () => {
    it('should return empty array for empty input', () => {
      expect(winsorize([])).toEqual([]);
    });

    it('should return original array for alpha <= 0', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(winsorize(arr, 0)).toEqual(arr);
      expect(winsorize(arr, -0.1)).toEqual(arr);
    });

    it('should return original array for alpha >= 0.5', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(winsorize(arr, 0.5)).toEqual(arr);
      expect(winsorize(arr, 0.6)).toEqual(arr);
    });

    it('should winsorize extreme values', () => {
      const arr = [1, 2, 3, 4, 100]; // 100 is an outlier
      const result = winsorize(arr, 0.2); // Trim 20% (1 value from each end)
      
      // The 100 should be replaced with 4 (the second highest value)
      expect(result).toEqual([2, 2, 3, 4, 4]);
    });

    it('should handle single value', () => {
      expect(winsorize([5], 0.1)).toEqual([5]);
    });

    it('should handle two values', () => {
      expect(winsorize([1, 100], 0.1)).toEqual([1, 100]);
    });

    it('should trim correct number of values', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = winsorize(arr, 0.2); // Should trim 2 values from each end
      
      // Should replace 1,2 with 3 and 9,10 with 8
      expect(result).toEqual([3, 3, 3, 4, 5, 6, 7, 8, 8, 8]);
    });

    it('should handle duplicate values', () => {
      const arr = [1, 1, 1, 5, 5, 5];
      const result = winsorize(arr, 0.2);
      expect(result).toEqual([1, 1, 1, 5, 5, 5]);
    });
  });

  describe('winsorizeByPair', () => {
    it('should winsorize returns per trading pair', () => {
      const returns = [
        { pair: 'BTC/USDC', return: 0.1 },
        { pair: 'BTC/USDC', return: 0.2 },
        { pair: 'BTC/USDC', return: 10.0 }, // outlier
        { pair: 'ETH/USDC', return: 0.05 },
        { pair: 'ETH/USDC', return: 0.15 },
        { pair: 'ETH/USDC', return: 5.0 }, // outlier
      ];

      const result = winsorizeByPair(returns, 0.2);
      
      // Should have same number of returns
      expect(result).toHaveLength(6);
      
      // BTC/USDC outliers should be winsorized
      const btcReturns = result.filter(r => r.pair === 'BTC/USDC').map(r => r.return);
      expect(btcReturns).not.toContain(10.0);
      
      // ETH/USDC outliers should be winsorized
      const ethReturns = result.filter(r => r.pair === 'ETH/USDC').map(r => r.return);
      expect(ethReturns).not.toContain(5.0);
    });

    it('should handle empty input', () => {
      expect(winsorizeByPair([])).toEqual([]);
    });

    it('should handle single pair', () => {
      const returns = [
        { pair: 'BTC/USDC', return: 0.1 },
        { pair: 'BTC/USDC', return: 0.2 },
      ];
      const result = winsorizeByPair(returns, 0.1);
      expect(result).toHaveLength(2);
    });
  });

  describe('getAlphaForSampleSize', () => {
    it('should return 0.10 for n < 20', () => {
      expect(getAlphaForSampleSize(1)).toBe(0.10);
      expect(getAlphaForSampleSize(10)).toBe(0.10);
      expect(getAlphaForSampleSize(19)).toBe(0.10);
    });

    it('should return 0.05 for n >= 20', () => {
      expect(getAlphaForSampleSize(20)).toBe(0.05);
      expect(getAlphaForSampleSize(50)).toBe(0.05);
      expect(getAlphaForSampleSize(100)).toBe(0.05);
    });
  });

  describe('winsorizedMean', () => {
    it('should calculate mean of winsorized data', () => {
      const arr = [1, 2, 3, 4, 100]; // 100 is outlier
      const result = winsorizedMean(arr, 0.2);
      
      // Should be mean of [2, 2, 3, 4, 4] = 3
      expect(result).toBe(3);
    });

    it('should return 0 for empty array', () => {
      expect(winsorizedMean([])).toBe(0);
    });

    it('should handle single value', () => {
      expect(winsorizedMean([5])).toBe(5);
    });
  });

  describe('winsorizedStd', () => {
    it('should calculate standard deviation of winsorized data', () => {
      const arr = [1, 2, 3, 4, 100]; // 100 is outlier
      const result = winsorizedStd(arr, 0.2);
      
      // Should be std of [2, 2, 3, 4, 4]
      const winsorized = [2, 2, 3, 4, 4];
      const mean = winsorized.reduce((s, x) => s + x, 0) / winsorized.length;
      const variance = winsorized.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / winsorized.length;
      const expected = Math.sqrt(variance);
      
      expect(result).toBeCloseTo(expected, 10);
    });

    it('should return 0 for empty array', () => {
      expect(winsorizedStd([])).toBe(0);
    });

    it('should return 0 for single value', () => {
      expect(winsorizedStd([5])).toBe(0);
    });

    it('should return 0 for identical values', () => {
      expect(winsorizedStd([5, 5, 5, 5])).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very small alpha', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = winsorize(arr, 0.01); // Very small alpha
      expect(result).toEqual(arr); // Should not change anything
    });

    it('should handle alpha close to 0.5', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = winsorize(arr, 0.49); // Close to 0.5
      expect(result).toEqual(arr); // Should not change anything
    });

    it('should handle negative values', () => {
      const arr = [-10, -5, 0, 5, 10];
      const result = winsorize(arr, 0.2);
      expect(result).toEqual([-5, -5, 0, 5, 5]);
    });

    it('should handle zero values', () => {
      const arr = [0, 0, 0, 1, 2];
      const result = winsorize(arr, 0.2);
      expect(result).toEqual([0, 0, 0, 1, 1]);
    });
  });
});
