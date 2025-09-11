/**
 * Anti-Gaming Measures
 * Implements notional thresholds, rate limits, and spam detection
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Anti-gaming constants
export const ANTI_GAMING = {
  // Notional thresholds
  MIN_NOTIONAL_PER_PREDICTION: 100, // Minimum USDC per prediction
  MIN_DAILY_NOTIONAL: 1000, // Minimum daily notional volume
  
  // Rate limits (per wallet)
  MAX_PREDICTIONS_PER_HOUR: 10,
  MAX_PREDICTIONS_PER_DAY: 50,
  MAX_PREDICTIONS_PER_WEEK: 200,
  
  // Spam detection
  BURST_THRESHOLD: 5, // Max predictions in 10 minutes
  BURST_WINDOW_MS: 10 * 60 * 1000, // 10 minutes
  SIMILAR_PREDICTION_THRESHOLD: 0.8, // Similarity threshold for spam detection
  
  // Cooldown periods
  COOLDOWN_AFTER_BURST_MS: 30 * 60 * 1000, // 30 minutes after burst
  COOLDOWN_AFTER_SPAM_MS: 60 * 60 * 1000, // 1 hour after spam detection
} as const;

export interface AntiGamingResult {
  allowed: boolean;
  reason?: string;
  cooldownUntil?: Date;
  violations: string[];
}

export interface PredictionSubmission {
  walletId: string;
  question: string;
  probability: number;
  category: string;
  notionalAmount?: number;
  timestamp: Date;
}

/**
 * Check notional thresholds
 */
export async function checkNotionalThresholds(
  walletId: string,
  notionalAmount: number
): Promise<{ allowed: boolean; reason?: string }> {
  // Check minimum notional per prediction
  if (notionalAmount < ANTI_GAMING.MIN_NOTIONAL_PER_PREDICTION) {
    return {
      allowed: false,
      reason: `Minimum notional amount is ${ANTI_GAMING.MIN_NOTIONAL_PER_PREDICTION} USDC per prediction`
    };
  }
  
  // Check daily notional threshold
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dailyNotional = await prisma.intentReceipt.aggregate({
    where: {
      intent: {
        walletId: walletId
      },
      createdAt: {
        gte: today,
        lt: tomorrow
      },
      status: 'EXECUTED',
      feesUsd: { not: null }
    },
    _sum: {
      feesUsd: true
    }
  });
  
  const currentDailyNotional = (dailyNotional._sum.feesUsd || 0) * 100; // Convert to notional
  const totalDailyNotional = currentDailyNotional + notionalAmount;
  
  if (totalDailyNotional < ANTI_GAMING.MIN_DAILY_NOTIONAL) {
    return {
      allowed: false,
      reason: `Daily notional volume must be at least ${ANTI_GAMING.MIN_DAILY_NOTIONAL} USDC (current: ${Math.round(currentDailyNotional)} USDC)`
    };
  }
  
  return { allowed: true };
}

/**
 * Check rate limits for wallet
 */
export async function checkRateLimits(
  walletId: string,
  timestamp: Date = new Date()
): Promise<{ allowed: boolean; reason?: string; cooldownUntil?: Date }> {
  const now = timestamp;
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Count recent predictions
  const [hourlyCount, dailyCount, weeklyCount] = await Promise.all([
    prisma.insight.count({
      where: {
        creatorId: walletId,
        createdAt: { gte: oneHourAgo }
      }
    }),
    prisma.insight.count({
      where: {
        creatorId: walletId,
        createdAt: { gte: oneDayAgo }
      }
    }),
    prisma.insight.count({
      where: {
        creatorId: walletId,
        createdAt: { gte: oneWeekAgo }
      }
    })
  ]);
  
  // Check hourly limit
  if (hourlyCount >= ANTI_GAMING.MAX_PREDICTIONS_PER_HOUR) {
    const cooldownUntil = new Date(oneHourAgo.getTime() + 60 * 60 * 1000);
    return {
      allowed: false,
      reason: `Hourly limit exceeded: ${hourlyCount}/${ANTI_GAMING.MAX_PREDICTIONS_PER_HOUR} predictions`,
      cooldownUntil
    };
  }
  
  // Check daily limit
  if (dailyCount >= ANTI_GAMING.MAX_PREDICTIONS_PER_DAY) {
    const cooldownUntil = new Date(oneDayAgo.getTime() + 24 * 60 * 60 * 1000);
    return {
      allowed: false,
      reason: `Daily limit exceeded: ${dailyCount}/${ANTI_GAMING.MAX_PREDICTIONS_PER_DAY} predictions`,
      cooldownUntil
    };
  }
  
  // Check weekly limit
  if (weeklyCount >= ANTI_GAMING.MAX_PREDICTIONS_PER_WEEK) {
    const cooldownUntil = new Date(oneWeekAgo.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      allowed: false,
      reason: `Weekly limit exceeded: ${weeklyCount}/${ANTI_GAMING.MAX_PREDICTIONS_PER_WEEK} predictions`,
      cooldownUntil
    };
  }
  
  return { allowed: true };
}

/**
 * Detect burst patterns (spam detection)
 */
export async function detectBurstPattern(
  walletId: string,
  timestamp: Date = new Date()
): Promise<{ isBurst: boolean; count: number; cooldownUntil?: Date }> {
  const windowStart = new Date(timestamp.getTime() - ANTI_GAMING.BURST_WINDOW_MS);
  
  const recentPredictions = await prisma.insight.count({
    where: {
      creatorId: walletId,
      createdAt: { gte: windowStart }
    }
  });
  
  if (recentPredictions >= ANTI_GAMING.BURST_THRESHOLD) {
    const cooldownUntil = new Date(timestamp.getTime() + ANTI_GAMING.COOLDOWN_AFTER_BURST_MS);
    return {
      isBurst: true,
      count: recentPredictions,
      cooldownUntil
    };
  }
  
  return { isBurst: false, count: recentPredictions };
}

/**
 * Detect similar predictions (spam detection)
 */
export async function detectSimilarPredictions(
  walletId: string,
  question: string,
  probability: number,
  category: string,
  timestamp: Date = new Date()
): Promise<{ isSpam: boolean; similarCount: number; cooldownUntil?: Date }> {
  const oneHourAgo = new Date(timestamp.getTime() - 60 * 60 * 1000);
  
  // Get recent predictions from same wallet
  const recentPredictions = await prisma.insight.findMany({
    where: {
      creatorId: walletId,
      createdAt: { gte: oneHourAgo },
      category: category
    },
    select: {
      question: true,
      probability: true,
      createdAt: true
    }
  });
  
  // Check for similar questions (simple text similarity)
  const similarQuestions = recentPredictions.filter(pred => {
    const similarity = calculateTextSimilarity(question, pred.question);
    return similarity > ANTI_GAMING.SIMILAR_PREDICTION_THRESHOLD;
  });
  
  // Check for similar probabilities
  const similarProbabilities = recentPredictions.filter(pred => {
    const probDiff = Math.abs(pred.probability - probability);
    return probDiff < 0.1; // Within 10 percentage points
  });
  
  const similarCount = Math.max(similarQuestions.length, similarProbabilities.length);
  
  if (similarCount >= 3) { // 3 or more similar predictions
    const cooldownUntil = new Date(timestamp.getTime() + ANTI_GAMING.COOLDOWN_AFTER_SPAM_MS);
    return {
      isSpam: true,
      similarCount,
      cooldownUntil
    };
  }
  
  return { isSpam: false, similarCount };
}

/**
 * Calculate text similarity using Jaccard similarity
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Main anti-gaming check
 */
export async function checkAntiGaming(
  submission: PredictionSubmission
): Promise<AntiGamingResult> {
  const violations: string[] = [];
  let cooldownUntil: Date | undefined;
  
  // Check notional thresholds
  if (submission.notionalAmount) {
    const notionalCheck = await checkNotionalThresholds(
      submission.walletId,
      submission.notionalAmount
    );
    if (!notionalCheck.allowed) {
      violations.push(notionalCheck.reason!);
    }
  }
  
  // Check rate limits
  const rateLimitCheck = await checkRateLimits(
    submission.walletId,
    submission.timestamp
  );
  if (!rateLimitCheck.allowed) {
    violations.push(rateLimitCheck.reason!);
    cooldownUntil = rateLimitCheck.cooldownUntil;
  }
  
  // Check burst patterns
  const burstCheck = await detectBurstPattern(
    submission.walletId,
    submission.timestamp
  );
  if (burstCheck.isBurst) {
    violations.push(`Burst pattern detected: ${burstCheck.count} predictions in ${ANTI_GAMING.BURST_WINDOW_MS / 60000} minutes`);
    cooldownUntil = burstCheck.cooldownUntil;
  }
  
  // Check similar predictions
  const spamCheck = await detectSimilarPredictions(
    submission.walletId,
    submission.question,
    submission.probability,
    submission.category,
    submission.timestamp
  );
  if (spamCheck.isSpam) {
    violations.push(`Spam pattern detected: ${spamCheck.similarCount} similar predictions`);
    cooldownUntil = spamCheck.cooldownUntil;
  }
  
  return {
    allowed: violations.length === 0,
    reason: violations.join('; '),
    cooldownUntil,
    violations
  };
}

/**
 * Log anti-gaming violations for analytics
 */
export async function logAntiGamingViolation(
  walletId: string,
  violation: string,
  submission: PredictionSubmission
): Promise<void> {
  try {
    // Log to analytics/events table
    await prisma.event.create({
      data: {
        userId: walletId,
        type: 'anti_gaming_violation',
        meta: JSON.stringify({
          violation,
          submission: {
            question: submission.question,
            probability: submission.probability,
            category: submission.category,
            notionalAmount: submission.notionalAmount
          },
          timestamp: submission.timestamp.toISOString()
        })
      }
    });
    
    console.log(`🚫 Anti-gaming violation for wallet ${walletId}: ${violation}`);
  } catch (error) {
    console.error('Failed to log anti-gaming violation:', error);
  }
}

/**
 * Get anti-gaming status for a wallet
 */
export async function getAntiGamingStatus(walletId: string): Promise<{
  isRateLimited: boolean;
  isBurstCooldown: boolean;
  isSpamCooldown: boolean;
  cooldownUntil?: Date;
  recentViolations: number;
}> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  // Check current rate limits
  const rateLimitCheck = await checkRateLimits(walletId, now);
  const burstCheck = await detectBurstPattern(walletId, now);
  const spamCheck = await detectSimilarPredictions(walletId, '', 0, '', now);
  
  // Count recent violations
  const recentViolations = await prisma.event.count({
    where: {
      userId: walletId,
      type: 'anti_gaming_violation',
      createdAt: { gte: oneHourAgo }
    }
  });
  
  return {
    isRateLimited: !rateLimitCheck.allowed,
    isBurstCooldown: burstCheck.isBurst,
    isSpamCooldown: spamCheck.isSpam,
    cooldownUntil: rateLimitCheck.cooldownUntil || burstCheck.cooldownUntil || spamCheck.cooldownUntil,
    recentViolations
  };
}
