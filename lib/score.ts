/**
 * Score Calculation System
 * Implements Brier score and calibration metrics for creator reputation
 */

import { prisma } from '../app/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface BrierScoreResult {
  score: number;
  count: number;
  reliability: number;
  resolution: number;
  uncertainty: number;
}

export interface CalibrationBin {
  bin: number;           // 0-9 (0.0-0.1, 0.1-0.2, etc.)
  predicted: number;     // Average predicted probability
  actual: number;        // Actual outcome rate
  count: number;         // Number of predictions in bin
  deviation: number;     // |predicted - actual|
}

export interface ProfileAggregates {
  totalInsights: number;
  resolvedInsights: number;
  averageBrier: number;
  calibrationBins: CalibrationBin[];
  lastUpdated: Date;
  period90d: {
    totalInsights: number;
    resolvedInsights: number;
    averageBrier: number;
  };
}

/**
 * Calculate Brier score for a single insight
 * Brier Score = (p - o)² where p = predicted probability, o = actual outcome (0 or 1)
 */
export function brierForInsight(
  predictedProbability: number, 
  actualOutcome: 'YES' | 'NO' | 'INVALID'
): number | null {
  // Can't calculate Brier score for INVALID outcomes
  if (actualOutcome === 'INVALID') {
    return null;
  }
  
  // Convert outcome to binary (YES = 1, NO = 0)
  const outcome = actualOutcome === 'YES' ? 1 : 0;
  
  // Ensure probability is in [0, 1] range
  const p = Math.max(0, Math.min(1, predictedProbability));
  
  // Calculate Brier score: (p - o)²
  return Math.pow(p - outcome, 2);
}

/**
 * Calculate comprehensive Brier score metrics
 * Includes reliability, resolution, and uncertainty components
 */
export function calculateBrierMetrics(predictions: Array<{
  predicted: number;
  actual: 'YES' | 'NO' | 'INVALID';
}>): BrierScoreResult {
  // Filter out INVALID outcomes
  const validPredictions = predictions.filter(p => p.actual !== 'INVALID');
  
  if (validPredictions.length === 0) {
    return {
      score: 0,
      count: 0,
      reliability: 0,
      resolution: 0,
      uncertainty: 0
    };
  }
  
  const n = validPredictions.length;
  
  // Convert outcomes to binary
  const data = validPredictions.map(p => ({
    predicted: Math.max(0, Math.min(1, p.predicted)),
    actual: p.actual === 'YES' ? 1 : 0
  }));
  
  // Calculate base rate (overall frequency of positive outcomes)
  const baseRate = data.reduce((sum, d) => sum + d.actual, 0) / n;
  
  // Calculate Brier score components
  let brierSum = 0;
  let reliabilitySum = 0;
  let resolutionSum = 0;
  
  // Group by predicted probability bins for reliability calculation
  const bins = new Map<number, Array<{predicted: number; actual: number}>>();
  
  data.forEach(d => {
    // Round to nearest 0.1 for binning
    const binKey = Math.round(d.predicted * 10) / 10;
    if (!bins.has(binKey)) {
      bins.set(binKey, []);
    }
    bins.get(binKey)!.push(d);
    
    // Accumulate Brier score
    brierSum += Math.pow(d.predicted - d.actual, 2);
  });
  
  // Calculate reliability (how well-calibrated are the predictions)
  bins.forEach(binData => {
    const binSize = binData.length;
    const avgPredicted = binData.reduce((sum, d) => sum + d.predicted, 0) / binSize;
    const avgActual = binData.reduce((sum, d) => sum + d.actual, 0) / binSize;
    
    reliabilitySum += binSize * Math.pow(avgPredicted - avgActual, 2);
  });
  
  // Calculate resolution (how much predictions vary from base rate)
  bins.forEach(binData => {
    const binSize = binData.length;
    const avgActual = binData.reduce((sum, d) => sum + d.actual, 0) / binSize;
    
    resolutionSum += binSize * Math.pow(avgActual - baseRate, 2);
  });
  
  const averageBrier = brierSum / n;
  const reliability = reliabilitySum / n;
  const resolution = resolutionSum / n;
  const uncertainty = baseRate * (1 - baseRate);
  
  return {
    score: averageBrier,
    count: n,
    reliability,
    resolution,
    uncertainty
  };
}

/**
 * Calculate calibration bins (0.1 intervals)
 */
export function calculateCalibrationBins(predictions: Array<{
  predicted: number;
  actual: 'YES' | 'NO' | 'INVALID';
}>): CalibrationBin[] {
  // Filter out INVALID outcomes
  const validPredictions = predictions
    .filter(p => p.actual !== 'INVALID')
    .map(p => ({
      predicted: Math.max(0, Math.min(1, p.predicted)),
      actual: p.actual === 'YES' ? 1 : 0
    }));
  
  // Initialize 10 bins (0.0-0.1, 0.1-0.2, ..., 0.9-1.0)
  const bins: CalibrationBin[] = [];
  
  for (let i = 0; i < 10; i++) {
    const binPredictions = validPredictions.filter(p => {
      const binIndex = Math.floor(p.predicted * 10);
      return binIndex === i || (i === 9 && p.predicted === 1.0); // Handle edge case for 1.0
    });
    
    if (binPredictions.length > 0) {
      const avgPredicted = binPredictions.reduce((sum, p) => sum + p.predicted, 0) / binPredictions.length;
      const avgActual = binPredictions.reduce((sum, p) => sum + p.actual, 0) / binPredictions.length;
      
      bins.push({
        bin: i,
        predicted: avgPredicted,
        actual: avgActual,
        count: binPredictions.length,
        deviation: Math.abs(avgPredicted - avgActual)
      });
    } else {
      // Empty bin
      bins.push({
        bin: i,
        predicted: (i + 0.5) / 10, // Midpoint of bin
        actual: 0,
        count: 0,
        deviation: 0
      });
    }
  }
  
  return bins;
}

/**
 * Update profile aggregates for a creator
 */
export async function updateProfileAggregates(creatorId: string): Promise<ProfileAggregates> {
  console.log(`📊 Updating profile aggregates for creator: ${creatorId}`);
  
  // Fetch all resolved insights for this creator
  const insights = await prisma.insight.findMany({
    where: {
      creatorId: creatorId,
      status: 'RESOLVED'
    },
    include: {
      outcomes: {
        orderBy: { decidedAt: 'desc' },
        take: 1
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  console.log(`Found ${insights.length} resolved insights for creator ${creatorId}`);
  
  if (insights.length === 0) {
    const emptyAggregates: ProfileAggregates = {
      totalInsights: 0,
      resolvedInsights: 0,
      averageBrier: 0,
      calibrationBins: calculateCalibrationBins([]),
      lastUpdated: new Date(),
      period90d: {
        totalInsights: 0,
        resolvedInsights: 0,
        averageBrier: 0
      }
    };
    
    // Update creator record
    await prisma.creator.update({
      where: { id: creatorId },
      data: {
        score: 0,
        accuracy: 0,
        calibration: JSON.stringify(emptyAggregates.calibrationBins),
        lastScoreUpdate: new Date()
      }
    });
    
    return emptyAggregates;
  }
  
  // Convert insights to predictions format
  const allPredictions = insights
    .filter(insight => insight.outcomes.length > 0 && insight.p !== null)
    .map(insight => ({
      predicted: typeof insight.p === 'number' ? insight.p : insight.p!.toNumber(),
      actual: insight.outcomes[0].result as 'YES' | 'NO' | 'INVALID'
    }));
  
  // Filter for 90-day period
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  
  const recent90dInsights = insights.filter(insight => 
    insight.createdAt >= ninetyDaysAgo
  );
  
  const recent90dPredictions = recent90dInsights
    .filter(insight => insight.outcomes.length > 0 && insight.p !== null)
    .map(insight => ({
      predicted: typeof insight.p === 'number' ? insight.p : insight.p!.toNumber(),
      actual: insight.outcomes[0].result as 'YES' | 'NO' | 'INVALID'
    }));
  
  // Calculate metrics
  const allMetrics = calculateBrierMetrics(allPredictions);
  const recent90dMetrics = calculateBrierMetrics(recent90dPredictions);
  const calibrationBins = calculateCalibrationBins(allPredictions);
  
  // Calculate accuracy (percentage of correct predictions)
  const validPredictions = allPredictions.filter(p => p.actual !== 'INVALID');
  const correctPredictions = validPredictions.filter(p => 
    (p.predicted >= 0.5 && p.actual === 'YES') || 
    (p.predicted < 0.5 && p.actual === 'NO')
  );
  const accuracy = validPredictions.length > 0 ? 
    correctPredictions.length / validPredictions.length : 0;
  
  // Calculate overall score (lower Brier is better, so we use 1 - Brier)
  const score = Math.max(0, 1 - allMetrics.score);
  
  const aggregates: ProfileAggregates = {
    totalInsights: insights.length,
    resolvedInsights: validPredictions.length,
    averageBrier: allMetrics.score,
    calibrationBins,
    lastUpdated: new Date(),
    period90d: {
      totalInsights: recent90dInsights.length,
      resolvedInsights: recent90dPredictions.filter(p => p.actual !== 'INVALID').length,
      averageBrier: recent90dMetrics.score
    }
  };
  
    // Update creator record in database
    await prisma.creator.update({
      where: { id: creatorId },
      data: {
        score: score,
        accuracy: accuracy,
        brierMean: allMetrics.score,
        calibration: JSON.stringify(calibrationBins),
        lastScoreUpdate: new Date()
      }
    });
  
  console.log(`✅ Updated aggregates for creator ${creatorId}:`);
  console.log(`   Score: ${score.toFixed(3)} (1-Brier)`);
  console.log(`   Accuracy: ${(accuracy * 100).toFixed(1)}%`);
  console.log(`   Brier: ${allMetrics.score.toFixed(3)}`);
  console.log(`   Resolved: ${validPredictions.length}/${insights.length}`);
  
  return aggregates;
}

/**
 * Batch update all creator profiles
 */
export async function updateAllProfileAggregates(): Promise<void> {
  console.log('🔄 Starting batch profile aggregates update...');
  
  // Get all creators with insights
  const creators = await prisma.creator.findMany({
    where: {
      insights: {
        some: {
          status: 'RESOLVED'
        }
      }
    },
    select: { id: true, handle: true }
  });
  
  console.log(`Found ${creators.length} creators with resolved insights`);
  
  let updated = 0;
  let failed = 0;
  
  for (const creator of creators) {
    try {
      await updateProfileAggregates(creator.id);
      updated++;
      console.log(`✅ Updated ${creator.handle} (${updated}/${creators.length})`);
    } catch (error) {
      failed++;
      console.error(`❌ Failed to update ${creator.handle}:`, error);
    }
  }
  
  console.log(`🏁 Batch update completed: ${updated} updated, ${failed} failed`);
}

/**
 * Get leaderboard data
 */
export async function getLeaderboard(
  period: 'all' | '90d' = 'all',
  limit = 50
): Promise<Array<{
  id: string;
  handle: string;
  score: number;
  accuracy: number;
  totalInsights: number;
  resolvedInsights: number;
  averageBrier: number;
  rank: number;
}>> {
  console.log(`📋 Generating leaderboard (period: ${period}, limit: ${limit})`);
  
  const creators = await prisma.creator.findMany({
    where: {
      insights: {
        some: {
          status: 'RESOLVED',
          ...(period === '90d' && {
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
            }
          })
        }
      }
    },
    include: {
      insights: {
        where: {
          status: 'RESOLVED',
          ...(period === '90d' && {
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
            }
          })
        },
        include: {
          outcomes: {
            orderBy: { decidedAt: 'desc' },
            take: 1
          }
        }
      }
    },
    orderBy: {
      score: 'desc'
    },
    take: limit
  });
  
  const leaderboard = creators.map((creator, index) => {
    const validInsights = creator.insights.filter(insight => 
      insight.outcomes.length > 0 && 
      insight.outcomes[0].result !== 'INVALID' &&
      insight.p !== null
    );
    
    const predictions = validInsights.map(insight => ({
      predicted: typeof insight.p === 'number' ? insight.p : insight.p!.toNumber(),
      actual: insight.outcomes[0].result as 'YES' | 'NO' | 'INVALID'
    }));
    
    const metrics = calculateBrierMetrics(predictions);
    
    return {
      id: creator.id,
      handle: creator.handle,
      score: creator.score,
      accuracy: creator.accuracy,
      totalInsights: creator.insights.length,
      resolvedInsights: validInsights.length,
      averageBrier: metrics.score,
      rank: index + 1
    };
  });
  
  console.log(`✅ Generated leaderboard with ${leaderboard.length} creators`);
  
  return leaderboard;
}
