export interface SmartDefaults {
  portfolioValueUsd: number;
  recommendedSizePct: number;
  recommendedSizeUsd: number;
  maxPositionPct: number;
  dailyLossCapPct: number;
  minLiquidityUsd: number;
  maxSlippageBps: number;
}

export interface WalletSnapshot {
  totalValueUsd: number;
  holdings: Array<{
    asset: string;
    amount: number;
    valueUsd: number;
  }>;
}

/**
 * Get smart defaults for trading based on wallet snapshot
 */
export function getSmartDefaults(
  walletSnapshot: WalletSnapshot,
  side: 'BUY' | 'SELL',
  base: string,
  quote: string
): SmartDefaults {
  const portfolioValue = walletSnapshot.totalValueUsd;
  
  // Conservative defaults based on portfolio size
  let recommendedSizePct: number;
  let maxPositionPct: number;
  let dailyLossCapPct: number;
  
  if (portfolioValue < 1000) {
    // Small portfolio - more aggressive
    recommendedSizePct = 5;
    maxPositionPct = 20;
    dailyLossCapPct = 5;
  } else if (portfolioValue < 10000) {
    // Medium portfolio - balanced
    recommendedSizePct = 3;
    maxPositionPct = 15;
    dailyLossCapPct = 3;
  } else {
    // Large portfolio - conservative
    recommendedSizePct = 2;
    maxPositionPct = 10;
    dailyLossCapPct = 2;
  }

  return {
    portfolioValueUsd: portfolioValue,
    recommendedSizePct,
    recommendedSizeUsd: (portfolioValue * recommendedSizePct) / 100,
    maxPositionPct,
    dailyLossCapPct,
    minLiquidityUsd: 50000, // $50k minimum liquidity
    maxSlippageBps: 30, // 0.3% max slippage
  };
}