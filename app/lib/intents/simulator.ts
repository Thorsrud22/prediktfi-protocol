/**
 * Intent simulator for trading operations
 * Calculates expected outcomes and risk metrics
 */

import { getMarketData, estimateSlippage, calculateTradeSize, getTokenMint } from '../aggregators/jupiter';
import { quoteCache } from '../aggregators/quote-cache';
import { latencyMonitor } from '../monitoring/latency';
import { Size, Guards } from './schema';
import { SimulationResult } from './receipts';
import { prisma } from '../prisma';

export interface PortfolioSnapshot {
  totalValueUsd: number;
  holdings: Array<{
    asset: string;
    valueUsd: number;
    amount: number;
  }>;
}

export interface WalletSnapshot {
  walletId: string;
  timestamp: string;
  totalValueUsd: number;
  holdings: Array<{
    asset: string;
    symbol: string;
    amount: number;
    valueUsd: number;
  }>;
}

type MarketData = Awaited<ReturnType<typeof getMarketData>>;

/**
 * Simulate trading intent
 */
export async function simulateIntent(
  intent: {
    base: string;
    quote: string;
    side: 'BUY' | 'SELL';
    sizeJson: Size;
    guardsJson: Guards;
  },
  walletSnapshot: WalletSnapshot
): Promise<SimulationResult> {
  const startTime = Date.now();
  
  try {
    const { base, quote: quoteToken, side, sizeJson, guardsJson } = intent;
    
    // Get current market data
    const marketData = await getMarketData(base, quoteToken);
    
    // Calculate trade size
    const tradeSizeUsd = sizeJson.type === 'pct'
      ? walletSnapshot.totalValueUsd * (sizeJson.value / 100)
      : sizeJson.value;
    
    const tradeSizeTokens = calculateTradeSize(
      walletSnapshot.totalValueUsd,
      sizeJson.value,
      marketData.price
    );
    
    // Get Jupiter quote
    const inputMint = side === 'BUY' ? getTokenMint(quoteToken) : getTokenMint(base);
    const outputMint = side === 'BUY' ? getTokenMint(base) : getTokenMint(quoteToken);
    const inputAmount = Number(tradeSizeTokens);
    if (Number.isNaN(inputAmount)) {
      throw new Error('Invalid trade size calculated for simulation');
    }

    const jupiterQuote = await quoteCache.getQuote(
      inputMint,
      outputMint,
      inputAmount,
      guardsJson.maxSlippageBps
    );
    
    // Calculate expected outcomes
    const expectedPrice = parseFloat(jupiterQuote.outAmount) / parseFloat(jupiterQuote.inAmount);
    const worstCasePrice = expectedPrice * (1 - guardsJson.maxSlippageBps / 10000);
    
    // Calculate estimated market impact
    const estimatedImpactBps = calculateMarketImpact(tradeSizeUsd, marketData);
    
    // Estimate fees
    const feesUsd = calculateFees(jupiterQuote, marketData.price);
    
    // Check liquidity
    const liqOk = marketData.liquidityUsd >= guardsJson.minLiqUsd;
    
    // Calculate portfolio after trade
    const portfolioAfter = calculatePortfolioAfter(
      walletSnapshot,
      intent,
      expectedPrice,
      tradeSizeUsd
    );
    
    // Calculate simulation confidence
    const simConfidence = calculateSimulationConfidence(
      marketData,
      tradeSizeUsd,
      guardsJson.maxSlippageBps
    );
    
    // Log quote→fill deviation for accuracy tracking
    const quoteToFillDeviation = await logQuoteToFillDeviation({
      base,
      quoteToken,
      side,
      expectedPrice,
      jupiterQuote,
      tradeSizeUsd,
      timestamp: Date.now()
    });
    
    // Get historical accuracy data
    const historicalAccuracy = await getHistoricalAccuracy(base, quoteToken, 30);
    
    const duration = Date.now() - startTime;
    latencyMonitor.recordMetric('simulate', duration, true);
    
    return {
      expectedPrice,
      worstCasePrice,
      estSlippageBps: guardsJson.maxSlippageBps,
      estimatedImpactBps,
      feesUsd,
      liqOk,
      portfolioAfter,
      simConfidence,
      quoteTimestamp: Date.now(),
      quoteToFillDeviation,
      historicalAccuracy
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    latencyMonitor.recordMetric('simulate', duration, false, error instanceof Error ? error.message : 'Unknown error');
    
    console.error('Simulation error:', error);
    throw new Error(`Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate estimated market impact in basis points
 */
function calculateMarketImpact(tradeSizeUsd: number, marketData: MarketData): number {
  // Simple market impact model based on trade size vs liquidity
  const liquidityRatio = tradeSizeUsd / marketData.liquidityUsd;
  
  // Base impact calculation: square root of liquidity ratio
  // This is a simplified model - in practice, you'd want more sophisticated impact modeling
  const baseImpactBps = Math.sqrt(liquidityRatio) * 10000; // Convert to basis points
  
  // Apply volume adjustment factor
  const volumeRatio = tradeSizeUsd / marketData.volume24h;
  const volumeAdjustment = Math.min(1.5, 1 + volumeRatio * 2); // Cap at 1.5x
  
  const adjustedImpactBps = baseImpactBps * volumeAdjustment;
  
  // Clamp to reasonable bounds (0.1% to 10%)
  return Math.max(1, Math.min(1000, adjustedImpactBps));
}

/**
 * Calculate fees from Jupiter quote
 */
function calculateFees(jupiterQuote: any, tokenPriceUsd: number): number {
  try {
    // Platform fee from Jupiter
    const platformFee = jupiterQuote.platformFee?.amount || '0';
    const platformFeeUsd = parseFloat(platformFee) * tokenPriceUsd;
    
    // Estimate network fees (Solana transaction fees)
    const networkFeeUsd = 0.00025; // ~$0.00025 for Solana transaction
    
    return platformFeeUsd + networkFeeUsd;
  } catch {
    return 0.001; // Default $0.001 fee estimate
  }
}

/**
 * Calculate portfolio after trade
 */
function calculatePortfolioAfter(
  walletSnapshot: WalletSnapshot,
  intent: {
    base: string;
    quote: string;
    side: 'BUY' | 'SELL';
    sizeJson: Size;
  },
  expectedPrice: number,
  tradeSizeUsd: number
): PortfolioSnapshot {
  const holdings = [...walletSnapshot.holdings];
  
  if (intent.side === 'BUY') {
    // Buying base with quote
    const baseAmount = tradeSizeUsd / expectedPrice;
    
    // Reduce quote holding
    const quoteHolding = holdings.find(h => h.symbol === intent.quote);
    if (quoteHolding) {
      quoteHolding.valueUsd -= tradeSizeUsd;
      quoteHolding.amount -= tradeSizeUsd / (quoteHolding.valueUsd / quoteHolding.amount);
    }
    
    // Add base holding
    const baseHolding = holdings.find(h => h.symbol === intent.base);
    if (baseHolding) {
      baseHolding.valueUsd += tradeSizeUsd;
      baseHolding.amount += baseAmount;
    } else {
      holdings.push({
        asset: intent.base,
        symbol: intent.base,
        amount: baseAmount,
        valueUsd: tradeSizeUsd
      });
    }
  } else {
    // Selling base for quote
    const quoteAmount = tradeSizeUsd;
    
    // Reduce base holding
    const baseHolding = holdings.find(h => h.symbol === intent.base);
    if (baseHolding) {
      baseHolding.valueUsd -= tradeSizeUsd;
      baseHolding.amount -= tradeSizeUsd / expectedPrice;
    }
    
    // Add quote holding
    const quoteHolding = holdings.find(h => h.symbol === intent.quote);
    if (quoteHolding) {
      quoteHolding.valueUsd += quoteAmount;
      quoteHolding.amount += quoteAmount;
    } else {
      holdings.push({
        asset: intent.quote,
        symbol: intent.quote,
        amount: quoteAmount,
        valueUsd: quoteAmount
      });
    }
  }
  
  // Calculate new total value
  const totalValueUsd = holdings.reduce((sum, h) => sum + h.valueUsd, 0);
  
  return {
    totalValueUsd,
    holdings: holdings.map(h => ({
      asset: h.asset,
      valueUsd: h.valueUsd,
      amount: h.amount
    }))
  };
}

/**
 * Calculate simulation confidence
 */
function calculateSimulationConfidence(
  marketData: { liquidityUsd: number; volume24h: number },
  tradeSizeUsd: number,
  maxSlippageBps: number
): number {
  // Base confidence
  let confidence = 0.8;
  
  // Adjust based on liquidity
  const liquidityRatio = tradeSizeUsd / marketData.liquidityUsd;
  if (liquidityRatio > 0.05) { // > 5% of liquidity
    confidence -= 0.2;
  }
  
  // Adjust based on slippage tolerance
  if (maxSlippageBps > 100) { // > 1%
    confidence -= 0.1;
  }
  
  // Adjust based on volume
  const volumeRatio = tradeSizeUsd / marketData.volume24h;
  if (volumeRatio > 0.1) { // > 10% of daily volume
    confidence -= 0.1;
  }
  
  return Math.max(0.1, Math.min(0.95, confidence));
}

/**
 * Get historical simulation accuracy
 */
export async function getHistoricalAccuracy(
  base: string,
  quote: string,
  days: number = 30
): Promise<{
  accuracy: number;
  confidence: string;
  sampleSize: number;
}> {
  try {
    // Get accuracy metrics for the pair
    const { calculateAccuracyMetrics } = await import('./accuracy');
    const pair = `${base}/${quote}`;
    const period = days <= 7 ? '7d' : '30d';
    const metrics = await calculateAccuracyMetrics(pair, period);
    
    if (metrics.totalTrades === 0) {
      return {
        accuracy: 0,
        confidence: 'insufficient_data',
        sampleSize: 0
      };
    }
    
    // Determine confidence based on sample size
    let confidence: string;
    if (metrics.totalTrades < 10) {
      confidence = 'low';
    } else if (metrics.totalTrades < 50) {
      confidence = 'medium';
    } else {
      confidence = 'high';
    }
    
    return {
      accuracy: Math.round(metrics.accuracyWithin50Bps),
      confidence,
      sampleSize: metrics.totalTrades
    };
  } catch (error) {
    console.error('Historical accuracy error:', error);
    return {
      accuracy: 0,
      confidence: 'insufficient_data',
      sampleSize: 0
    };
  }
}

/**
 * Log quote→fill deviation for accuracy tracking
 */
async function logQuoteToFillDeviation(params: {
  base: string;
  quoteToken: string;
  side: 'BUY' | 'SELL';
  expectedPrice: number;
  jupiterQuote: any;
  tradeSizeUsd: number;
  timestamp: number;
}): Promise<{
  deviationBps: number;
  logged: boolean;
}> {
  try {
    const { base, quoteToken, side, expectedPrice, jupiterQuote, tradeSizeUsd, timestamp } = params;
    
    // Calculate theoretical fill price from Jupiter quote
    const theoreticalFillPrice = parseFloat(jupiterQuote.outAmount) / parseFloat(jupiterQuote.inAmount);
    
    // Calculate deviation in basis points
    const deviationBps = Math.abs(expectedPrice - theoreticalFillPrice) / theoreticalFillPrice * 10000;
    
    // Store accuracy record in database
    await prisma.simulatorAccuracy.create({
      data: {
        pair: `${base}/${quoteToken}`,
        side,
        expectedPrice,
        theoreticalFillPrice,
        deviationBps,
        tradeSizeUsd,
        timestamp: new Date(timestamp),
        jupiterQuoteData: JSON.stringify(jupiterQuote)
      }
    });
    
    return {
      deviationBps,
      logged: true
    };
  } catch (error) {
    console.error('Failed to log quote→fill deviation:', error);
    return {
      deviationBps: 0,
      logged: false
    };
  }
}
