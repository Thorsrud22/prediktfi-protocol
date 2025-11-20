/**
 * Metrics Aggregation System
 * Calculates key metrics for admin dashboard
 */

import { prisma } from '../../app/lib/prisma';

export interface MetricsPeriod {
  period: '24h' | '7d' | '30d' | 'all';
  startDate: Date;
  endDate: Date;
}

export interface VolumeMetrics {
  totalPredictions: number;
  commitRate: number; // percentage of OPEN -> COMMITTED
  resolveRate: number; // percentage of COMMITTED -> RESOLVED
  averageTimeToCommit: number; // hours
  dailyVolume: Array<{
    date: string;
    predictions: number;
    commits: number;
    resolves: number;
  }>;
}

export interface ResolutionMetrics {
  totalResolutions: number;
  outcomeBreakdown: {
    YES: number;
    NO: number;
    INVALID: number;
  };
  resolverBreakdown: {
    PRICE: { total: number; success: number; error: number };
    URL: { total: number; success: number; error: number };
    TEXT: { total: number; success: number; error: number };
  };
  errorBreakdown: Array<{
    error: string;
    count: number;
    resolver: string;
  }>;
}

export interface RetentionMetrics {
  d1Retention: number; // users active next day
  d7Retention: number; // users active within 7 days
  sharingRate: number; // percentage of insights shared
  topCreators: Array<{
    id: string;
    handle: string;
    score: number;
    accuracy: number;
    totalPredictions: number;
    resolvedPredictions: number;
  }>;
}

export interface AdminMetrics {
  period: MetricsPeriod;
  volume: VolumeMetrics;
  resolution: ResolutionMetrics;
  retention: RetentionMetrics;
  lastUpdated: Date;
  cacheKey: string;
}

/**
 * Get period date range
 */
export function getPeriodRange(period: '24h' | '7d' | '30d' | 'all'): MetricsPeriod {
  const endDate = new Date();
  let startDate: Date;

  switch (period) {
    case '24h':
      startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      startDate = new Date('2024-01-01'); // Project start date
      break;
  }

  return { period, startDate, endDate };
}

/**
 * Calculate volume metrics
 */
export async function calculateVolumeMetrics(periodRange: MetricsPeriod): Promise<VolumeMetrics> {
  const { startDate, endDate } = periodRange;

  // Total predictions in period
  const totalPredictions = await prisma.insight.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  // Status breakdown for commit rate
  const statusCounts = await prisma.insight.groupBy({
    by: ['status'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: true
  });

  const _openCount = statusCounts.find(s => s.status === 'OPEN')?._count || 0;
  const committedCount = statusCounts.find(s => s.status === 'COMMITTED')?._count || 0;
  const resolvedCount = statusCounts.find(s => s.status === 'RESOLVED')?._count || 0;

  const commitRate = totalPredictions > 0 ?
    ((committedCount + resolvedCount) / totalPredictions) * 100 : 0;
  const resolveRate = (committedCount + resolvedCount) > 0 ?
    (resolvedCount / (committedCount + resolvedCount)) * 100 : 0;

  // Average time to commit (insights that have been committed or resolved)
  const committedInsights = await prisma.insight.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      status: {
        in: ['COMMITTED', 'RESOLVED']
      }
    },
    select: {
      createdAt: true,
      updatedAt: true
    }
  });

  const averageTimeToCommit = committedInsights.length > 0 ?
    committedInsights.reduce((sum, insight) => {
      const hoursToCommit = (insight.updatedAt.getTime() - insight.createdAt.getTime()) / (1000 * 60 * 60);
      return sum + hoursToCommit;
    }, 0) / committedInsights.length : 0;

  // Daily volume breakdown (last 30 days max)
  const dailyVolumeData = await prisma.$queryRaw<Array<{
    date: string;
    predictions: bigint;
    commits: bigint;
    resolves: bigint;
  }>>`
    SELECT 
      DATE(createdAt) as date,
      COUNT(*) as predictions,
      COUNT(CASE WHEN status IN ('COMMITTED', 'RESOLVED') THEN 1 END) as commits,
      COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolves
    FROM insights 
    WHERE createdAt >= ${startDate} AND createdAt <= ${endDate}
    GROUP BY DATE(createdAt)
    ORDER BY date DESC
    LIMIT 30
  `;

  const dailyVolume = dailyVolumeData.map(day => ({
    date: day.date,
    predictions: Number(day.predictions),
    commits: Number(day.commits),
    resolves: Number(day.resolves)
  }));

  return {
    totalPredictions,
    commitRate: Math.round(commitRate * 100) / 100,
    resolveRate: Math.round(resolveRate * 100) / 100,
    averageTimeToCommit: Math.round(averageTimeToCommit * 100) / 100,
    dailyVolume
  };
}

/**
 * Calculate resolution metrics
 */
export async function calculateResolutionMetrics(periodRange: MetricsPeriod): Promise<ResolutionMetrics> {
  const { startDate, endDate } = periodRange;

  // Total resolutions
  const totalResolutions = await prisma.outcome.count({
    where: {
      decidedAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  // Outcome breakdown
  const outcomeData = await prisma.outcome.groupBy({
    by: ['result'],
    where: {
      decidedAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: true
  });

  const outcomeBreakdown = {
    YES: outcomeData.find(o => o.result === 'YES')?._count || 0,
    NO: outcomeData.find(o => o.result === 'NO')?._count || 0,
    INVALID: outcomeData.find(o => o.result === 'INVALID')?._count || 0
  };

  // Resolver breakdown with success/error rates
  const resolverData = await prisma.insight.groupBy({
    by: ['resolverKind', 'status'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      resolverKind: {
        not: null
      }
    },
    _count: true
  });

  const resolverBreakdown = {
    PRICE: { total: 0, success: 0, error: 0 },
    URL: { total: 0, success: 0, error: 0 },
    TEXT: { total: 0, success: 0, error: 0 }
  };

  resolverData.forEach(item => {
    const resolver = item.resolverKind as 'PRICE' | 'URL' | 'TEXT';
    if (resolver && resolverBreakdown[resolver]) {
      resolverBreakdown[resolver].total += item._count;
      if (item.status === 'RESOLVED') {
        resolverBreakdown[resolver].success += item._count;
      } else if (item.status === 'COMMITTED') {
        // Still pending, not an error
      } else {
        resolverBreakdown[resolver].error += item._count;
      }
    }
  });

  // Error breakdown from events (if available)
  const errorEvents = await prisma.event.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      type: {
        contains: 'error'
      }
    },
    select: {
      meta: true,
      type: true
    },
    take: 100 // Limit for performance
  });

  const errorBreakdown = errorEvents.reduce((acc, event) => {
    try {
      const meta = JSON.parse(event.meta);
      const error = meta.error || meta.message || event.type;
      const resolver = meta.resolver || 'unknown';

      const existing = acc.find(e => e.error === error && e.resolver === resolver);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ error, count: 1, resolver });
      }
    } catch (_e) {
      // Skip invalid JSON
    }
    return acc;
  }, [] as Array<{ error: string; count: number; resolver: string }>);

  // Sort by count and take top 10
  errorBreakdown.sort((a, b) => b.count - a.count);

  return {
    totalResolutions,
    outcomeBreakdown,
    resolverBreakdown,
    errorBreakdown: errorBreakdown.slice(0, 10)
  };
}

/**
 * Calculate retention and creator metrics
 */
export async function calculateRetentionMetrics(periodRange: MetricsPeriod): Promise<RetentionMetrics> {
  const { startDate, endDate } = periodRange;

  // D1 and D7 retention (simplified - based on insight creation)
  const creatorsInPeriod = await prisma.creator.findMany({
    where: {
      insights: {
        some: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }
    },
    select: {
      id: true,
      insights: {
        select: {
          createdAt: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });

  let d1RetentionCount = 0;
  let d7RetentionCount = 0;

  creatorsInPeriod.forEach(creator => {
    if (creator.insights.length > 1) {
      const firstInsight = creator.insights[0];
      const laterInsights = creator.insights.slice(1);

      // Check if they came back within 1 day
      const d1Cutoff = new Date(firstInsight.createdAt.getTime() + 24 * 60 * 60 * 1000);
      if (laterInsights.some(insight => insight.createdAt <= d1Cutoff)) {
        d1RetentionCount++;
      }

      // Check if they came back within 7 days
      const d7Cutoff = new Date(firstInsight.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (laterInsights.some(insight => insight.createdAt <= d7Cutoff)) {
        d7RetentionCount++;
      }
    }
  });

  const d1Retention = creatorsInPeriod.length > 0 ?
    (d1RetentionCount / creatorsInPeriod.length) * 100 : 0;
  const d7Retention = creatorsInPeriod.length > 0 ?
    (d7RetentionCount / creatorsInPeriod.length) * 100 : 0;

  // Sharing rate (simplified - based on events or could be social features)
  const totalInsights = await prisma.insight.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  const sharedInsights = await prisma.event.count({
    where: {
      type: 'insight_shared',
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  const sharingRate = totalInsights > 0 ? (sharedInsights / totalInsights) * 100 : 0;

  // Top creators
  const topCreators = await prisma.creator.findMany({
    where: {
      insights: {
        some: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }
    },
    include: {
      insights: {
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          outcomes: true
        }
      }
    },
    orderBy: {
      score: 'desc'
    },
    take: 10
  });

  const topCreatorsData = topCreators.map(creator => ({
    id: creator.id,
    handle: creator.handle,
    score: creator.score,
    accuracy: creator.accuracy,
    totalPredictions: creator.insights.length,
    resolvedPredictions: creator.insights.filter(i => i.outcomes.length > 0).length
  }));

  return {
    d1Retention: Math.round(d1Retention * 100) / 100,
    d7Retention: Math.round(d7Retention * 100) / 100,
    sharingRate: Math.round(sharingRate * 100) / 100,
    topCreators: topCreatorsData
  };
}

/**
 * Get complete admin metrics
 */
export async function getAdminMetrics(
  period: '24h' | '7d' | '30d' | 'all' = '7d',
  resolverType?: 'PRICE' | 'URL' | 'TEXT'
): Promise<AdminMetrics> {
  const periodRange = getPeriodRange(period);

  console.log(`📊 Calculating admin metrics for period: ${period}`);
  const startTime = Date.now();

  // Calculate all metrics in parallel for performance
  const [volume, resolution, retention] = await Promise.all([
    calculateVolumeMetrics(periodRange),
    calculateResolutionMetrics(periodRange),
    calculateRetentionMetrics(periodRange)
  ]);

  const duration = Date.now() - startTime;
  console.log(`✅ Admin metrics calculated in ${duration}ms`);

  return {
    period: periodRange,
    volume,
    resolution,
    retention,
    lastUpdated: new Date(),
    cacheKey: `admin_metrics_${period}_${resolverType || 'all'}_${Math.floor(Date.now() / (5 * 60 * 1000))}`
  };
}
