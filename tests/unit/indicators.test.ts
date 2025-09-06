import { describe, it, expect } from 'vitest';
import { 
  calculateSMA, 
  calculateEMA, 
  calculateRSI, 
  calculateATR,
  findSupportResistance,
  determineTrend,
  computeIndicators
} from '../../app/api/insights/_indicators';

describe('Technical Indicators', () => {
  const samplePrices = [100, 102, 101, 103, 105, 104, 106, 108, 107, 109];

  describe('calculateSMA', () => {
    it('should calculate simple moving average correctly', () => {
      const sma5 = calculateSMA(samplePrices, 5);
      // Last 5 prices: [105, 104, 106, 108, 107] = average 106
      expect(sma5).toBeCloseTo(106, 1); // Average of last 5 prices
    });

    it('should handle insufficient data', () => {
      const shortPrices = [100, 101];
      const sma5 = calculateSMA(shortPrices, 5);
      expect(sma5).toBe(101); // Should return last price
    });

    it('should handle empty array', () => {
      const sma = calculateSMA([], 5);
      expect(sma).toBe(0);
    });
  });

  describe('calculateEMA', () => {
    it('should calculate exponential moving average', () => {
      const ema5 = calculateEMA(samplePrices, 5);
      expect(ema5).toBeGreaterThan(100);
      expect(ema5).toBeLessThan(110);
    });

    it('should handle single price', () => {
      const ema = calculateEMA([100], 5);
      expect(ema).toBe(100);
    });
  });

  describe('calculateRSI', () => {
    it('should calculate RSI within valid range', () => {
      const rsi = calculateRSI(samplePrices, 5);
      expect(rsi).toBeGreaterThanOrEqual(0);
      expect(rsi).toBeLessThanOrEqual(100);
    });

    it('should return neutral RSI for insufficient data', () => {
      const shortPrices = [100];
      const rsi = calculateRSI(shortPrices, 14);
      expect(rsi).toBe(50);
    });

    it('should handle trending up prices', () => {
      const trendingUp = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
      const rsi = calculateRSI(trendingUp, 14);
      expect(rsi).toBeGreaterThan(70); // Should be overbought
    });
  });

  describe('calculateATR', () => {
    it('should calculate Average True Range', () => {
      const highs = samplePrices.map(p => p * 1.02);
      const lows = samplePrices.map(p => p * 0.98);
      const atr = calculateATR(highs, lows, samplePrices, 5);
      expect(atr).toBeGreaterThan(0);
    });

    it('should handle insufficient data', () => {
      const atr = calculateATR([100], [99], [99.5], 5);
      expect(atr).toBe(0);
    });
  });

  describe('findSupportResistance', () => {
    it('should find support and resistance levels', () => {
      const { support, resistance } = findSupportResistance(samplePrices);
      expect(support).toBeLessThan(resistance);
      expect(support).toBeGreaterThan(0);
      expect(resistance).toBeGreaterThan(0);
    });

    it('should handle minimal data', () => {
      const { support, resistance } = findSupportResistance([100, 101]);
      expect(support).toBe(100);
      expect(resistance).toBe(101);
    });
  });

  describe('determineTrend', () => {
    it('should identify upward trend', () => {
      const { trend, strength } = determineTrend(105, 103, 106, 60);
      expect(trend).toBe('up');
      expect(strength).toBeGreaterThan(0);
    });

    it('should identify downward trend', () => {
      const { trend, strength } = determineTrend(102, 105, 101, 30);
      expect(trend).toBe('down');
      expect(strength).toBeGreaterThan(0);
    });

    it('should identify neutral trend', () => {
      const { trend } = determineTrend(104, 104, 104, 50);
      expect(trend).toBe('neutral');
    });
  });

  describe('computeIndicators', () => {
    it('should compute all indicators for market data', () => {
      const marketData = [{
        symbol: 'BTC',
        prices: samplePrices,
        volumes: samplePrices.map(() => 1000),
        timestamps: samplePrices.map((_, i) => Date.now() - i * 1000),
      }];

      const indicators = computeIndicators(marketData);

      expect(indicators.rsi).toBeGreaterThanOrEqual(0);
      expect(indicators.rsi).toBeLessThanOrEqual(100);
      expect(indicators.sma20).toBeGreaterThan(0);
      expect(indicators.sma50).toBeGreaterThan(0);
      expect(['up', 'down', 'neutral']).toContain(indicators.trend);
      expect(indicators.strength).toBeGreaterThanOrEqual(0);
      expect(indicators.strength).toBeLessThanOrEqual(1);
    });

    it('should handle empty market data', () => {
      const indicators = computeIndicators([]);
      expect(indicators.rsi).toBe(50);
      expect(indicators.trend).toBe('neutral');
      expect(indicators.strength).toBe(0);
    });
  });
});
