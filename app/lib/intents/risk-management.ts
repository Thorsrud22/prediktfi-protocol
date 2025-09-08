/**
 * Enhanced Risk Management System
 * Per-asset loss caps + global daily cap with server-side guards
 */

import { prisma } from '../prisma';

export interface AssetLossCap {
  id: string;
  walletId: string;
  asset: string;
  maxLossPct: number;
  currentLossPct: number;
  dailyLossUsd: number;
  isActive: boolean;
}

export interface DailyLossCap {
  id: string;
  walletId: string;
  maxDailyLossPct: number;
  currentLossPct: number;
  dailyLossUsd: number;
  date: Date;
  isActive: boolean;
}

export interface RiskViolation {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  asset?: string;
  currentLossPct?: number;
  maxLossPct?: number;
  dailyLossUsd?: number;
  maxDailyLossUsd?: number;
}

export interface PortfolioSnapshot {
  walletId: string;
  totalValueUsd: number;
  holdings: Array<{
    asset: string;
    symbol: string;
    amount: number;
    valueUsd: number;
  }>;
}

/**
 * Get or create asset loss cap for a wallet
 */
export async function getOrCreateAssetLossCap(
  walletId: string,
  asset: string,
  maxLossPct: number = 5.0
): Promise<AssetLossCap> {
  let cap = await prisma.assetLossCap.findUnique({
    where: { walletId_asset: { walletId, asset } }
  });

  if (!cap) {
    cap = await prisma.assetLossCap.create({
      data: {
        walletId,
        asset,
        maxLossPct,
        currentLossPct: 0.0,
        dailyLossUsd: 0.0,
        isActive: true
      }
    });
  }

  return cap;
}

/**
 * Get or create daily loss cap for a wallet
 */
export async function getOrCreateDailyLossCap(
  walletId: string,
  maxDailyLossPct: number = 10.0
): Promise<DailyLossCap> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let cap = await prisma.dailyLossCap.findUnique({
    where: { walletId_date: { walletId, date: today } }
  });

  if (!cap) {
    cap = await prisma.dailyLossCap.create({
      data: {
        walletId,
        maxDailyLossPct,
        currentLossPct: 0.0,
        dailyLossUsd: 0.0,
        date: today,
        isActive: true
      }
    });
  }

  return cap;
}

/**
 * Check per-asset loss cap
 */
export async function checkAssetLossCap(
  walletId: string,
  asset: string,
  portfolio: PortfolioSnapshot,
  tradeLossUsd: number
): Promise<RiskViolation | null> {
  const cap = await getOrCreateAssetLossCap(walletId, asset);
  
  if (!cap.isActive) {
    return null;
  }

  // Find asset holding
  const holding = portfolio.holdings.find(h => h.symbol === asset);
  if (!holding) {
    return null; // No holding to lose from
  }

  // Calculate new loss percentage
  const newDailyLossUsd = cap.dailyLossUsd + Math.abs(tradeLossUsd);
  const newLossPct = (newDailyLossUsd / holding.valueUsd) * 100;

  if (newLossPct > cap.maxLossPct) {
    return {
      code: 'ASSET_LOSS_CAP_EXCEEDED',
      message: `Asset ${asset} loss would exceed cap of ${cap.maxLossPct}% (${newLossPct.toFixed(1)}%)`,
      severity: 'error',
      asset,
      currentLossPct: newLossPct,
      maxLossPct: cap.maxLossPct,
      dailyLossUsd: newDailyLossUsd
    };
  }

  return null;
}

/**
 * Check global daily loss cap
 */
export async function checkDailyLossCap(
  walletId: string,
  portfolio: PortfolioSnapshot,
  tradeLossUsd: number
): Promise<RiskViolation | null> {
  const cap = await getOrCreateDailyLossCap(walletId);
  
  if (!cap.isActive) {
    return null;
  }

  // Calculate new daily loss
  const newDailyLossUsd = cap.dailyLossUsd + Math.abs(tradeLossUsd);
  const newLossPct = (newDailyLossUsd / portfolio.totalValueUsd) * 100;

  if (newLossPct > cap.maxDailyLossPct) {
    return {
      code: 'DAILY_LOSS_CAP_EXCEEDED',
      message: `Daily loss would exceed cap of ${cap.maxDailyLossPct}% (${newLossPct.toFixed(1)}%)`,
      severity: 'error',
      currentLossPct: newLossPct,
      maxLossPct: cap.maxDailyLossPct,
      dailyLossUsd: newDailyLossUsd,
      maxDailyLossUsd: (portfolio.totalValueUsd * cap.maxDailyLossPct) / 100
    };
  }

  return null;
}

/**
 * Update loss caps after trade execution
 */
export async function updateLossCaps(
  walletId: string,
  asset: string,
  portfolio: PortfolioSnapshot,
  tradeLossUsd: number
): Promise<void> {
  const lossUsd = Math.abs(tradeLossUsd);
  
  // Update asset loss cap
  await prisma.assetLossCap.updateMany({
    where: { walletId, asset },
    data: {
      dailyLossUsd: { increment: lossUsd },
      currentLossPct: {
        increment: (lossUsd / portfolio.holdings.find(h => h.symbol === asset)?.valueUsd || 1) * 100
      }
    }
  });

  // Update daily loss cap
  await prisma.dailyLossCap.updateMany({
    where: { 
      walletId,
      date: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
        lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    },
    data: {
      dailyLossUsd: { increment: lossUsd },
      currentLossPct: {
        increment: (lossUsd / portfolio.totalValueUsd) * 100
      }
    }
  });
}

/**
 * Reset daily loss caps (run at midnight)
 */
export async function resetDailyLossCaps(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Reset all daily loss caps
  await prisma.dailyLossCap.updateMany({
    where: {
      date: { lt: today }
    },
    data: {
      currentLossPct: 0.0,
      dailyLossUsd: 0.0
    }
  });

  // Reset all asset loss caps
  await prisma.assetLossCap.updateMany({
    data: {
      currentLossPct: 0.0,
      dailyLossUsd: 0.0
    }
  });
}

/**
 * Get current risk status for a wallet
 */
export async function getRiskStatus(walletId: string): Promise<{
  assetCaps: AssetLossCap[];
  dailyCap: DailyLossCap | null;
  totalRisk: {
    dailyLossUsd: number;
    dailyLossPct: number;
    maxDailyLossUsd: number;
    maxDailyLossPct: number;
  };
}> {
  const assetCaps = await prisma.assetLossCap.findMany({
    where: { walletId, isActive: true }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyCap = await prisma.dailyLossCap.findFirst({
    where: {
      walletId,
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      isActive: true
    }
  });

  return {
    assetCaps,
    dailyCap,
    totalRisk: {
      dailyLossUsd: dailyCap?.dailyLossUsd || 0,
      dailyLossPct: dailyCap?.currentLossPct || 0,
      maxDailyLossUsd: dailyCap ? (dailyCap.dailyLossUsd / dailyCap.currentLossPct) * dailyCap.maxDailyLossPct : 0,
      maxDailyLossPct: dailyCap?.maxDailyLossPct || 0
    }
  };
}

/**
 * Check if wallet is in "runaway day" mode
 */
export async function isRunawayDay(walletId: string): Promise<boolean> {
  const riskStatus = await getRiskStatus(walletId);
  
  if (!riskStatus.dailyCap) {
    return false;
  }

  // Consider it a runaway day if daily loss exceeds 80% of cap
  const runawayThreshold = riskStatus.dailyCap.maxDailyLossPct * 0.8;
  return riskStatus.dailyCap.currentLossPct >= runawayThreshold;
}

/**
 * Block trading for runaway days
 */
export async function checkRunawayDay(walletId: string): Promise<RiskViolation | null> {
  const isRunaway = await isRunawayDay(walletId);
  
  if (isRunaway) {
    return {
      code: 'RUNAWAY_DAY_DETECTED',
      message: 'Trading blocked due to excessive daily losses. Please review your strategy.',
      severity: 'error'
    };
  }

  return null;
}
