/**
 * Unit tests for score calculation system
 */

import { describe, it, expect } from 'vitest';
import { 
  brierForInsight, 
  calculateBrierMetrics, 
  calculateCalibrationBins 
} from '../../lib/score';

describe('Score Calculation System', () => {
  describe('brierForInsight', () => {
    it('should calculate correct Brier score for YES outcome', () => {
      // Perfect prediction
      expect(brierForInsight(1.0, 'YES')).toBe(0);
      expect(brierForInsight(0.0, 'YES')).toBe(1);
      
      // Partial predictions
      expect(brierForInsight(0.8, 'YES')).toBeCloseTo(0.04); // (0.8 - 1)² = 0.04
      expect(brierForInsight(0.6, 'YES')).toBeCloseTo(0.16); // (0.6 - 1)² = 0.16
    });
    
    it('should calculate correct Brier score for NO outcome', () => {
      // Perfect prediction
      expect(brierForInsight(0.0, 'NO')).toBe(0);
      expect(brierForInsight(1.0, 'NO')).toBe(1);
      
      // Partial predictions
      expect(brierForInsight(0.2, 'NO')).toBeCloseTo(0.04); // (0.2 - 0)² = 0.04
      expect(brierForInsight(0.4, 'NO')).toBeCloseTo(0.16); // (0.4 - 0)² = 0.16
    });
    
    it('should return null for INVALID outcome', () => {
      expect(brierForInsight(0.5, 'INVALID')).toBe(null);
      expect(brierForInsight(0.9, 'INVALID')).toBe(null);
    });
    
    it('should clamp probabilities to [0, 1] range', () => {
      expect(brierForInsight(-0.1, 'YES')).toBe(1); // Clamped to 0, (0 - 1)² = 1
      expect(brierForInsight(1.1, 'YES')).toBe(0);  // Clamped to 1, (1 - 1)² = 0
    });
  });
  
  describe('calculateBrierMetrics', () => {
    it('should handle empty predictions', () => {
      const result = calculateBrierMetrics([]);
      expect(result.score).toBe(0);
      expect(result.count).toBe(0);
      expect(result.reliability).toBe(0);
      expect(result.resolution).toBe(0);
      expect(result.uncertainty).toBe(0);
    });
    
    it('should filter out INVALID outcomes', () => {
      const predictions = [
        { predicted: 0.8, actual: 'YES' as const },
        { predicted: 0.6, actual: 'INVALID' as const },
        { predicted: 0.3, actual: 'NO' as const }
      ];
      
      const result = calculateBrierMetrics(predictions);
      expect(result.count).toBe(2); // Only valid predictions counted
    });
    
    it('should calculate correct Brier score for perfect predictions', () => {
      const predictions = [
        { predicted: 1.0, actual: 'YES' as const },
        { predicted: 0.0, actual: 'NO' as const },
        { predicted: 1.0, actual: 'YES' as const },
        { predicted: 0.0, actual: 'NO' as const }
      ];
      
      const result = calculateBrierMetrics(predictions);
      expect(result.score).toBe(0); // Perfect predictions = 0 Brier score
      expect(result.count).toBe(4);
    });
    
    it('should calculate correct Brier score for worst predictions', () => {
      const predictions = [
        { predicted: 0.0, actual: 'YES' as const }, // (0 - 1)² = 1
        { predicted: 1.0, actual: 'NO' as const },  // (1 - 0)² = 1
        { predicted: 0.0, actual: 'YES' as const }, // (0 - 1)² = 1
        { predicted: 1.0, actual: 'NO' as const }   // (1 - 0)² = 1
      ];
      
      const result = calculateBrierMetrics(predictions);
      expect(result.score).toBe(1); // Worst predictions = 1 Brier score
      expect(result.count).toBe(4);
    });
    
    it('should calculate mixed predictions correctly', () => {
      const predictions = [
        { predicted: 0.8, actual: 'YES' as const }, // (0.8 - 1)² = 0.04
        { predicted: 0.6, actual: 'YES' as const }, // (0.6 - 1)² = 0.16
        { predicted: 0.2, actual: 'NO' as const },  // (0.2 - 0)² = 0.04
        { predicted: 0.4, actual: 'NO' as const }   // (0.4 - 0)² = 0.16
      ];
      
      const result = calculateBrierMetrics(predictions);
      const expectedScore = (0.04 + 0.16 + 0.04 + 0.16) / 4; // 0.1
      expect(result.score).toBeCloseTo(expectedScore);
      expect(result.count).toBe(4);
    });
  });
  
  describe('calculateCalibrationBins', () => {
    it('should handle empty predictions', () => {
      const bins = calculateCalibrationBins([]);
      expect(bins).toHaveLength(10); // Always 10 bins
      
      // All bins should be empty
      bins.forEach(bin => {
        expect(bin.count).toBe(0);
        expect(bin.actual).toBe(0);
      });
    });
    
    it('should place predictions in correct bins', () => {
      const predictions = [
        { predicted: 0.05, actual: 'YES' as const }, // Bin 0
        { predicted: 0.15, actual: 'NO' as const },  // Bin 1
        { predicted: 0.85, actual: 'YES' as const }, // Bin 8
        { predicted: 0.95, actual: 'YES' as const }  // Bin 9
      ];
      
      const bins = calculateCalibrationBins(predictions);
      
      expect(bins[0].count).toBe(1);
      expect(bins[0].actual).toBe(1); // 1 YES out of 1
      
      expect(bins[1].count).toBe(1);
      expect(bins[1].actual).toBe(0); // 0 YES out of 1
      
      expect(bins[8].count).toBe(1);
      expect(bins[8].actual).toBe(1); // 1 YES out of 1
      
      expect(bins[9].count).toBe(1);
      expect(bins[9].actual).toBe(1); // 1 YES out of 1
    });
    
    it('should handle edge case of 1.0 probability', () => {
      const predictions = [
        { predicted: 1.0, actual: 'YES' as const }
      ];
      
      const bins = calculateCalibrationBins(predictions);
      
      // 1.0 should go in bin 9 (last bin)
      expect(bins[9].count).toBe(1);
      expect(bins[9].actual).toBe(1);
    });
    
    it('should calculate correct averages for multiple predictions in same bin', () => {
      const predictions = [
        { predicted: 0.81, actual: 'YES' as const }, // Bin 8
        { predicted: 0.83, actual: 'NO' as const },  // Bin 8  
        { predicted: 0.87, actual: 'YES' as const }, // Bin 8
        { predicted: 0.89, actual: 'YES' as const }  // Bin 8
      ];
      
      const bins = calculateCalibrationBins(predictions);
      
      expect(bins[8].count).toBe(4);
      expect(bins[8].predicted).toBeCloseTo((0.81 + 0.83 + 0.87 + 0.89) / 4);
      expect(bins[8].actual).toBeCloseTo(3 / 4); // 3 YES out of 4
    });
    
    it('should calculate deviation correctly', () => {
      const predictions = [
        { predicted: 0.8, actual: 'YES' as const }, // Perfect calibration
        { predicted: 0.8, actual: 'NO' as const }   // Perfect calibration would be 50%
      ];
      
      const bins = calculateCalibrationBins(predictions);
      
      expect(bins[8].count).toBe(2);
      expect(bins[8].predicted).toBe(0.8);
      expect(bins[8].actual).toBe(0.5); // 1 YES out of 2
      expect(bins[8].deviation).toBeCloseTo(0.3); // |0.8 - 0.5| = 0.3
    });
    
    it('should filter out INVALID outcomes', () => {
      const predictions = [
        { predicted: 0.8, actual: 'YES' as const },
        { predicted: 0.8, actual: 'INVALID' as const },
        { predicted: 0.8, actual: 'NO' as const }
      ];
      
      const bins = calculateCalibrationBins(predictions);
      
      expect(bins[8].count).toBe(2); // Only valid outcomes counted
      expect(bins[8].actual).toBe(0.5); // 1 YES out of 2 valid
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle predictions at bin boundaries', () => {
      const predictions = [
        { predicted: 0.0, actual: 'NO' as const },   // Bin 0
        { predicted: 0.1, actual: 'NO' as const },   // Bin 1
        { predicted: 0.5, actual: 'YES' as const },  // Bin 5
        { predicted: 0.9, actual: 'YES' as const },  // Bin 9
        { predicted: 1.0, actual: 'YES' as const }   // Bin 9 (edge case)
      ];
      
      const bins = calculateCalibrationBins(predictions);
      
      expect(bins[0].count).toBe(1);
      expect(bins[1].count).toBe(1);
      expect(bins[5].count).toBe(1);
      expect(bins[9].count).toBe(2); // Both 0.9 and 1.0
    });
    
    it('should handle very small probability differences', () => {
      const predictions = [
        { predicted: 0.5000001, actual: 'YES' as const },
        { predicted: 0.4999999, actual: 'NO' as const }
      ];
      
      const bins = calculateCalibrationBins(predictions);
      
      // Both should be in bin 4 or 5, depending on rounding
      const totalCount = bins.reduce((sum, bin) => sum + bin.count, 0);
      expect(totalCount).toBe(2);
    });
  });
});
