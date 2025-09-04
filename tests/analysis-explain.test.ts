import { describe, it, expect } from 'vitest';
import {
  buildDrivers,
  computeConfidence,
  validateDriverWeights,
  type ExplanationContext,
} from '../src/lib/analysis/explain';

describe('Analysis Explanation and Drivers', () => {
  describe('buildDrivers', () => {
    it('should return 3 drivers sorted by weight', () => {
      const context: ExplanationContext = {
        technical: {
          score: 0.7,
          rsi: 75,
          volatility_regime: 'high',
          trend_direction: 'up',
        },
        sentiment: {
          score: 0.5,
          fng_value: 80,
          fng_classification: 'Extreme Greed',
        },
        risk: {
          score: 0.3,
          volatility_level: 'high',
          market_stress: true,
        },
        data_quality: {
          completeness: 0.9,
          freshness: 0.8,
        },
      };

      const drivers = buildDrivers(context);
      
      expect(drivers).toHaveLength(3);
      expect(drivers[0].weight).toBeGreaterThanOrEqual(drivers[1].weight);
      expect(drivers[1].weight).toBeGreaterThanOrEqual(drivers[2].weight);
      
      // Check all drivers have required fields
      drivers.forEach(driver => {
        expect(driver).toHaveProperty('label');
        expect(driver).toHaveProperty('weight');
        expect(driver).toHaveProperty('contribution_note');
        expect(typeof driver.weight).toBe('number');
        expect(typeof driver.label).toBe('string');
        expect(typeof driver.contribution_note).toBe('string');
      });
    });

    it('should have weights rounded to 2 decimals', () => {
      const context: ExplanationContext = {
        technical: { score: 0.6 },
        sentiment: { score: 0.5 },
        risk: { score: 0.4 },
        data_quality: { completeness: 0.8, freshness: 0.7 },
      };

      const drivers = buildDrivers(context);
      
      drivers.forEach(driver => {
        const decimalPlaces = (driver.weight.toString().split('.')[1] || '').length;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      });
    });

    it('should generate appropriate technical notes', () => {
      const context: ExplanationContext = {
        technical: {
          score: 0.8,
          rsi: 75, // Overbought
          volatility_regime: 'high',
          trend_direction: 'up',
        },
        sentiment: { score: 0.5 },
        risk: { score: 0.3 },
        data_quality: { completeness: 0.9, freshness: 0.8 },
      };

      const drivers = buildDrivers(context);
      const technicalDriver = drivers.find(d => d.label === 'Technical Analysis');
      
      expect(technicalDriver).toBeDefined();
      expect(technicalDriver!.contribution_note).toContain('overbought');
    });

    it('should generate appropriate sentiment notes', () => {
      const context: ExplanationContext = {
        technical: { score: 0.5 },
        sentiment: {
          score: 0.6,
          fng_value: 20, // Extreme fear
          fng_classification: 'Extreme Fear',
        },
        risk: { score: 0.3 },
        data_quality: { completeness: 0.9, freshness: 0.8 },
      };

      const drivers = buildDrivers(context);
      const sentimentDriver = drivers.find(d => d.label === 'Market Sentiment');
      
      expect(sentimentDriver).toBeDefined();
      expect(sentimentDriver!.contribution_note).toContain('Extreme fear');
    });
  });

  describe('computeConfidence', () => {
    it('should return confidence between 0 and 1', () => {
      const result = computeConfidence(0.8, 0.7, 1.5);
      
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.reasons).toHaveLength(3);
    });

    it('should give high confidence for good conditions', () => {
      const result = computeConfidence(
        0.95, // High data quality
        0.9,  // High consistency 
        0.8   // Low volatility
      );
      
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.reasons).toContain('High data quality and freshness');
      expect(result.reasons).toContain('Strong agreement between indicators');
    });

    it('should penalize high volatility', () => {
      const lowVol = computeConfidence(0.8, 0.7, 1.0);
      const highVol = computeConfidence(0.8, 0.7, 3.0);
      
      expect(lowVol.confidence).toBeGreaterThan(highVol.confidence);
      expect(highVol.reasons.some(r => r.includes('volatility'))).toBe(true);
    });

    it('should bonus high consistency', () => {
      const lowConsistency = computeConfidence(0.8, 0.5, 1.5);
      const highConsistency = computeConfidence(0.8, 0.9, 1.5);
      
      expect(highConsistency.confidence).toBeGreaterThan(lowConsistency.confidence);
    });

    it('should round confidence to 2 decimals', () => {
      const result = computeConfidence(0.856789, 0.734512, 1.234567);
      
      const decimalPlaces = (result.confidence.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });

    it('should clamp extreme values', () => {
      // Test lower bound
      const veryLow = computeConfidence(0.1, 0.1, 5.0); // Should get penalized heavily
      expect(veryLow.confidence).toBeGreaterThanOrEqual(0);
      
      // Test upper bound  
      const veryHigh = computeConfidence(1.0, 1.0, 0.1); // Perfect conditions
      expect(veryHigh.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('validateDriverWeights', () => {
    it('should return true when weights sum to 1', () => {
      const drivers = [
        { label: 'A', weight: 0.5, contribution_note: 'test' },
        { label: 'B', weight: 0.3, contribution_note: 'test' },
        { label: 'C', weight: 0.2, contribution_note: 'test' },
      ];
      
      expect(validateDriverWeights(drivers)).toBe(true);
    });

    it('should return false when weights do not sum to 1', () => {
      const drivers = [
        { label: 'A', weight: 0.6, contribution_note: 'test' },
        { label: 'B', weight: 0.3, contribution_note: 'test' },
        { label: 'C', weight: 0.2, contribution_note: 'test' },
      ];
      
      expect(validateDriverWeights(drivers)).toBe(false);
    });

    it('should allow small tolerance (1%)', () => {
      const drivers = [
        { label: 'A', weight: 0.5, contribution_note: 'test' },
        { label: 'B', weight: 0.3, contribution_note: 'test' },
        { label: 'C', weight: 0.205, contribution_note: 'test' }, // 1.005 total
      ];
      
      expect(validateDriverWeights(drivers)).toBe(true);
    });
  });
});
