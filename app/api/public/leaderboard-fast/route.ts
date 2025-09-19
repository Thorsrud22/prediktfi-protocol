/**
 * Optimized Public Leaderboard API v2
 * GET /api/public/leaderboard-fast - Get creator leaderboard with caching and performance monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
// Simple in-memory cache implementation
interface CacheEntry<T> {
    data: T;
    etag: string;
    expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): CacheEntry<T> | null {
    const entry = cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    
    return entry;
}

function setCached<T>(key: string, data: T, ttlMs: number): CacheEntry<T> {
    const etag = createHash('sha256').update(JSON.stringify(data)).digest('hex').substring(0, 16);
    const entry: CacheEntry<T> = {
        data,
        etag,
        expiresAt: Date.now() + ttlMs
    };
    
    cache.set(key, entry);
    return entry;
}

function generateCacheKey(prefix: string, params: any): string {
    return `${prefix}:${createHash('sha256').update(JSON.stringify(params)).digest('hex').substring(0, 16)}`;
}
import { createHash } from 'crypto';

const prisma = new PrismaClient();

const LeaderboardQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d'),
  limit: z.coerce.number().min(1).max(100).default(100),
  offset: z.coerce.number().min(0).default(0),
});

export interface LeaderboardItem {
  creatorIdHashed: string;
  score: number;
  accuracy: number;
  consistency: number;
  volumeScore: number;
  recencyScore: number;
  maturedN: number;
  topBadge?: 'top1' | 'top2' | 'top3';
  trend?: 'up' | 'down' | 'flat';
  isProvisional: boolean;
}

export interface LeaderboardResponse {
  etag: string;
  generatedAt: string;
  period: string;
  items: LeaderboardItem[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Hash creator ID for privacy
 */
function hashCreatorId(creatorId: string): string {
  return createHash('sha256').update(creatorId).digest('hex').substring(0, 16);
}

async function getLeaderboardData(
  params: z.infer<typeof LeaderboardQuerySchema>,
): Promise<LeaderboardResponse> {
  const { period, limit, offset } = params;

  // Calculate date filter based on period
  const now = new Date();
  let dateFilter: Date | undefined;

  if (period !== 'all') {
    const days = { '7d': 7, '30d': 30, '90d': 90 }[period];
    dateFilter = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  // Optimized query with indexed fields
  const whereClause = dateFilter
    ? {
        createdAt: { gte: dateFilter },
        maturedAt: { not: null },
      }
    : {
        maturedAt: { not: null },
      };

  // Use raw query for better performance on large datasets
  const items = await prisma.$queryRaw<any[]>`
    SELECT 
      "creatorId",
      AVG(CASE WHEN "isCorrect" THEN 1.0 ELSE 0.0 END) as accuracy,
      COUNT(*) as total_predictions,
      COUNT(CASE WHEN "maturedAt" IS NOT NULL THEN 1 END) as matured_count
    FROM "Intent" i
    WHERE ${dateFilter ? `i."createdAt" >= ${dateFilter.toISOString()}` : '1=1'}
      AND i."maturedAt" IS NOT NULL
    GROUP BY "creatorId"
    HAVING COUNT(CASE WHEN "maturedAt" IS NOT NULL THEN 1 END) >= 5
    ORDER BY 
      AVG(CASE WHEN "isCorrect" THEN 1.0 ELSE 0.0 END) DESC,
      COUNT(*) DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  // Get total count for pagination
  const totalResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(DISTINCT "creatorId") as count
    FROM "Intent" i
    WHERE ${dateFilter ? `i."createdAt" >= ${dateFilter.toISOString()}` : '1=1'}
      AND i."maturedAt" IS NOT NULL
    GROUP BY "creatorId"
    HAVING COUNT(CASE WHEN "maturedAt" IS NOT NULL THEN 1 END) >= 5
  `;

  const total = Number(totalResult[0]?.count || 0);

  // Transform results
  const leaderboardItems: LeaderboardItem[] = items.map((item, index) => {
    const accuracy = Number(item.accuracy) || 0;
    const maturedN = Number(item.matured_count) || 0;

    // Simple scoring algorithm - can be enhanced
    const score = accuracy * 100;
    const consistency = Math.min(maturedN / 20, 1); // Consistency based on number of predictions

    // Assign badges for top 3
    let topBadge: 'top1' | 'top2' | 'top3' | undefined;
    if (offset === 0) {
      if (index === 0) topBadge = 'top1';
      else if (index === 1) topBadge = 'top2';
      else if (index === 2) topBadge = 'top3';
    }

    return {
      creatorIdHashed: hashCreatorId(item.creatorId),
      score: Math.round(score * 100) / 100,
      accuracy: Math.round(accuracy * 10000) / 100, // Convert to percentage
      consistency: Math.round(consistency * 100) / 100,
      volumeScore: Math.min(maturedN / 10, 10), // Volume score out of 10
      recencyScore: 1, // Simplified - could analyze recent activity
      maturedN,
      topBadge,
      trend: 'flat', // Simplified - would need historical data
      isProvisional: maturedN < 10,
    };
  });

  const generatedAt = new Date().toISOString();
  const etag = createHash('sha256')
    .update(JSON.stringify({ items: leaderboardItems, generatedAt }))
    .digest('hex')
    .substring(0, 16);

  return {
    etag,
    generatedAt,
    period,
    items: leaderboardItems,
    meta: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
}

async function handleRequest(request: NextRequest): Promise<Response> {
  try {
    const url = new URL(request.url);
    const params = LeaderboardQuerySchema.parse(Object.fromEntries(url.searchParams));

    // Generate cache key
    const cacheKey = generateCacheKey('leaderboard', params);

    // Check cache first
    const cached = getCached<LeaderboardResponse>(cacheKey);
    
    // Check if client has current version
    const clientEtag = request.headers.get('if-none-match');
    if (cached) {
      if (clientEtag && clientEtag === cached.etag) {
        return new NextResponse(null, {
          status: 304,
          headers: { ETag: cached.etag },
        });
      }
      
      return NextResponse.json(cached.data, {
        status: 200,
        headers: {
          ETag: cached.etag,
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
          'X-Cache': 'HIT',
        },
      });
    }

    // Generate fresh data
    const data = await getLeaderboardData(params);

    // Cache for 5 minutes
    const cacheEntry = setCached(cacheKey, data, 5 * 60 * 1000);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        ETag: cacheEntry.etag,
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = handleRequest;
