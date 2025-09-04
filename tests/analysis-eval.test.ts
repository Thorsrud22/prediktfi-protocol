import { describe, it, expect } from 'vitest';
import {
  calculateCoverage,
  calculateDirection,
  calculateConsistency,
  generateMockMarketData,
  createSyntheticHistoricalData,
  evaluateEngine,
  type HistoricalDataPoint,
} from '../src/lib/analysis/eval';

describe('Analysis Evaluation Metrics', () => {
  describe('calculateCoverage', () => {
    it('should return 0 for empty data', () => {
      expect(calculateCoverage([])).toBe(0);
    });

    it('should return 100% when all prices are within intervals', () => {
      const data: HistoricalDataPoint[] = [
        {
          date: '2024-01-01',
          price: 50000,
          prediction: {
            probability: 0.6,
            interval: { low: 49000, high: 51000 },
            technical_signal: 0.2,
            sentiment_signal: 0.1,
          },
        },
        {
          date: '2024-01-02',
          price: 50500,
          prediction: {
            probability: 0.7,
            interval: { low: 49500, high: 52000 },
            technical_signal: 0.3,
            sentiment_signal: 0.2,
          },
        },
      ];

      expect(calculateCoverage(data)).toBe(100);
    });

    it('should return 50% when half the prices are within intervals', () => {
      const data: HistoricalDataPoint[] = [
        {
          date: '2024-01-01',
          price: 52000, // Outside interval
          prediction: {
            probability: 0.6,
            interval: { low: 49000, high: 51000 },
            technical_signal: 0.2,
            sentiment_signal: 0.1,
          },
        },
        {
          date: '2024-01-02',
          price: 50500, // Within interval
          prediction: {
            probability: 0.7,
            interval: { low: 49500, high: 52000 },
            technical_signal: 0.3,
            sentiment_signal: 0.2,
          },
        },
      ];

      expect(calculateCoverage(data)).toBe(50);
    });
  });

  describe('calculateDirection', () => {
    it('should return 0 for insufficient data', () => {
      expect(calculateDirection([])).toBe(0);
      expect(calculateDirection([{
        date: '2024-01-01',
        price: 50000,
        prediction: {
          probability: 0.6,
          interval: { low: 49000, high: 51000 },
          technical_signal: 0.2,
          sentiment_signal: 0.1,
        },
      }])).toBe(0);
    });

    it('should calculate correct direction accuracy', () => {
      const data: HistoricalDataPoint[] = [
        {
          date: '2024-01-01',
          price: 50000,
          prediction: {
            probability: 0.4, // Low confidence, should be ignored
            interval: { low: 49000, high: 51000 },
            technical_signal: 0.2,
            sentiment_signal: 0.1,
          },
        },
        {
          date: '2024-01-02',
          price: 51000, // Price went up
          prediction: {
            probability: 0.7, // Predicted up (>0.5), correct
            interval: { low: 49500, high: 52000 },
            technical_signal: 0.3,
            sentiment_signal: 0.2,
          },
        },
        {
          date: '2024-01-03',
          price: 50500, // Price went down
          prediction: {
            probability: 0.3, // Predicted down (<0.5), correct
            interval: { low: 49000, high: 51500 },
            technical_signal: -0.2,
            sentiment_signal: -0.1,
          },
        },
      ];

      // Only the second prediction (0.7 probability) should be counted
      // It was correct (price went up, probability > 0.5)
      expect(calculateDirection(data)).toBe(100);
    });
  });

  describe('calculateConsistency', () => {
    it('should return 0 for insufficient data', () => {
      expect(calculateConsistency([])).toBe(0);
    });

    it('should return positive correlation for aligned signals', () => {
      const data: HistoricalDataPoint[] = [
        {
          date: '2024-01-01',
          price: 50000,
          prediction: {
            probability: 0.6,
            interval: { low: 49000, high: 51000 },
            technical_signal: 0.5,
            sentiment_signal: 0.4,
          },
        },
        {
          date: '2024-01-02',
          price: 50500,
          prediction: {
            probability: 0.7,
            interval: { low: 49500, high: 52000 },
            technical_signal: 0.8,
            sentiment_signal: 0.7,
          },
        },
        {
          date: '2024-01-03',
          price: 49500,
          prediction: {
            probability: 0.3,
            interval: { low: 48500, high: 50500 },
            technical_signal: -0.3,
            sentiment_signal: -0.2,
          },
        },
      ];

      const consistency = calculateConsistency(data);
      expect(consistency).toBeGreaterThan(0.5); // Should be positively correlated
    });
  });

  describe('generateMockMarketData', () => {
    it('should generate correct number of data points', () => {
      const mockData = generateMockMarketData(50000, 10, 0.02);
      
      expect(mockData.dates).toHaveLength(10);
      expect(mockData.prices).toHaveLength(10);
      expect(mockData.prices[0]).toBe(50000);
    });

    it('should generate reasonable price movements', () => {
      const mockData = generateMockMarketData(50000, 100, 0.02);
      
      // Prices should be positive
      mockData.prices.forEach(price => {
        expect(price).toBeGreaterThan(0);
      });

      // Should have some variation
      const uniquePrices = new Set(mockData.prices);
      expect(uniquePrices.size).toBeGreaterThan(50); // Most prices should be unique
    });
  });

  describe('evaluateEngine', () => {
    it('should return evaluation metrics within reasonable ranges', () => {
      const metrics = evaluateEngine('7d');
      
      expect(metrics.coverage).toBeGreaterThanOrEqual(0);
      expect(metrics.coverage).toBeLessThanOrEqual(100);
      
      expect(metrics.direction).toBeGreaterThanOrEqual(0);
      expect(metrics.direction).toBeLessThanOrEqual(100);
      
      expect(metrics.consistency).toBeGreaterThanOrEqual(-1);
      expect(metrics.consistency).toBeLessThanOrEqual(1);
    });

    it('should work for different horizons', () => {
      const metrics24h = evaluateEngine('24h');
      const metrics7d = evaluateEngine('7d');
      const metrics30d = evaluateEngine('30d');
      
      [metrics24h, metrics7d, metrics30d].forEach(metrics => {
        expect(typeof metrics.coverage).toBe('number');
        expect(typeof metrics.direction).toBe('number');
        expect(typeof metrics.consistency).toBe('number');
      });
    });
  });
});
