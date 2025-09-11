/**
 * Feature Vector Schema for Model v1
 * 
 * Defines the feature space for logistic regression baseline
 * All features are normalized to [0, 1] range for stable training
 */

export type FeatureVector = {
  // Market odds features
  odds_mid: number;        // Mid-point of bid/ask spread (0-1)
  odds_spread: number;     // Bid-ask spread as fraction (0-1)
  liquidity: number;       // Market liquidity score (0-1)
  
  // Funding rate features
  funding_8h: number;      // 8-hour funding rate (0-1)
  funding_1d: number;      // 24-hour funding rate (0-1)
  
  // Market sentiment
  fgi: number;             // Fear & Greed Index (0-1)
  
  // Historical performance
  pnl30d: number;          // 30-day PnL (0-1)
  vol30d: number;          // 30-day volatility (0-1)
};

export type LabeledDataPoint = {
  features: FeatureVector;
  label: boolean;          // true = YES outcome, false = NO outcome
  timestamp: Date;
  insightId: string;
  maturityDate: Date;
};

/**
 * Feature normalization ranges
 * Used to scale raw market data to [0, 1] range
 */
export const FEATURE_RANGES = {
  odds_mid: { min: 0.1, max: 0.9 },
  odds_spread: { min: 0.0, max: 0.2 },
  liquidity: { min: 0.0, max: 1000000 }, // USD volume
  funding_8h: { min: -0.01, max: 0.01 }, // -1% to +1%
  funding_1d: { min: -0.05, max: 0.05 }, // -5% to +5%
  fgi: { min: 0, max: 100 },
  pnl30d: { min: -0.5, max: 0.5 }, // -50% to +50%
  vol30d: { min: 0.0, max: 2.0 }, // 0% to 200%
} as const;

/**
 * Normalize a feature value to [0, 1] range
 */
export function normalizeFeature(
  feature: keyof FeatureVector,
  value: number
): number {
  // Handle NaN, Infinity, and null/undefined values
  if (value == null || !isFinite(value) || isNaN(value)) {
    // Return middle of range for invalid values
    const range = FEATURE_RANGES[feature];
    return (range.min + range.max) / 2;
  }
  
  const range = FEATURE_RANGES[feature];
  const normalized = (value - range.min) / (range.max - range.min);
  return Math.max(0, Math.min(1, normalized)); // Clamp to [0, 1]
}

/**
 * Denormalize a feature value from [0, 1] back to original range
 */
export function denormalizeFeature(
  feature: keyof FeatureVector,
  normalizedValue: number
): number {
  const range = FEATURE_RANGES[feature];
  return normalizedValue * (range.max - range.min) + range.min;
}

/**
 * Create feature vector from raw market data
 */
export function createFeatureVector(rawData: {
  oddsMid?: number;
  oddsSpread?: number;
  liquidity?: number;
  funding8h?: number;
  funding1d?: number;
  fgi?: number;
  pnl30d?: number;
  vol30d?: number;
}): FeatureVector {
  // Convert string values to numbers and handle invalid inputs
  const safeData = {
    oddsMid: typeof rawData.oddsMid === 'string' ? parseFloat(rawData.oddsMid) : rawData.oddsMid,
    oddsSpread: typeof rawData.oddsSpread === 'string' ? parseFloat(rawData.oddsSpread) : rawData.oddsSpread,
    liquidity: typeof rawData.liquidity === 'string' ? parseFloat(rawData.liquidity) : rawData.liquidity,
    funding8h: typeof rawData.funding8h === 'string' ? parseFloat(rawData.funding8h) : rawData.funding8h,
    funding1d: typeof rawData.funding1d === 'string' ? parseFloat(rawData.funding1d) : rawData.funding1d,
    fgi: typeof rawData.fgi === 'string' ? parseFloat(rawData.fgi) : rawData.fgi,
    pnl30d: typeof rawData.pnl30d === 'string' ? parseFloat(rawData.pnl30d) : rawData.pnl30d,
    vol30d: typeof rawData.vol30d === 'string' ? parseFloat(rawData.vol30d) : rawData.vol30d,
  };

  return {
    odds_mid: normalizeFeature('odds_mid', safeData.oddsMid ?? 0.5),
    odds_spread: normalizeFeature('odds_spread', safeData.oddsSpread ?? 0.05),
    liquidity: normalizeFeature('liquidity', safeData.liquidity ?? 100000),
    funding_8h: normalizeFeature('funding_8h', safeData.funding8h ?? 0),
    funding_1d: normalizeFeature('funding_1d', safeData.funding1d ?? 0),
    fgi: normalizeFeature('fgi', safeData.fgi ?? 50),
    pnl30d: normalizeFeature('pnl30d', safeData.pnl30d ?? 0),
    vol30d: normalizeFeature('vol30d', safeData.vol30d ?? 0.1),
  };
}

/**
 * Feature importance weights (for interpretability)
 */
export const FEATURE_IMPORTANCE = {
  odds_mid: 0.25,      // Most important - market consensus
  odds_spread: 0.15,   // Market efficiency indicator
  liquidity: 0.20,     // Market depth
  funding_8h: 0.10,    // Short-term sentiment
  funding_1d: 0.10,    // Medium-term sentiment
  fgi: 0.10,           // Market sentiment
  pnl30d: 0.05,        // Historical performance
  vol30d: 0.05,        // Risk indicator
} as const;
