/**
 * Price interval estimation using ATR or volatility measures
 */

import { getCalibration } from './calibration';

export interface PriceInterval {
  low: number;
  high: number;
  width: number;
  source: 'atr' | 'stdev';
  note: string;
}

/**
 * Calculate price interval for given horizon using ATR or fallback to standard deviation
 */
export function estimateInterval(
  currentPrice: number,
  atr: number | null,
  recentPrices: number[], // Last 20 prices for stdev fallback
  horizon: '24h' | '7d' | '30d'
): PriceInterval {
  const calibration = getCalibration();
  const multiplier = calibration.intervals.multipliers[horizon];
  
  let volatilityMeasure: number;
  let source: 'atr' | 'stdev';
  let note: string;

  // Use ATR if available, otherwise fallback to standard deviation
  if (atr !== null && !isNaN(atr) && atr > 0) {
    volatilityMeasure = atr;
    source = 'atr';
    note = `Using ATR-based volatility with ${multiplier}x multiplier for ${horizon}`;
  } else {
    // Fallback to standard deviation of last 20 prices
    if (recentPrices.length < 2) {
      // Emergency fallback: use 2% of current price
      volatilityMeasure = currentPrice * 0.02;
      source = 'stdev';
      note = `Using emergency 2% fallback due to insufficient price history`;
    } else {
      volatilityMeasure = calculateStandardDeviation(recentPrices);
      source = 'stdev';
      note = `Using ${recentPrices.length}-period standard deviation with ${multiplier}x multiplier for ${horizon}`;
    }
  }

  // Calculate interval width
  const width = multiplier * volatilityMeasure;
  
  // Calculate bounds
  const low = currentPrice - width;
  const high = currentPrice + width;

  return {
    low: Math.max(0, low), // Ensure non-negative prices
    high,
    width,
    source,
    note,
  };
}

/**
 * Calculate standard deviation of price array
 */
function calculateStandardDeviation(prices: number[]): number {
  if (prices.length < 2) {
    return 0;
  }

  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const squaredDiffs = prices.map(price => Math.pow(price - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / (prices.length - 1);
  
  return Math.sqrt(variance);
}

/**
 * Validate price interval makes sense
 */
export function validateInterval(interval: PriceInterval, currentPrice: number): boolean {
  return (
    interval.low >= 0 &&
    interval.high > interval.low &&
    interval.low < currentPrice &&
    interval.high > currentPrice &&
    interval.width > 0
  );
}
