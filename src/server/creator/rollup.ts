/**
 * Creator daily metrics rollup service
 * Aggregates creator performance data for scoring system
 */

import { PrismaClient } from '@prisma/client';
import { 
  calculateCreatorScore, 
  ScoreCalculationParams,
  SCORE 
} from '../../../app/lib/creatorScore';
import { 
  winsorize, 
  winsorizedMean, 
  winsorizedStd, 
  getAlphaForSampleSize 
} from '../../../app/lib/winsorize';

const prisma = new PrismaClient();

export interface RollupResult {
  creatorId: string;
  day: Date;
  maturedN: number;
  brierMean: number;
  retStd30d: number | null;
  notional30d: number;
  accuracy: number;
  consistency: number;
  volumeScore: number;
  recencyScore: number;
  score: number;
}

export interface RollupStats {
  processed: number;
  errors: number;
  duration: number;
  creators: number;
}

/**
 * Calculate Brier score for matured insights
 */
async function calculateBrierForCreator(
  creatorId: string, 
  since: Date, 
  until: Date
): Promise<{ brierMean: number; maturedN: number }> {
  // Get matured insights with outcomes
  const insights = await prisma.insight.findMany({
    where: {
      creatorId,
      createdAt: {
        gte: since,
        lte: until
      },
      status: 'RESOLVED',
      outcomes: {
        some: {}
      }
    },
    include: {
      outcomes: true
    }
  });

  if (insights.length === 0) {
    return { brierMean: 1, maturedN: 0 };
  }

  const predictions: number[] = [];
  const outcomes: number[] = [];

  for (const insight of insights) {
    const outcome = insight.outcomes[0];
    if (!outcome) continue;

    const predictedProb = insight.probability;
    const actualOutcome = outcome.result === 'YES' ? 1 : 0;

    predictions.push(predictedProb);
    outcomes.push(actualOutcome);
  }

  if (predictions.length === 0) {
    return { brierMean: 1, maturedN: 0 };
  }

  // Calculate Brier score
  let brierSum = 0;
  for (let i = 0; i < predictions.length; i++) {
    const p = Math.max(0, Math.min(1, predictions[i]));
    const o = outcomes[i];
    brierSum += Math.pow(p - o, 2);
  }

  const brierMean = brierSum / predictions.length;
  return { brierMean, maturedN: predictions.length };
}

/**
 * Calculate return standard deviation for last 30 days
 */
async function calculateReturnStdForCreator(
  creatorId: string,
  day: Date
): Promise<number | null> {
  const thirtyDaysAgo = new Date(day);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get intents with receipts for the last 30 days
  const intents = await prisma.intent.findMany({
    where: {
      walletId: creatorId, // Assuming creatorId maps to walletId
      createdAt: {
        gte: thirtyDaysAgo,
        lte: day
      },
      receipts: {
        some: {
          status: 'EXECUTED',
          realizedPx: { not: null }
        }
      }
    },
    include: {
      receipts: {
        where: {
          status: 'EXECUTED',
          realizedPx: { not: null }
        }
      }
    }
  });

  if (intents.length === 0) {
    return null;
  }

  // Calculate returns per pair
  const returnsByPair = new Map<string, number[]>();

  for (const intent of intents) {
    const receipt = intent.receipts[0];
    if (!receipt || !receipt.realizedPx) continue;

    const pair = `${intent.base}/${intent.quote}`;
    const side = intent.side as 'BUY' | 'SELL';
    
    // For simplicity, we'll use a mock current price
    // In production, this should fetch actual current prices
    const currentPrice = receipt.realizedPx * (1 + (Math.random() - 0.5) * 0.1); // Mock 10% variation
    
    let ret: number;
    if (side === 'BUY') {
      ret = (currentPrice / receipt.realizedPx) - 1;
    } else {
      ret = (receipt.realizedPx / currentPrice) - 1;
    }

    if (!returnsByPair.has(pair)) {
      returnsByPair.set(pair, []);
    }
    returnsByPair.get(pair)!.push(ret);
  }

  // Winsorize returns per pair and calculate overall std
  const allReturns: number[] = [];
  
  for (const [pair, returns] of returnsByPair) {
    const alpha = getAlphaForSampleSize(returns.length);
    const winsorized = winsorize(returns, alpha);
    allReturns.push(...winsorized);
  }

  if (allReturns.length === 0) {
    return null;
  }

  return winsorizedStd(allReturns, 0); // No additional winsorizing
}

/**
 * Calculate notional volume for last 30 days
 */
async function calculateNotionalVolumeForCreator(
  creatorId: string,
  day: Date
): Promise<number> {
  const thirtyDaysAgo = new Date(day);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const receipts = await prisma.intentReceipt.findMany({
    where: {
      intent: {
        walletId: creatorId
      },
      createdAt: {
        gte: thirtyDaysAgo,
        lte: day
      },
      status: 'EXECUTED',
      feesUsd: { not: null }
    },
    include: {
      intent: true
    }
  });

  // Sum up notional volume (using fees as proxy for volume)
  // In production, this should use actual trade sizes
  return receipts.reduce((sum, receipt) => {
    const feesUsd = receipt.feesUsd || 0;
    // Estimate notional as fees * 100 (rough approximation)
    return sum + (feesUsd * 100);
  }, 0);
}

/**
 * Calculate recency score using daily accuracy over last 30 days
 */
async function calculateRecencyScoreForCreator(
  creatorId: string,
  day: Date
): Promise<number> {
  const thirtyDaysAgo = new Date(day);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get daily accuracy scores for the last 30 days
  const dailyRecords = await prisma.creatorDaily.findMany({
    where: {
      creatorId,
      day: {
        gte: thirtyDaysAgo,
        lt: day
      }
    },
    orderBy: { day: 'desc' },
    select: { accuracy: true, day: true }
  });

  if (dailyRecords.length === 0) {
    return 0;
  }

  // Calculate recency weights
  const days = dailyRecords.map((_, i) => i);
  const weights = days.map(d => Math.exp(-Math.log(2) * d / SCORE.HALF_LIFE_DAYS));
  const sumWeights = weights.reduce((s, w) => s + w, 0);
  const normalizedWeights = weights.map(w => w / sumWeights);

  // Calculate weighted average
  let weightedSum = 0;
  for (let i = 0; i < dailyRecords.length; i++) {
    weightedSum += dailyRecords[i].accuracy * normalizedWeights[i];
  }

  return weightedSum;
}

/**
 * Rollup creator daily metrics for a specific day
 */
export async function rollupCreatorDaily(
  creatorId: string,
  day: Date
): Promise<RollupResult | null> {
  try {
    const since = new Date(day);
    since.setHours(0, 0, 0, 0);
    const until = new Date(day);
    until.setHours(23, 59, 59, 999);

    // Calculate Brier score and matured count
    const { brierMean, maturedN } = await calculateBrierForCreator(creatorId, since, until);
    
    // Calculate return standard deviation
    const retStd30d = await calculateReturnStdForCreator(creatorId, day);
    
    // Calculate notional volume
    const notional30d = await calculateNotionalVolumeForCreator(creatorId, day);
    
    // Calculate recency score
    const recencyScore = await calculateRecencyScoreForCreator(creatorId, day);

    // Calculate all score components
    const scoreParams: ScoreCalculationParams = {
      maturedN,
      brierMean,
      retStd30d,
      notional30d,
    };

    const scoreBreakdown = calculateCreatorScore(scoreParams);

    return {
      creatorId,
      day,
      maturedN,
      brierMean,
      retStd30d,
      notional30d,
      accuracy: scoreBreakdown.accuracy,
      consistency: scoreBreakdown.consistency,
      volumeScore: scoreBreakdown.volumeScore,
      recencyScore: scoreBreakdown.recencyScore,
      score: scoreBreakdown.totalScore
    };
  } catch (error) {
    console.error(`Error rolling up creator ${creatorId} for ${day.toISOString()}:`, error);
    return null;
  }
}

/**
 * Rollup all creators for a date range
 */
export async function rollupCreatorDailyRange(
  since?: Date,
  until?: Date
): Promise<RollupStats> {
  const startTime = Date.now();
  let processed = 0;
  let errors = 0;
  let creators = 0;
  const notionalValues: number[] = [];

  try {
    // Get all creators
    const creatorsList = await prisma.creator.findMany({
      select: { id: true }
    });

    creators = creatorsList.length;

    // Determine date range
    const endDate = until || new Date();
    const startDate = since || new Date();
    startDate.setDate(startDate.getDate() - 3); // Default to last 3 days

    // Process each creator for each day
    for (const creator of creatorsList) {
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const result = await rollupCreatorDaily(creator.id, new Date(currentDate));
        
        if (result) {
          // Collect notional values for p50/p90 calculation
          notionalValues.push(result.notional30d);
          
          // Upsert the daily record
          await prisma.creatorDaily.upsert({
            where: {
              creatorId_day: {
                creatorId: creator.id,
                day: result.day
              }
            },
            update: {
              maturedN: result.maturedN,
              brierMean: result.brierMean,
              retStd30d: result.retStd30d,
              notional30d: result.notional30d,
              accuracy: result.accuracy,
              consistency: result.consistency,
              volumeScore: result.volumeScore,
              recencyScore: result.recencyScore,
              score: result.score
            },
            create: {
              creatorId: result.creatorId,
              day: result.day,
              maturedN: result.maturedN,
              brierMean: result.brierMean,
              retStd30d: result.retStd30d,
              notional30d: result.notional30d,
              accuracy: result.accuracy,
              consistency: result.consistency,
              volumeScore: result.volumeScore,
              recencyScore: result.recencyScore,
              score: result.score
            }
          });
          processed++;
        } else {
          errors++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const duration = Date.now() - startTime;
    
    // Calculate and log p50/p90 notional values for tuning
    if (notionalValues.length > 0) {
      const sortedNotionals = [...notionalValues].sort((a, b) => a - b);
      const p50 = sortedNotionals[Math.floor(sortedNotionals.length * 0.5)];
      const p90 = sortedNotionals[Math.floor(sortedNotionals.length * 0.9)];
      
      console.log(`📊 Volume normalization stats:`);
      console.log(`   Current VOL_NORM: ${SCORE.VOL_NORM} USDC`);
      console.log(`   P50 notional: ${p50.toFixed(0)} USDC`);
      console.log(`   P90 notional: ${p90.toFixed(0)} USDC`);
      console.log(`   Sample size: ${notionalValues.length} creators`);
    }
    
    return {
      processed,
      errors,
      duration,
      creators
    };
  } catch (error) {
    console.error('Error in rollupCreatorDailyRange:', error);
    throw error;
  }
}
