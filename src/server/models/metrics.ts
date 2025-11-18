/**
 * Trading Metrics Calculator
 * Handles matured-only filtering, BUY/SELL returns, and calibration integration
 */

import { prisma } from '../../../app/lib/prisma';
import { 
  calculateCalibration, 
  CalibrationResult, 
  TradingRecord, 
  CALIBRATION_CONFIG 
} from './calibration';

export interface MetricsQuery {
  modelId?: string;
  walletId?: string;
  window?: string; // e.g., "30d", "90d"
  trading_pair?: string;
}

export interface TradingMetrics {
  // Existing P&L metrics
  total_pnl_usd: number;
  win_rate: number;
  avg_win_usd: number;
  avg_loss_usd: number;
  max_drawdown_usd: number;
  sharpe_ratio: number;
  
  // New calibration metrics
  brier_30d: number;
  calibration: CalibrationResult;
  matured_n: number;
  matured_coverage: number;
  calibrationNote?: string;
  
  // Metadata
  total_trades: number;
  sample_period_days: number;
  last_updated: string;
}

interface QuoteCache {
  [symbol: string]: {
    price: number;
    timestamp: number;
    ttl: number;
  };
}

// Simple in-memory quote cache (TTL 3-5s)
const quoteCache: QuoteCache = {};
const QUOTE_CACHE_TTL = 4000; // 4 seconds

/**
 * Get current price from cache or fetch new quote
 */
async function getCurrentPrice(symbol: string): Promise<number | null> {
  const cached = quoteCache[symbol];
  const now = Date.now();
  
  // Return cached price if still valid
  if (cached && (now - cached.timestamp) < cached.ttl) {
    return cached.price;
  }
  
  try {
    // In a real implementation, this would call Jupiter API or similar
    // For now, we'll mock it with some realistic prices
    const mockPrices: Record<string, number> = {
      'SOL': 100.50,
      'ETH': 2500.00,
      'BTC': 45000.00,
      'USDC': 1.00
    };
    
    const price = mockPrices[symbol];
    if (price) {
      quoteCache[symbol] = {
        price,
        timestamp: now,
        ttl: QUOTE_CACHE_TTL
      };
      return price;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch price for ${symbol}:`, error);
    return cached?.price || null;
  }
}

/**
 * Calculate return for a trading position
 */
function calculateReturn(
  side: 'BUY' | 'SELL',
  executionPrice: number,
  currentPrice: number
): number {
  if (side === 'BUY') {
    // BUY: ret = (P_now / P_exec) - 1
    return (currentPrice / executionPrice) - 1;
  } else {
    // SELL: ret = (P_exec / P_now) - 1  
    return (executionPrice / currentPrice) - 1;
  }
}

/**
 * Parse expected duration string to days
 */
function parseExpectedDuration(expectedDur?: string): number {
  if (!expectedDur) return CALIBRATION_CONFIG.DEFAULT_EXPECTED_DURATION_DAYS;
  
  const match = expectedDur.match(/(\d+)([dwmy])/i);
  if (!match) return CALIBRATION_CONFIG.DEFAULT_EXPECTED_DURATION_DAYS;
  
  const [, num, unit] = match;
  const value = parseInt(num);
  
  switch (unit.toLowerCase()) {
    case 'd': return value;
    case 'w': return value * 7;
    case 'm': return value * 30;
    case 'y': return value * 365;
    default: return CALIBRATION_CONFIG.DEFAULT_EXPECTED_DURATION_DAYS;
  }
}

/**
 * Check if a trade has matured based on expected duration
 */
function isTradeMatured(
  blockTime: Date | null,
  expectedDur?: string,
  now: Date = new Date()
): boolean {
  if (!blockTime) return false;
  
  const durationDays = parseExpectedDuration(expectedDur);
  const maturityDate = new Date(blockTime);
  maturityDate.setDate(maturityDate.getDate() + durationDays);
  
  return now >= maturityDate;
}

/**
 * Fetch and process trading data for metrics calculation
 */
async function fetchTradingData(query: MetricsQuery): Promise<{
  records: TradingRecord[];
  totalSampleSize: number;
}> {
  // Parse window parameter
  const windowDays = query.window ? parseInt(query.window.replace('d', '')) : 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - windowDays);
  
  // Build where clause
  const whereClause: any = {
    createdAt: { gte: cutoffDate }
  };
  
  if (query.walletId) {
    whereClause.walletId = query.walletId;
  }
  
  if (query.trading_pair) {
    const [base, quote] = query.trading_pair.split('/');
    whereClause.base = base;
    whereClause.quote = quote;
  }
  
  // Fetch intents with their receipts
  const intents = await prisma.intent.findMany({
    where: whereClause,
    include: {
      receipts: {
        where: {
          status: 'executed' // Only executed trades
        },
        orderBy: { createdAt: 'desc' },
        take: 1 // Latest receipt per intent
      }
    }
  });
  
  const totalSampleSize = intents.length;
  const records: TradingRecord[] = [];
  const now = new Date();
  
  // Process each intent
  for (const intent of intents) {
    const receipt = intent.receipts[0];
    if (!receipt || !receipt.realizedPx || !receipt.blockTime) continue;
    
    const tradingPair = `${intent.base}/${intent.quote}`;
    const currentPrice = await getCurrentPrice(intent.base);
    
    if (!currentPrice) continue;
    
    // Calculate return
    const actualReturn = calculateReturn(
      intent.side as 'BUY' | 'SELL',
      receipt.realizedPx,
      currentPrice
    );
    
    // Check if trade has matured
    const matured = isTradeMatured(receipt.blockTime, intent.expectedDur ?? undefined, now);
    
    records.push({
      confidence: intent.confidence || 0.5, // Default confidence if missing
      actual_return: actualReturn,
      is_profitable: actualReturn > 0,
      trading_pair: tradingPair,
      matured
    });
  }
  
  return { records, totalSampleSize };
}

/**
 * Calculate comprehensive trading metrics
 */
export async function calculateTradingMetrics(query: MetricsQuery): Promise<TradingMetrics> {
  const { records, totalSampleSize } = await fetchTradingData(query);
  
  // Calculate calibration (includes winsorization)
  const calibrationResult = calculateCalibration(records, totalSampleSize);
  
  // Calculate traditional P&L metrics from matured records only
  const maturedRecords = records.filter(r => r.matured);
  const totalTrades = maturedRecords.length;
  
  let totalPnlUsd = 0;
  let wins = 0;
  let totalWinUsd = 0;
  let totalLossUsd = 0;
  let maxDrawdown = 0;
  let runningPnl = 0;
  let peak = 0;
  
  const returns: number[] = [];
  
  for (const record of maturedRecords) {
    const pnl = record.actual_return * 1000; // Assume $1000 position size for now
    totalPnlUsd += pnl;
    runningPnl += pnl;
    
    if (pnl > 0) {
      wins++;
      totalWinUsd += pnl;
    } else {
      totalLossUsd += Math.abs(pnl);
    }
    
    // Track drawdown
    if (runningPnl > peak) {
      peak = runningPnl;
    }
    const drawdown = peak - runningPnl;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
    
    returns.push(record.actual_return);
  }
  
  // Calculate derived metrics
  const winRate = totalTrades > 0 ? wins / totalTrades : 0;
  const avgWinUsd = wins > 0 ? totalWinUsd / wins : 0;
  const avgLossUsd = (totalTrades - wins) > 0 ? totalLossUsd / (totalTrades - wins) : 0;
  
  // Simple Sharpe ratio calculation
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const returnStd = returns.length > 1 ? 
    Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1)) : 0;
  const sharpeRatio = returnStd > CALIBRATION_CONFIG.EPSILON ? avgReturn / returnStd : 0;
  
  return {
    // Traditional metrics
    total_pnl_usd: Math.round(totalPnlUsd * 100) / 100,
    win_rate: Math.round(winRate * 100) / 100,
    avg_win_usd: Math.round(avgWinUsd * 100) / 100,
    avg_loss_usd: Math.round(avgLossUsd * 100) / 100,
    max_drawdown_usd: Math.round(maxDrawdown * 100) / 100,
    sharpe_ratio: Math.round(sharpeRatio * 100) / 100,
    
    // New calibration metrics
    brier_30d: calibrationResult.brier_score,
    calibration: calibrationResult,
    matured_n: calibrationResult.matured_n,
    matured_coverage: calibrationResult.matured_coverage,
    calibrationNote: calibrationResult.calibrationNote,
    
    // Metadata
    total_trades: totalTrades,
    sample_period_days: query.window ? parseInt(query.window.replace('d', '')) : 30,
    last_updated: new Date().toISOString()
  };
}

/**
 * Generate ETag for metrics caching
 */
export function generateMetricsETag(query: MetricsQuery, lastUpdated: string): string {
  const key = JSON.stringify({ ...query, lastUpdated });
  // Use a simple hash to avoid collisions
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
