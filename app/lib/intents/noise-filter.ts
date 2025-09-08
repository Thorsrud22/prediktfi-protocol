/**
 * Noise Filter for trading intents
 * Prevents suggesting intents under min-size/liquidity and during spread spikes
 */

export interface NoiseFilterConfig {
  minSizeUsd: number;
  minLiquidityUsd: number;
  maxSpreadBps: number;
  spreadSpikeCooldownMs: number;
}

export interface MarketConditions {
  price: number;
  liquidityUsd: number;
  spreadBps: number;
  volume24h: number;
  lastSpreadSpike?: Date;
}

export interface NoiseFilterResult {
  shouldBlock: boolean;
  reason?: string;
  cooldownRemaining?: number;
}

const DEFAULT_CONFIG: NoiseFilterConfig = {
  minSizeUsd: 100, // Minimum $100 trade size
  minLiquidityUsd: 50000, // Minimum $50k liquidity
  maxSpreadBps: 200, // Maximum 2% spread
  spreadSpikeCooldownMs: 5 * 60 * 1000 // 5 minutes cooldown after spread spike
};

// In-memory store for spread spike tracking
const spreadSpikeTracker = new Map<string, Date>();

/**
 * Check if intent should be blocked by noise filter
 */
export function checkNoiseFilter(
  sizeUsd: number,
  marketConditions: MarketConditions,
  config: NoiseFilterConfig = DEFAULT_CONFIG
): NoiseFilterResult {
  // Check minimum size
  if (sizeUsd < config.minSizeUsd) {
    return {
      shouldBlock: true,
      reason: `Trade size too small: $${sizeUsd.toFixed(2)} < $${config.minSizeUsd}`
    };
  }

  // Check minimum liquidity
  if (marketConditions.liquidityUsd < config.minLiquidityUsd) {
    return {
      shouldBlock: true,
      reason: `Insufficient liquidity: $${marketConditions.liquidityUsd.toLocaleString()} < $${config.minLiquidityUsd.toLocaleString()}`
    };
  }

  // Check spread
  if (marketConditions.spreadBps > config.maxSpreadBps) {
    return {
      shouldBlock: true,
      reason: `Spread too high: ${marketConditions.spreadBps}bps > ${config.maxSpreadBps}bps`
    };
  }

  // Check for recent spread spike
  const marketKey = `${marketConditions.price}_${marketConditions.liquidityUsd}`;
  const lastSpike = spreadSpikeTracker.get(marketKey);
  
  if (lastSpike) {
    const timeSinceSpike = Date.now() - lastSpike.getTime();
    if (timeSinceSpike < config.spreadSpikeCooldownMs) {
      const cooldownRemaining = Math.ceil((config.spreadSpikeCooldownMs - timeSinceSpike) / 1000);
      return {
        shouldBlock: true,
        reason: `Still-off period after spread spike: ${cooldownRemaining}s remaining`,
        cooldownRemaining
      };
    }
  }

  return {
    shouldBlock: false
  };
}

/**
 * Record a spread spike for cooldown tracking
 */
export function recordSpreadSpike(marketConditions: MarketConditions): void {
  const marketKey = `${marketConditions.price}_${marketConditions.liquidityUsd}`;
  spreadSpikeTracker.set(marketKey, new Date());
  
  // Clean up old entries (older than 1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [key, timestamp] of spreadSpikeTracker.entries()) {
    if (timestamp < oneHourAgo) {
      spreadSpikeTracker.delete(key);
    }
  }
}

/**
 * Get current market conditions from price data
 */
export async function getMarketConditions(
  base: string,
  quote: string
): Promise<MarketConditions | null> {
  try {
    // This would typically fetch from a price API
    // For now, return mock data
    return {
      price: 100, // Mock price
      liquidityUsd: 100000, // Mock liquidity
      spreadBps: 50, // Mock spread
      volume24h: 1000000 // Mock volume
    };
  } catch (error) {
    console.error('Failed to get market conditions:', error);
    return null;
  }
}

/**
 * Enhanced noise filter with market data fetching
 */
export async function checkNoiseFilterWithMarketData(
  sizeUsd: number,
  base: string,
  quote: string,
  config: NoiseFilterConfig = DEFAULT_CONFIG
): Promise<NoiseFilterResult> {
  const marketConditions = await getMarketConditions(base, quote);
  
  if (!marketConditions) {
    return {
      shouldBlock: true,
      reason: 'Unable to fetch market conditions'
    };
  }

  return checkNoiseFilter(sizeUsd, marketConditions, config);
}
