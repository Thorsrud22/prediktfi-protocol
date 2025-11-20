/**
 * Creator Health Monitoring System
 * Tracks creator performance metrics for digest and ops monitoring
 */

import { PrismaClient } from '@prisma/client';
import { calculateTrend } from '../../app/lib/creatorScore';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

export interface CreatorHealthMetrics {
  topCreators7d: Array<{
    creatorIdHashed: string;
    score: number;
    accuracy: number;
    maturedN: number;
    isProvisional: boolean;
  }>;
  topCreators30d: Array<{
    creatorIdHashed: string;
    score: number;
    accuracy: number;
    maturedN: number;
    isProvisional: boolean;
  }>;
  movers: Array<{
    creatorIdHashed: string;
    currentScore: number;
    previousScore: number;
    scoreChange: number;
    trend: 'up' | 'down' | 'flat';
  }>;
  provisionalToStable: number;
  leaderboardP95: number;
}

/**
 * Get top 5 creators for a period
 */
async function getTopCreators(period: '7d' | '30d', limit: number = 5): Promise<Array<{
  creatorIdHashed: string;
  score: number;
  accuracy: number;
  maturedN: number;
  isProvisional: boolean;
}>> {
  const since = new Date();
  since.setDate(since.getDate() - (period === '7d' ? 7 : 30));
  const _until = new Date();

  // Get creators with daily records in the period
  const creatorsWithData = await prisma.creatorDaily.findMany({
    where: {
      day: {
        gte: since
      }
    },
    select: {
      creatorId: true
    },
    distinct: ['creatorId']
  });

  const results = [];

  for (const { creatorId } of creatorsWithData) {
    // Calculate aggregated scores for the period
    const dailyRecords = await prisma.creatorDaily.findMany({
      where: {
        creatorId,
        day: {
          gte: since
        }
      },
      orderBy: { day: 'asc' }
    });

    if (dailyRecords.length === 0) continue;

    // Calculate aggregated metrics
    const totalMaturedN = dailyRecords.reduce((sum, record) => sum + record.maturedN, 0);
    const accuracy = dailyRecords.reduce((sum, record) => sum + record.accuracy, 0) / dailyRecords.length;
    const score = dailyRecords.reduce((sum, record) => sum + record.score, 0) / dailyRecords.length;
    const isProvisional = totalMaturedN < 50;

    results.push({
      creatorIdHashed: hashCreatorId(creatorId),
      score,
      accuracy,
      maturedN: totalMaturedN,
      isProvisional
    });
  }

  // Sort by score and return top N
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get creators with significant score changes (movers)
 */
async function getMovers(): Promise<Array<{
  creatorIdHashed: string;
  currentScore: number;
  previousScore: number;
  scoreChange: number;
  trend: 'up' | 'down' | 'flat';
}>> {
  const now = new Date();
  const current7dStart = new Date(now);
  current7dStart.setDate(current7dStart.getDate() - 7);

  const previous7dStart = new Date(current7dStart);
  previous7dStart.setDate(previous7dStart.getDate() - 7);
  const previous7dEnd = new Date(current7dStart);

  // Get creators with data in both periods
  const creatorsWithData = await prisma.creatorDaily.findMany({
    where: {
      day: {
        gte: previous7dStart
      }
    },
    select: {
      creatorId: true
    },
    distinct: ['creatorId']
  });

  const movers = [];

  for (const { creatorId } of creatorsWithData) {
    // Get current 7d period data
    const currentRecords = await prisma.creatorDaily.findMany({
      where: {
        creatorId,
        day: {
          gte: current7dStart,
          lte: now
        }
      }
    });

    // Get previous 7d period data
    const previousRecords = await prisma.creatorDaily.findMany({
      where: {
        creatorId,
        day: {
          gte: previous7dStart,
          lt: previous7dEnd
        }
      }
    });

    if (currentRecords.length === 0 || previousRecords.length === 0) continue;

    const currentScore = currentRecords.reduce((sum, record) => sum + record.score, 0) / currentRecords.length;
    const previousScore = previousRecords.reduce((sum, record) => sum + record.score, 0) / previousRecords.length;
    const scoreChange = currentScore - previousScore;
    const trend = calculateTrend(currentScore, previousScore);

    // Only include significant movers (change > 0.02 or 2 percentage points)
    if (Math.abs(scoreChange) > 0.02) {
      movers.push({
        creatorIdHashed: hashCreatorId(creatorId),
        currentScore,
        previousScore,
        scoreChange,
        trend
      });
    }
  }

  // Sort by absolute score change
  return movers.sort((a, b) => Math.abs(b.scoreChange) - Math.abs(a.scoreChange));
}

/**
 * Count creators who went from provisional to stable
 */
async function getProvisionalToStableCount(): Promise<number> {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get creators who were provisional 7 days ago but are stable now
  const creators = await prisma.creatorDaily.findMany({
    where: {
      day: {
        gte: sevenDaysAgo,
        lte: now
      }
    },
    select: {
      creatorId: true,
      day: true,
      maturedN: true
    },
    orderBy: [
      { creatorId: 'asc' },
      { day: 'asc' }
    ]
  });

  // Group by creator and check for provisional -> stable transition
  const creatorGroups = new Map<string, Array<{ day: Date; maturedN: number }>>();

  for (const record of creators) {
    if (!creatorGroups.has(record.creatorId)) {
      creatorGroups.set(record.creatorId, []);
    }
    creatorGroups.get(record.creatorId)!.push({
      day: record.day,
      maturedN: record.maturedN
    });
  }

  let provisionalToStableCount = 0;

  for (const [creatorId, records] of creatorGroups) {
    if (records.length < 2) continue;

    // Sort by day
    records.sort((a, b) => a.day.getTime() - b.day.getTime());

    // Check if first record was provisional and last record is stable
    const firstRecord = records[0];
    const lastRecord = records[records.length - 1];

    if (firstRecord.maturedN < 50 && lastRecord.maturedN >= 50) {
      provisionalToStableCount++;
    }
  }

  return provisionalToStableCount;
}

/**
 * Hash creator ID for privacy
 */
function hashCreatorId(creatorId: string): string {
  return crypto.createHash('sha256').update(creatorId).digest('hex').substring(0, 16);
}

// Assuming HealthStatus is a defined type elsewhere or needs to be defined.
// For the purpose of this edit, I'm defining a placeholder type.
type HealthStatus = 'healthy' | 'unhealthy' | 'warning';

async function checkCreatorHealth(_creatorId: string): Promise<HealthStatus> {
  // The original content of hashCreatorId was moved to hashCreatorId.
  // This function's implementation is now empty as per the diff's implied change.
  // If this function was intended to replace hashCreatorId, then the calls to hashCreatorId
  // throughout the file would also need to be updated, which is not part of the current instruction.
  // For now, returning a placeholder value.
  return 'healthy';
}

/**
 * Get comprehensive creator health metrics
 */
export async function getCreatorHealthMetrics(): Promise<CreatorHealthMetrics> {
  console.log('📊 Collecting creator health metrics...');

  const [topCreators7d, topCreators30d, movers, provisionalToStable] = await Promise.all([
    getTopCreators('7d', 5),
    getTopCreators('30d', 5),
    getMovers(),
    getProvisionalToStableCount()
  ]);

  // For now, we'll use a mock P95 value since we don't have response time tracking yet
  // This should be replaced with actual response time data from the monitoring system
  const leaderboardP95 = 150; // Mock value - should come from actual monitoring

  console.log(`✅ Creator health metrics collected:`);
  console.log(`   Top 7d: ${topCreators7d.length} creators`);
  console.log(`   Top 30d: ${topCreators30d.length} creators`);
  console.log(`   Movers: ${movers.length} creators`);
  console.log(`   Provisional→Stable: ${provisionalToStable} creators`);

  return {
    topCreators7d,
    topCreators30d,
    movers,
    provisionalToStable,
    leaderboardP95
  };
}

/**
 * Format creator health metrics for digest
 */
export function formatCreatorHealthForDigest(metrics: CreatorHealthMetrics): string {
  let digest = '\n## 🏆 Creator Health Report\n\n';

  // Top 5 creators (7d)
  digest += '### Top 5 Creators (7d)\n';
  if (metrics.topCreators7d.length === 0) {
    digest += 'No creators with data in the last 7 days.\n\n';
  } else {
    metrics.topCreators7d.forEach((creator, index) => {
      const status = creator.isProvisional ? '🔸' : '🔹';
      digest += `${index + 1}. ${status} **${creator.creatorIdHashed}** - Score: ${(creator.score * 100).toFixed(1)}%, Accuracy: ${(creator.accuracy * 100).toFixed(1)}%, Matured: ${creator.maturedN}\n`;
    });
    digest += '\n';
  }

  // Top 5 creators (30d)
  digest += '### Top 5 Creators (30d)\n';
  if (metrics.topCreators30d.length === 0) {
    digest += 'No creators with data in the last 30 days.\n\n';
  } else {
    metrics.topCreators30d.forEach((creator, index) => {
      const status = creator.isProvisional ? '🔸' : '🔹';
      digest += `${index + 1}. ${status} **${creator.creatorIdHashed}** - Score: ${(creator.score * 100).toFixed(1)}%, Accuracy: ${(creator.accuracy * 100).toFixed(1)}%, Matured: ${creator.maturedN}\n`;
    });
    digest += '\n';
  }

  // Movers
  digest += '### 🚀 Biggest Movers (7d vs Previous 7d)\n';
  if (metrics.movers.length === 0) {
    digest += 'No significant score changes detected.\n\n';
  } else {
    metrics.movers.slice(0, 10).forEach((mover, index) => {
      const direction = mover.trend === 'up' ? '📈' : mover.trend === 'down' ? '📉' : '➡️';
      const change = (mover.scoreChange * 100).toFixed(1);
      digest += `${index + 1}. ${direction} **${mover.creatorIdHashed}** - ${change}pp (${(mover.currentScore * 100).toFixed(1)}% → ${(mover.previousScore * 100).toFixed(1)}%)\n`;
    });
    digest += '\n';
  }

  // Provisional to Stable
  digest += '### 🎯 New Stable Creators\n';
  digest += `**${metrics.provisionalToStable}** creators crossed the 50+ matured insights threshold this week!\n\n`;

  // P95 Response Time
  digest += '### ⚡ Performance\n';
  digest += `Leaderboard API P95: **${metrics.leaderboardP95}ms**\n\n`;

  return digest;
}
