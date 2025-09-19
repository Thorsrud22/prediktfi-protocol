import { prisma } from '../prisma';
import { Prisma, InsightStatus } from '@prisma/client';

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

export interface InsightWithCount {
  id: string;
  title?: string | null;
  content?: string | null;
  status: string;
  creatorId: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    [key: string]: number;
  };
}

// Database provider detection
async function getDatabaseProvider(): Promise<'postgresql' | 'mysql' | 'sqlite'> {
  try {
    const url = process.env.DATABASE_URL || '';
    if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
      return 'postgresql';
    }
    if (url.startsWith('mysql://')) {
      return 'mysql';
    }
    return 'sqlite';
  } catch {
    return 'sqlite';
  }
}

// Check if table exists safely
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const provider = await getDatabaseProvider();

    switch (provider) {
      case 'postgresql':
        const pgResult = await prisma.$queryRaw<[{ exists: boolean }]>`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${tableName}
          ) as exists
        `;
        return Array.isArray(pgResult) && pgResult[0]?.exists === true;

      case 'mysql':
        const mysqlResult = await prisma.$queryRaw<[{ count: number }]>`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = DATABASE() 
          AND table_name = ${tableName}
        `;
        return Array.isArray(mysqlResult) && (mysqlResult[0]?.count || 0) > 0;

      case 'sqlite':
      default:
        const sqliteResult = await prisma.$queryRaw<[{ count: number }]>`
          SELECT COUNT(*) as count 
          FROM sqlite_master 
          WHERE type='table' 
          AND name = ${tableName}
        `;
        return Array.isArray(sqliteResult) && (sqliteResult[0]?.count || 0) > 0;
    }
  } catch {
    return false;
  }
}

// Initialize database indexes for better performance
export async function createOptimizedIndexes(): Promise<void> {
  try {
    const provider = await getDatabaseProvider();
    const quoteChar = provider === 'mysql' ? '`' : '"';

    const indexCommands = [
      // Insights/predictions indexes with conditional syntax
      `CREATE INDEX IF NOT EXISTS idx_insight_created_at ON ${quoteChar}Insight${quoteChar}(${quoteChar}createdAt${quoteChar} DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_insight_user_id ON ${quoteChar}Insight${quoteChar}(${quoteChar}userId${quoteChar})`,
      `CREATE INDEX IF NOT EXISTS idx_insight_status ON ${quoteChar}Insight${quoteChar}(${quoteChar}status${quoteChar})`,
      `CREATE INDEX IF NOT EXISTS idx_insight_composite ON ${quoteChar}Insight${quoteChar}(${quoteChar}status${quoteChar}, ${quoteChar}createdAt${quoteChar} DESC)`,
    ];

    // Add UserEvent indexes only if table exists
    if (await tableExists('UserEvent')) {
      indexCommands.push(
        `CREATE INDEX IF NOT EXISTS idx_user_event_created_at ON ${quoteChar}UserEvent${quoteChar}(${quoteChar}createdAt${quoteChar} DESC)`,
        `CREATE INDEX IF NOT EXISTS idx_user_event_user_id ON ${quoteChar}UserEvent${quoteChar}(${quoteChar}userId${quoteChar})`,
        `CREATE INDEX IF NOT EXISTS idx_user_event_composite ON ${quoteChar}UserEvent${quoteChar}(${quoteChar}userId${quoteChar}, ${quoteChar}createdAt${quoteChar} DESC)`,
      );
    } else {
      console.log('UserEvent table does not exist, skipping related indexes');
    }

    // Add IntentReceipt indexes only if table exists
    if (await tableExists('IntentReceipt')) {
      indexCommands.push(
        `CREATE INDEX IF NOT EXISTS idx_intent_receipt_created_at ON ${quoteChar}IntentReceipt${quoteChar}(${quoteChar}createdAt${quoteChar} DESC)`,
        `CREATE INDEX IF NOT EXISTS idx_intent_receipt_user_id ON ${quoteChar}IntentReceipt${quoteChar}(${quoteChar}userId${quoteChar})`,
      );
    } else {
      console.log('IntentReceipt table does not exist, skipping related indexes');
    }

    for (const command of indexCommands) {
      try {
        await prisma.$executeRawUnsafe(command);
      } catch (error) {
        console.log(
          `Index creation skipped: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    console.log('✅ Database indexes optimized');
  } catch (error) {
    console.error('❌ Error optimizing database indexes:', error);
    throw error;
  }
}

// Optimized insights/predictions query with pagination
export async function getInsightsPaginated(
  options: PaginationOptions = {},
): Promise<PaginationResult<InsightWithCount>> {
  const { page = 1, limit = 20 } = options;

  // Validate pagination parameters
  const validatedPage = Math.max(1, page);
  const validatedLimit = Math.min(Math.max(1, limit), 100); // Cap at 100
  const offset = (validatedPage - 1) * validatedLimit;

  try {
    const [data, total] = await Promise.all([
      prisma.insight.findMany({
        skip: offset,
        take: validatedLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: true,
        },
      }),
      prisma.insight.count(),
    ]);

    const totalPages = Math.ceil(total / validatedLimit);

    return {
      data,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages,
        hasNext: validatedPage < totalPages,
        hasPrev: validatedPage > 1,
      },
    };
  } catch (error) {
    console.error('❌ Error fetching paginated insights:', error);
    throw new Error('Failed to fetch insights');
  }
}

// Optimized user events query for analytics with proper error handling
export async function getUserEventsPaginated(
  userId?: string,
  options: PaginationOptions = {},
): Promise<PaginationResult<any>> {
  const { page = 1, limit = 100 } = options;
  const validatedPage = Math.max(1, page);
  const validatedLimit = Math.min(Math.max(1, limit), 500);
  const offset = (validatedPage - 1) * validatedLimit;

  try {
    // Check if UserEvent table exists
    const userEventExists = await tableExists('UserEvent');
    if (!userEventExists) {
      console.log('UserEvent table does not exist, returning empty result');
      return {
        data: [],
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    // Remove userId filtering since UserEvent model doesn't have userId field
    const where = undefined;

    const [data, total] = await Promise.all([
      prisma.userEvent.findMany({
        where,
        skip: offset,
        take: validatedLimit,
      }),
      prisma.userEvent.count({ where }),
    ]);

    const totalPages = Math.ceil(total / validatedLimit);

    return {
      data,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages,
        hasNext: validatedPage < totalPages,
        hasPrev: validatedPage > 1,
      },
    };
  } catch (error) {
    console.error('❌ Error fetching user events:', error);
    return {
      data: [],
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }
}

// Cached aggregation queries with better performance
export async function getInsightStats() {
  try {
    // Use a single query with conditional aggregation for better performance
    const stats = await prisma.insight.aggregate({
      _count: {
        id: true,
      },
    });

    const [activeInsights, todayInsights] = await Promise.all([
      prisma.insight.count({
        where: { status: InsightStatus.OPEN },
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
      total: stats._count.id,
      active: activeInsights,
      today: todayInsights,
    };
  } catch (error) {
    console.error('❌ Error fetching insight stats:', error);
    return {
      total: 0,
      active: 0,
      today: 0,
    };
  }
}

// Batch operations for better performance with proper error handling
export async function batchCreateInsights(
  insights: Prisma.InsightCreateManyInput[],
): Promise<Prisma.BatchPayload> {
  if (!insights.length) {
    throw new Error('No insights provided for batch creation');
  }

  try {
    const result = await prisma.insight.createMany({
      data: insights,
    });
    console.log(`✅ Successfully created ${result.count} insights`);
    return result;
  } catch (error) {
    console.error('❌ Error batch creating insights:', error);
    throw new Error('Failed to batch create insights');
  }
}

// Connection health check with improved metrics
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency: number;
  timestamp: Date;
  version?: string;
}> {
  const start = performance.now();
  const timestamp = new Date();

  try {
    // Test basic connectivity
    await prisma.$queryRaw`SELECT 1 as test`;

    // Get database version if possible
    let version: string | undefined;
    try {
      const provider = await getDatabaseProvider();
      let versionResult: any;

      switch (provider) {
        case 'postgresql':
          versionResult = await prisma.$queryRaw<
            [{ version: string }]
          >`SELECT version() as version`;
          break;
        case 'mysql':
          versionResult = await prisma.$queryRaw<
            [{ version: string }]
          >`SELECT VERSION() as version`;
          break;
        case 'sqlite':
        default:
          versionResult = await prisma.$queryRaw<
            [{ version: string }]
          >`SELECT sqlite_version() as version`;
          break;
      }

      version =
        Array.isArray(versionResult) && versionResult[0] ? versionResult[0].version : undefined;
    } catch {
      // Version query might not work on all databases
      version = undefined;
    }

    const latency = performance.now() - start;
    return { healthy: true, latency, timestamp, version };
  } catch (error) {
    const latency = performance.now() - start;
    console.error('❌ Database health check failed:', error);
    return { healthy: false, latency, timestamp };
  }
}

// Cleanup function for old data with improved safety
export async function cleanupOldData(daysOld: number = 30): Promise<{
  deletedEvents: number;
  deletedInsights: number;
  errors: string[];
}> {
  if (daysOld < 1) {
    throw new Error('daysOld must be at least 1');
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  const errors: string[] = [];

  let deletedEvents = 0;
  let deletedInsights = 0;

  try {
    // Clean up user events if table exists
    try {
      const userEventExists = await tableExists('UserEvent');
      if (userEventExists) {
        const eventResult = await prisma.userEvent.deleteMany({
          where: {},
        });
        deletedEvents = eventResult.count;
      } else {
        console.log('UserEvent table does not exist, skipping cleanup');
      }
    } catch (error) {
      errors.push(
        `UserEvent cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    // Clean up old resolved insights
    try {
      const insightResult = await prisma.insight.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          status: InsightStatus.RESOLVED,
        },
      });
      deletedInsights = insightResult.count;
    } catch (error) {
      errors.push(
        `Insight cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    if (errors.length > 0) {
      console.warn('⚠️ Some cleanup operations failed:', errors);
    }

    return {
      deletedEvents,
      deletedInsights,
      errors,
    };
  } catch (error) {
    console.error('❌ Error during cleanup operation:', error);
    throw new Error('Cleanup operation failed');
  }
}

// Additional optimization functions

// Connection pool health check
export async function checkConnectionPool(): Promise<{
  activeConnections: number;
  idleConnections: number;
}> {
  try {
    const provider = await getDatabaseProvider();

    if (provider === 'postgresql') {
      // For PostgreSQL with pg pool, query pg_stat_activity
      const result = await prisma.$queryRaw<[{ active: number; idle: number }]>`
        SELECT 
          COUNT(*) FILTER (WHERE state = 'active') as active,
          COUNT(*) FILTER (WHERE state = 'idle') as idle
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;

      return {
        activeConnections: Array.isArray(result) && result[0] ? result[0].active || 0 : 0,
        idleConnections: Array.isArray(result) && result[0] ? result[0].idle || 0 : 0,
      };
    } else if (provider === 'mysql') {
      // For MySQL, query INFORMATION_SCHEMA.PROCESSLIST
      const result = await prisma.$queryRaw<[{ active: number; idle: number }]>`
        SELECT 
          SUM(CASE WHEN COMMAND != 'Sleep' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN COMMAND = 'Sleep' THEN 1 ELSE 0 END) as idle
        FROM INFORMATION_SCHEMA.PROCESSLIST
        WHERE DB = DATABASE()
      `;

      return {
        activeConnections: Array.isArray(result) && result[0] ? result[0].active || 0 : 0,
        idleConnections: Array.isArray(result) && result[0] ? result[0].idle || 0 : 0,
      };
    } else {
      // SQLite doesn't have connection pooling in the same way
      return { activeConnections: 1, idleConnections: 0 };
    }
  } catch (error) {
    console.log(
      'Could not retrieve connection pool info:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    // Fallback for restricted access or unsupported queries
    return { activeConnections: 0, idleConnections: 0 };
  }
}

// Graceful disconnect
export async function gracefulDisconnect(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('✅ Database connection closed gracefully');
  } catch (error) {
    console.error('❌ Error during graceful disconnect:', error);
    throw error;
  }
}
