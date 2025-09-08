/**
 * Guard validation for trading intents
 * Risk management and safety checks
 */

import { Guards, Size } from './schema';
import { 
  checkAssetLossCap, 
  checkDailyLossCap, 
  checkRunawayDay,
  RiskViolation 
} from './risk-management';

export interface GuardViolation {
  code: string;
  message: string;
  severity: 'warning' | 'error';
}

export interface PortfolioSnapshot {
  totalValueUsd: number;
  holdings: Array<{
    asset: string;
    valueUsd: number;
    amount: number;
  }>;
}

export interface MarketData {
  price: number;
  liquidityUsd: number;
  volume24h: number;
}

/**
 * Check position limit guard
 */
export function checkPositionLimit(
  size: Size,
  portfolio: PortfolioSnapshot,
  guards: Guards
): GuardViolation | null {
  const positionValue = size.type === 'pct' 
    ? portfolio.totalValueUsd * (size.value / 100)
    : size.value;
  
  const positionPct = (positionValue / portfolio.totalValueUsd) * 100;
  
  if (positionPct > guards.posLimitPct) {
    return {
      code: 'POSITION_LIMIT_EXCEEDED',
      message: `Position size ${positionPct.toFixed(1)}% exceeds limit of ${guards.posLimitPct}%`,
      severity: 'error'
    };
  }
  
  return null;
}

/**
 * Check daily loss cap guard
 */
export function checkDailyLossCap(
  portfolio: PortfolioSnapshot,
  guards: Guards,
  dailyPnL?: number
): GuardViolation | null {
  if (dailyPnL === undefined) {
    return null; // Skip if no PnL data available
  }
  
  const dailyLossPct = Math.abs(dailyPnL) / portfolio.totalValueUsd * 100;
  
  if (dailyLossPct > guards.dailyLossCapPct) {
    return {
      code: 'DAILY_LOSS_CAP_EXCEEDED',
      message: `Daily loss ${dailyLossPct.toFixed(1)}% exceeds cap of ${guards.dailyLossCapPct}%`,
      severity: 'error'
    };
  }
  
  return null;
}

/**
 * Check liquidity guard
 */
export function checkLiquidity(
  marketData: MarketData,
  guards: Guards
): GuardViolation | null {
  if (marketData.liquidityUsd < guards.minLiqUsd) {
    return {
      code: 'INSUFFICIENT_LIQUIDITY',
      message: `Market liquidity $${marketData.liquidityUsd.toLocaleString()} below minimum $${guards.minLiqUsd.toLocaleString()}`,
      severity: 'error'
    };
  }
  
  return null;
}

/**
 * Calculate dynamic slippage cap based on estimated impact
 */
export function calculateDynamicSlippageCap(
  estimatedImpactBps: number,
  guards: Guards
): number {
  const BASE_BPS = 20; // Minimum 20 bps
  const K = 1.2; // Multiplier for impact
  const HARD_CAP_BPS = 100; // Maximum 100 bps
  
  // Calculate dynamic cap: max(BASE_BPS, ceil(K * estimatedImpactBps))
  const dynamicCapBps = Math.max(BASE_BPS, Math.ceil(K * estimatedImpactBps));
  
  // Clamp to hard cap
  const clampedCapBps = Math.min(dynamicCapBps, HARD_CAP_BPS);
  
  // Use the more conservative (lower) value between dynamic cap and user-specified max
  return Math.min(clampedCapBps, guards.maxSlippageBps);
}

/**
 * Check slippage guard with dynamic cap
 */
export function checkSlippageCap(
  estimatedSlippageBps: number,
  guards: Guards,
  estimatedImpactBps?: number
): GuardViolation | null {
  // Use dynamic cap if impact is provided, otherwise fall back to static guard
  const effectiveCapBps = estimatedImpactBps !== undefined 
    ? calculateDynamicSlippageCap(estimatedImpactBps, guards)
    : guards.maxSlippageBps;
  
  if (estimatedSlippageBps > effectiveCapBps) {
    // Check if we're using dynamic cap or user max
    const isUsingDynamicCap = estimatedImpactBps !== undefined && 
      calculateDynamicSlippageCap(estimatedImpactBps, guards) < guards.maxSlippageBps;
    
    return {
      code: 'SLIPPAGE_EXCEEDED',
      message: `Estimated slippage ${estimatedSlippageBps}bps exceeds limit of ${effectiveCapBps}bps${isUsingDynamicCap ? ' (dynamic cap)' : ''}`,
      severity: 'error'
    };
  }
  
  return null;
}

/**
 * Check expiry guard
 */
export function checkExpiry(guards: Guards): GuardViolation | null {
  const expiresAt = new Date(guards.expiresAt);
  const now = new Date();
  
  if (expiresAt <= now) {
    return {
      code: 'INTENT_EXPIRED',
      message: 'Intent has expired',
      severity: 'error'
    };
  }
  
  // Warning if expires within 5 minutes
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
  if (expiresAt <= fiveMinutesFromNow) {
    return {
      code: 'INTENT_EXPIRING_SOON',
      message: 'Intent expires within 5 minutes',
      severity: 'warning'
    };
  }
  
  return null;
}

/**
 * Run all guards and return violations
 */
export function runGuards(
  size: Size,
  portfolio: PortfolioSnapshot,
  marketData: MarketData,
  guards: Guards,
  estimatedSlippageBps: number,
  dailyPnL?: number,
  estimatedImpactBps?: number
): GuardViolation[] {
  const violations: GuardViolation[] = [];
  
  // Check all guards
  const checks = [
    checkPositionLimit(size, portfolio, guards),
    checkDailyLossCap(portfolio, guards, dailyPnL),
    checkLiquidity(marketData, guards),
    checkSlippageCap(estimatedSlippageBps, guards, estimatedImpactBps),
    checkExpiry(guards)
  ];
  
  // Collect violations
  checks.forEach(check => {
    if (check) {
      violations.push(check);
    }
  });
  
  return violations;
}

/**
 * Run all guards including enhanced risk management (async)
 */
export async function runGuardsEnhanced(
  walletId: string,
  size: Size,
  portfolio: PortfolioSnapshot,
  marketData: MarketData,
  guards: Guards,
  estimatedSlippageBps: number,
  tradeLossUsd: number = 0,
  dailyPnL?: number,
  estimatedImpactBps?: number
): Promise<GuardViolation[]> {
  const violations: GuardViolation[] = [];
  
  // Run standard guards
  const standardViolations = runGuards(
    size, 
    portfolio, 
    marketData, 
    guards, 
    estimatedSlippageBps, 
    dailyPnL, 
    estimatedImpactBps
  );
  violations.push(...standardViolations);
  
  // Check enhanced risk management
  try {
    // Check runaway day
    const runawayCheck = await checkRunawayDay(walletId);
    if (runawayCheck) {
      violations.push(runawayCheck);
    }
    
    // Check per-asset loss cap
    const assetCheck = await checkAssetLossCap(walletId, size.asset || 'SOL', portfolio, tradeLossUsd);
    if (assetCheck) {
      violations.push(assetCheck);
    }
    
    // Check global daily loss cap
    const dailyCheck = await checkDailyLossCap(walletId, portfolio, tradeLossUsd);
    if (dailyCheck) {
      violations.push(dailyCheck);
    }
  } catch (error) {
    console.error('Error checking enhanced risk management:', error);
    // Don't block trading if risk management check fails
  }
  
  return violations;
}

/**
 * Check if any violations are blocking (errors)
 */
export function hasBlockingViolations(violations: GuardViolation[]): boolean {
  return violations.some(v => v.severity === 'error');
}

/**
 * Get violation summary for UI
 */
export function getViolationSummary(violations: GuardViolation[]): {
  blocking: GuardViolation[];
  warnings: GuardViolation[];
  canProceed: boolean;
} {
  const blocking = violations.filter(v => v.severity === 'error');
  const warnings = violations.filter(v => v.severity === 'warning');
  
  return {
    blocking,
    warnings,
    canProceed: blocking.length === 0
  };
}
