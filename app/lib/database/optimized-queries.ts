import { prisma } from '../prisma';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Initialize database indexes for better performance
export async function createOptimizedIndexes() {
  try {
    // These would normally be in prisma schema, but for runtime optimization
    const indexCommands = [
      // Insights/predictions indexes
      'CREATE INDEX IF NOT EXISTS idx_insight_created_at ON Insight(createdAt DESC)',
      'CREATE INDEX IF NOT EXISTS idx_insight_user_id ON Insight(userId)',
      'CREATE INDEX IF NOT EXISTS idx_insight_status ON Insight(status)',

      // Market indexes
      'CREATE INDEX IF NOT EXISTS idx_market_category ON Market(category)',
      'CREATE INDEX IF NOT EXISTS idx_market_status ON Market(status)',
      'CREATE INDEX IF NOT EXISTS idx_market_created_at ON Market(createdAt DESC)',

      // User events for analytics
      'CREATE INDEX IF NOT EXISTS idx_user_event_created_at ON UserEvent(createdAt DESC)',
      'CREATE INDEX IF NOT EXISTS idx_user_event_user_id ON UserEvent(userId)',

      // Intent receipts for performance
      'CREATE INDEX IF NOT EXISTS idx_intent_receipt_created_at ON IntentReceipt(createdAt DESC)',
      'CREATE INDEX IF NOT EXISTS idx_intent_receipt_user_id ON IntentReceipt(userId)',
    ];

    // Note: In production, these should be in prisma schema migrations
    // This is for runtime optimization in development
    for (const command of indexCommands) {
      try {
        await prisma.$executeRawUnsafe(command);
      } catch (error) {
        console.log(`Index already exists or error creating: ${error}`);
      }
    }

    console.log('✅ Database indexes optimized');
  } catch (error) {
    console.error('❌ Error optimizing database indexes:', error);
  }
}

// Optimized insights/predictions query with pagination
export async function getInsightsPaginated(
  options: PaginationOptions = {},
): Promise<PaginationResult<any>> {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.insight.findMany({
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            intentReceipts: true,
          },
        },
      },
    }),
    prisma.insight.count(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// Optimized markets query with filtering
export async function getMarketsPaginated(
  options: PaginationOptions & { category?: string; status?: string } = {},
): Promise<PaginationResult<any>> {
  const { page = 1, limit = 50, category, status } = options;
  const offset = (page - 1) * limit;

  const where: any = {};
  if (category) where.category = category;
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.market?.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }) || [],
    prisma.market?.count({ where }) || 0,
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// Optimized user events query for analytics
export async function getUserEventsPaginated(
  userId?: string,
  options: PaginationOptions = {},
): Promise<PaginationResult<any>> {
  const { page = 1, limit = 100 } = options;
  const offset = (page - 1) * limit;

  const where = userId ? { userId } : {};

  const [data, total] = await Promise.all([
    prisma.userEvent?.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }) || [],
    prisma.userEvent?.count({ where }) || 0,
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// Cached aggregation queries
export async function getInsightStats() {
  const [totalInsights, activeInsights, todayInsights] = await Promise.all([
    prisma.insight.count(),
    prisma.insight.count({
      where: { status: 'ACTIVE' },
    }),
    prisma.insight.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);

  return {
    total: totalInsights,
    active: activeInsights,
    today: todayInsights,
  };
}

// Batch operations for better performance
export async function batchCreateInsights(insights: any[]) {
  try {
    const result = await prisma.insight.createMany({
      data: insights,
      skipDuplicates: true,
    });
    return result;
  } catch (error) {
    console.error('❌ Error batch creating insights:', error);
    throw error;
  }
}

// Connection health check
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; latency: number }> {
  const start = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = performance.now() - start;
    return { healthy: true, latency };
  } catch (error) {
    const latency = performance.now() - start;
    return { healthy: false, latency };
  }
}

// Cleanup function for old data
export async function cleanupOldData(daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  try {
    const [deletedEvents, deletedOldInsights] = await Promise.all([
      prisma.userEvent?.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          type: 'VIEW', // Only delete view events, keep important events
        },
      }),
      prisma.insight?.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          status: 'ARCHIVED',
        },
      }),
    ]);

    return {
      deletedEvents: deletedEvents?.count || 0,
      deletedInsights: deletedOldInsights?.count || 0,
    };
  } catch (error) {
    console.error('❌ Error cleaning up old data:', error);
    throw error;
  }
}
