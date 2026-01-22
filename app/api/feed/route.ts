// E9.0 Feed API - Node.js Runtime
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { FeedQuerySchema, FeedResponse, FeedInsight } from './_schemas';
import { prisma } from '@/app/lib/prisma';
import { trackServer } from '@/lib/analytics';

// Simple in-memory cache for feed results
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const feedCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60000; // 60 seconds cache (increased from 30s)
const STALE_WHILE_REVALIDATE = 300000; // 5 minutes stale-while-revalidate
const MAX_CACHE_SIZE = 50; // Reduced to more reasonable size to prevent memory leaks

function getCacheKey(params: any): string {
  return JSON.stringify({
    category: params.category,
    filter: params.filter,
    sort: params.sort,
    page: params.page,
    limit: params.limit,
    q: params.q || '',
    timeframe: params.timeframe,
  });
}

function getFromCache(key: string): any | null {
  const entry = feedCache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    feedCache.delete(key);
    return null;
  }

  return entry.data;
}

function setCache(key: string, data: any, ttl: number = CACHE_TTL): void {
  // Clean expired entries first
  const now = Date.now();
  for (const [k, entry] of feedCache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      feedCache.delete(k);
    }
  }

  // If still too large after cleanup, remove oldest 50% of entries
  if (feedCache.size >= MAX_CACHE_SIZE) {
    const keys = Array.from(feedCache.keys());
    const oldestKeys = keys.slice(0, Math.floor(keys.length / 2));
    oldestKeys.forEach(k => feedCache.delete(k));
    console.log(
      `[Feed API] Cleaned ${oldestKeys.length} old cache entries, size now: ${feedCache.size}`,
    );
  }

  feedCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

// Periodic cache cleanup to prevent memory buildup
declare global {
  var __feedCacheCleanupStarted: boolean | undefined;
}

if (!globalThis.__feedCacheCleanupStarted) {
  globalThis.__feedCacheCleanupStarted = true;
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of feedCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        feedCache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(
        `[Feed API] Auto-cleaned ${cleaned} expired cache entries, cache size: ${feedCache.size}`,
      );
    }
  }, 60000); // Clean every minute
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters with all possible fields
    const queryParams = {
      // Legacy parameters
      page: searchParams.get('page'),
      filter: searchParams.get('filter'),

      // New parameters
      category: searchParams.get('category'),
      q: searchParams.get('q'),
      cursor: searchParams.get('cursor'),
      limit: searchParams.get('limit'),
      sort: searchParams.get('sort'),
      timeframe: searchParams.get('timeframe'),
    };

    // Use safeParse and always succeed with defaults for invalid params
    const validation = FeedQuerySchema.safeParse(queryParams);

    let validatedParams;
    if (!validation.success) {
      // Log warning but don't throw 400 - use defaults instead
      console.warn('Feed API: Invalid query parameters, using defaults:', {
        errors: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        originalParams: queryParams,
      });

      // Parse again with empty object to get all defaults
      validatedParams = FeedQuerySchema.parse({});
    } else {
      validatedParams = validation.data;
    }

    let {
      page,
      limit,
      filter,
      sort,
      category: rawCategory,
      q,
      cursor,
      timeframe,
    } = validatedParams;

    // Validate and normalize enum values with fallbacks
    const validFilters = ['all', 'KOL', 'EXPERT', 'COMMUNITY', 'PREDIKT'];
    if (!validFilters.includes(filter)) {
      console.warn(`Feed API: Invalid filter '${filter}', defaulting to 'all'`);
      filter = 'all';
    }

    const validSorts = ['recent', 'top', 'trending'];
    if (!validSorts.includes(sort)) {
      console.warn(`Feed API: Invalid sort '${sort}', defaulting to 'recent'`);
      sort = 'recent';
    }

    const validTimeframes = ['24h', '7d', '30d'];
    if (!validTimeframes.includes(timeframe)) {
      console.warn(`Feed API: Invalid timeframe '${timeframe}', defaulting to '30d'`);
      timeframe = '30d';
    }

    const skip = (page - 1) * limit;

    // Normalize category with synonym mapping
    function normalizeCategory(cat: string): string {
      const normalized = (cat ?? 'all').toLowerCase().trim();

      // If empty string, default to 'all'
      if (!normalized) return 'all';

      // Map common synonyms
      const synonymMap: { [key: string]: string } = {
        crypto: 'crypto',
        cryptocurrency: 'crypto',
        coins: 'crypto',
        bitcoin: 'crypto',
        ethereum: 'crypto',
        btc: 'crypto',
        eth: 'crypto',
        sol: 'crypto',
        market: 'crypto', // market-related questions are typically crypto
        stocks: 'stocks',
        equities: 'stocks',
        finance: 'finance',
        financial: 'finance',
        politics: 'politics',
        political: 'politics',
        sports: 'sports',
        sport: 'sports',
        tech: 'technology',
        technology: 'technology',
        ai: 'technology',
        general: 'general',
        all: 'all',
      };

      // Return mapped value if found, otherwise return the normalized input (preserving unknown categories)
      return synonymMap[normalized] || normalized;
    }

    const normalizedCategory = normalizeCategory(rawCategory || 'all');

    // Development logging to verify parameter handling
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Feed API Request:', {
        originalQuery: {
          category: queryParams.category,
          q: queryParams.q,
          filter: queryParams.filter,
          sort: queryParams.sort,
          limit: queryParams.limit,
          page: queryParams.page,
          cursor: queryParams.cursor,
          timeframe: queryParams.timeframe,
        },
        normalizedParams: {
          category: normalizedCategory,
          q: q,
          filter: filter,
          sort: sort,
          limit: limit,
          page: page,
          timeframe: timeframe,
        },
        validationSuccess: validation.success,
      });
    }

    // Generate cache key for this request
    const cacheKey = getCacheKey({
      category: normalizedCategory,
      filter,
      sort,
      page,
      limit,
      q,
      timeframe,
    });

    // Try to get from cache first
    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
      console.log('Feed API: Cache hit for', cacheKey.substring(0, 50) + '...');

      // Add cache header and return cached result
      const tookMs = Date.now() - startTime;
      return NextResponse.json(cachedResult, {
        headers: {
          'X-Processing-Time': `${tookMs}ms`,
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      });
    }

    // Build where clause based on filter, category, and search query
    const whereClause: any = {
      visibility: 'PUBLIC',
    };

    // Handle legacy filter parameter
    if (filter !== 'all') {
      // Map filter to creator types
      const creatorTypeMap = {
        KOL: 'kol',
        EXPERT: 'expert',
        COMMUNITY: 'community',
        PREDIKT: 'predikt',
      };

      // For now, we'll filter by category since we don't have creator types yet
      // This is a simplified implementation
      if (filter === 'PREDIKT') {
        whereClause.creatorId = null; // Insights without creators are "Predikt" insights
      } else {
        whereClause.creatorId = { not: null }; // Has creator
      }
    }

    // Handle category filtering (prioritize over legacy filter)
    if (normalizedCategory !== 'all') {
      // Only apply category filter if it's a known category
      const knownCategories = ['crypto', 'stocks', 'finance', 'politics', 'sports', 'technology'];
      if (knownCategories.includes(normalizedCategory)) {
        whereClause.category = {
          contains: normalizedCategory,
        };
      }
      // For unknown categories, we'll return empty results (handled later)
    }

    // Handle search query
    if (q && q.trim()) {
      whereClause.OR = [
        {
          question: {
            contains: q.trim(),
          },
        },
        {
          category: {
            contains: q.trim(),
          },
        },
      ];
    }

    // Build order clause based on sort
    const orderBy: any = [];

    if (sort === 'trending') {
      // For trending, prioritize recent insights with high confidence and engagement
      orderBy.push({ confidence: 'desc' });
      orderBy.push({ createdAt: 'desc' });
    } else if (sort === 'top') {
      // For top, prioritize by confidence and probability
      orderBy.push({ confidence: 'desc' });
      orderBy.push({ probability: 'desc' });
      orderBy.push({ createdAt: 'desc' });
    } else {
      // Recent sort (default)
      orderBy.push({ createdAt: 'desc' });
    }

    // Check if this is an unknown category - return empty results gracefully
    const knownCategories = [
      'crypto',
      'stocks',
      'finance',
      'politics',
      'sports',
      'technology',
      'all',
      'general',
      'market',
    ];
    const isUnknownCategory =
      normalizedCategory !== 'all' && !knownCategories.includes(normalizedCategory);

    let total = 0;
    let insights: any[] = [];

    if (isUnknownCategory) {
      // For unknown categories, return empty results with 200 status (never 400)
      console.log(
        `Feed API: Unknown category '${normalizedCategory}', returning empty results with 200 status`,
      );
    } else {
      // Optimize: Run count and findMany in parallel for better performance
      const [totalCount, insightResults] = await Promise.all([
        prisma.insight.count({
          where: whereClause,
        }),
        prisma.insight.findMany({
          where: whereClause,
          orderBy,
          skip,
          take: limit,
          include: {
            creator: {
              select: {
                handle: true,
                score: true,
              },
            },
          },
        }),
      ]);

      total = totalCount;
      insights = insightResults;
    }

    // Transform to feed format
    const feedInsights: FeedInsight[] = insights.map(insight => ({
      id: insight.id,
      question: insight.question,
      category: insight.category,
      probability: insight.probability,
      confidence: insight.confidence,
      stamped: insight.stamped,
      createdAt: insight.createdAt.toISOString(),
      visibility: insight.visibility,
      creator: insight.creator
        ? {
            handle: insight.creator.handle,
            score: insight.creator.score,
          }
        : undefined,
    }));

    // Build pagination info
    const pages = Math.ceil(total / limit);
    const pagination = {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    };

    // Generate next cursor for pagination (simple implementation using last item ID)
    const nextCursor =
      feedInsights.length === limit && feedInsights.length > 0
        ? feedInsights[feedInsights.length - 1].id
        : null;

    // Build response
    const response: FeedResponse = {
      insights: feedInsights,
      pagination,
      filters: {
        current: normalizedCategory,
        available: [
          'all',
          'crypto',
          'stocks',
          'finance',
          'politics',
          'sports',
          'technology',
          'KOL',
          'EXPERT',
          'COMMUNITY',
          'PREDIKT',
        ],
      },
      // Add new fields for API compatibility
      nextCursor,
      query: q,
      category: normalizedCategory,
      sort,
      timeframe,
    };

    const tookMs = Date.now() - startTime;

    // Cache the response for future requests
    setCache(cacheKey, response, CACHE_TTL);

    trackServer('feed_viewed', {
      filter,
      sort,
      category: normalizedCategory,
      query: q,
      page,
      limit,
      resultsCount: feedInsights.length,
      tookMs,
      cached: false,
    });

    return NextResponse.json(response, {
      headers: {
        'X-Processing-Time': `${tookMs}ms`,
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    const tookMs = Date.now() - startTime;
    console.error('Feed API error:', error);

    trackServer('feed_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tookMs,
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Unable to load feed at this time',
      },
      {
        status: 500,
        headers: {
          'X-Processing-Time': `${tookMs}ms`,
        },
      },
    );
  }
}

// Handle non-GET methods with proper 405 error
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'GET' } },
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'GET' } },
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'GET' } },
  );
}
