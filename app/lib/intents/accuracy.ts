/**
 * Simulator accuracy tracking and metrics
 * Calculates historical accuracy and confidence intervals
 */

import { prisma } from '../prisma';

export interface AccuracyMetrics {
  pair: string;
  period: '7d' | '30d';
  totalTrades: number;
  accuracyWithin50Bps: number; // % of trades within ±50 bps
  accuracyWithin100Bps: number; // % of trades within ±100 bps
  averageDeviationBps: number;
  maxDeviationBps: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    confidence: number; // 95%, 99%, etc.
  };
  lastUpdated: Date;
}

export interface AccuracyAlert {
  pair: string;
  period: '7d';
  currentAccuracy: number;
  threshold: number;
  alertLevel: 'warning' | 'critical';
  message: string;
}

/**
 * Calculate accuracy metrics for a trading pair
 */
export async function calculateAccuracyMetrics(
  pair: string,
  period: '7d' | '30d' = '30d'
): Promise<AccuracyMetrics> {
  try {
    const daysAgo = period === '7d' ? 7 : 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    const records = await prisma.simulatorAccuracy.findMany({
      where: {
        pair,
        timestamp: {
          gte: cutoffDate
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    if (records.length === 0) {
      return {
        pair,
        period,
        totalTrades: 0,
        accuracyWithin50Bps: 0,
        accuracyWithin100Bps: 0,
        averageDeviationBps: 0,
        maxDeviationBps: 0,
        confidenceInterval: {
          lower: 0,
          upper: 0,
          confidence: 95
        },
        lastUpdated: new Date()
      };
    }
    
    const deviations = records.map(r => r.deviationBps);
    const totalTrades = records.length;
    
    // Calculate accuracy within thresholds
    const accuracyWithin50Bps = (deviations.filter(d => d <= 50).length / totalTrades) * 100;
    const accuracyWithin100Bps = (deviations.filter(d => d <= 100).length / totalTrades) * 100;
    
    // Calculate statistics
    const averageDeviationBps = deviations.reduce((sum, d) => sum + d, 0) / totalTrades;
    const maxDeviationBps = Math.max(...deviations);
    
    // Calculate 95% confidence interval
    const sortedDeviations = deviations.sort((a, b) => a - b);
    const lowerIndex = Math.floor(totalTrades * 0.025);
    const upperIndex = Math.ceil(totalTrades * 0.975);
    const confidenceInterval = {
      lower: sortedDeviations[lowerIndex] || 0,
      upper: sortedDeviations[upperIndex] || 0,
      confidence: 95
    };
    
    return {
      pair,
      period,
      totalTrades,
      accuracyWithin50Bps,
      accuracyWithin100Bps,
      averageDeviationBps,
      maxDeviationBps,
      confidenceInterval,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Failed to calculate accuracy metrics:', error);
    throw new Error(`Accuracy calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check for accuracy alerts (red light system)
 */
export async function checkAccuracyAlerts(): Promise<AccuracyAlert[]> {
  try {
    const alerts: AccuracyAlert[] = [];
    
    // Get all unique pairs
    const pairs = await prisma.simulatorAccuracy.groupBy({
      by: ['pair']
    });
    
    for (const { pair } of pairs) {
      const metrics = await calculateAccuracyMetrics(pair, '7d');
      
      if (metrics.totalTrades < 5) {
        continue; // Need minimum sample size
      }
      
      // Check against thresholds
      const accuracyThreshold = 80; // 80% accuracy within ±50 bps
      const warningThreshold = 70; // 70% accuracy within ±50 bps
      
      if (metrics.accuracyWithin50Bps < warningThreshold) {
        alerts.push({
          pair,
          period: '7d',
          currentAccuracy: metrics.accuracyWithin50Bps,
          threshold: warningThreshold,
          alertLevel: 'critical',
          message: `Critical: ${pair} accuracy ${metrics.accuracyWithin50Bps.toFixed(1)}% below ${warningThreshold}% threshold`
        });
      } else if (metrics.accuracyWithin50Bps < accuracyThreshold) {
        alerts.push({
          pair,
          period: '7d',
          currentAccuracy: metrics.accuracyWithin50Bps,
          threshold: accuracyThreshold,
          alertLevel: 'warning',
          message: `Warning: ${pair} accuracy ${metrics.accuracyWithin50Bps.toFixed(1)}% below ${accuracyThreshold}% threshold`
        });
      }
    }
    
    return alerts;
  } catch (error) {
    console.error('Failed to check accuracy alerts:', error);
    return [];
  }
}

/**
 * Get accuracy summary for UI display
 */
export async function getAccuracySummary(pair?: string): Promise<{
  overall: AccuracyMetrics;
  byPair: Record<string, AccuracyMetrics>;
  alerts: AccuracyAlert[];
}> {
  try {
    const pairs = pair ? [pair] : await prisma.simulatorAccuracy.groupBy({
      by: ['pair']
    }).then(records => records.map(r => r.pair));
    
    const byPair: Record<string, AccuracyMetrics> = {};
    let totalTrades = 0;
    let totalAccuracy50Bps = 0;
    let totalAccuracy100Bps = 0;
    let totalDeviation = 0;
    let maxDeviation = 0;
    
    for (const p of pairs) {
      const metrics = await calculateAccuracyMetrics(p, '30d');
      byPair[p] = metrics;
      
      totalTrades += metrics.totalTrades;
      totalAccuracy50Bps += metrics.accuracyWithin50Bps * metrics.totalTrades;
      totalAccuracy100Bps += metrics.accuracyWithin100Bps * metrics.totalTrades;
      totalDeviation += metrics.averageDeviationBps * metrics.totalTrades;
      maxDeviation = Math.max(maxDeviation, metrics.maxDeviationBps);
    }
    
    const overall: AccuracyMetrics = {
      pair: 'ALL',
      period: '30d',
      totalTrades,
      accuracyWithin50Bps: totalTrades > 0 ? totalAccuracy50Bps / totalTrades : 0,
      accuracyWithin100Bps: totalTrades > 0 ? totalAccuracy100Bps / totalTrades : 0,
      averageDeviationBps: totalTrades > 0 ? totalDeviation / totalTrades : 0,
      maxDeviationBps: maxDeviation,
      confidenceInterval: {
        lower: 0,
        upper: 0,
        confidence: 95
      },
      lastUpdated: new Date()
    };
    
    const alerts = await checkAccuracyAlerts();
    
    return {
      overall,
      byPair,
      alerts
    };
  } catch (error) {
    console.error('Failed to get accuracy summary:', error);
    throw new Error(`Accuracy summary failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
