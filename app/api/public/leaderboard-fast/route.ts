/**
 * Optimized Public Leaderboard API v2 backed by Redis cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { performance } from 'perf_hooks';
import { prisma } from '../../../lib/prisma';
import {
  LeaderboardPeriod,
  MAX_CACHE_LIMIT,
  buildResponseFromPayload,
  getCachedLeaderboardSlice,
  refreshLeaderboardPeriod,
} from '../../../../src/server/leaderboard/leaderboard-cache';
import type {
  LeaderboardResponse as LeaderboardResponseType,
  LeaderboardItem as LeaderboardItemType,
} from '../../../../src/server/leaderboard/leaderboard-cache';

const VARIANT = 'leaderboard-fast';

const LeaderboardQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
  limit: z.coerce.number().min(1).max(MAX_CACHE_LIMIT).default(100),
  offset: z.coerce.number().min(0).default(0),
});

export type LeaderboardItem = LeaderboardItemType;
export type LeaderboardResponse = LeaderboardResponseType;

function responseHeaders({
  etag,
  cacheStatus,
  generatedAt,
  durationMs,
}: {
  etag: string;
  cacheStatus: 'HIT' | 'MISS' | 'BYPASS';
  generatedAt: string;
  durationMs: number;
}) {
  return {
    ETag: etag,
    'Cache-Control': 'public, max-age=30, s-maxage=180, stale-while-revalidate=300',
    'X-Cache': cacheStatus,
    'X-Cache-Backend': cacheStatus === 'HIT' ? 'redis' : 'prisma',
    'X-Generated-At': generatedAt,
    'X-Response-Time': durationMs.toFixed(2),
  } as Record<string, string>;
}

export async function GET(request: NextRequest) {
  const startedAt = performance.now();

  try {
    const { searchParams } = new URL(request.url);
    const queryResult = LeaderboardQuerySchema.safeParse({
      period: searchParams.get('period') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: queryResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { period, limit, offset } = queryResult.data as {
      period: LeaderboardPeriod;
      limit: number;
      offset: number;
    };

    const allowCache = offset + limit <= MAX_CACHE_LIMIT;
    const ifNoneMatch = request.headers.get('if-none-match');
    let cacheStatus: 'HIT' | 'MISS' | 'BYPASS' = allowCache ? 'MISS' : 'BYPASS';

    if (allowCache) {
      const cachedPayload = await getCachedLeaderboardSlice(period, limit, offset);
      if (cachedPayload) {
        const cachedResponse = buildResponseFromPayload(cachedPayload, limit, offset);
        cacheStatus = 'HIT';
        if (ifNoneMatch && ifNoneMatch === cachedResponse.etag) {
          return new NextResponse(null, {
            status: 304,
            headers: {
              ETag: cachedResponse.etag,
              'X-Cache': cacheStatus,
              'X-Cache-Backend': 'redis',
              'X-Generated-At': cachedResponse.generatedAt,
            },
          });
        }

        const durationMs = performance.now() - startedAt;
        console.log(
          `[${VARIANT}] cache=HIT period=${period} limit=${limit} offset=${offset} durationMs=${durationMs.toFixed(2)}`
        );

        return NextResponse.json(cachedResponse, {
          headers: responseHeaders({
            etag: cachedResponse.etag,
            cacheStatus,
            generatedAt: cachedResponse.generatedAt,
            durationMs,
          }),
        });
      }
    }

    const rebuilt = await refreshLeaderboardPeriod(prisma, period);
    if (!rebuilt) {
      throw new Error('Unable to build leaderboard payload');
    }

    const responsePayload = buildResponseFromPayload(rebuilt, limit, offset);

    if (ifNoneMatch && ifNoneMatch === responsePayload.etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: responsePayload.etag,
          'X-Cache': cacheStatus,
          'X-Cache-Backend': 'prisma',
          'X-Generated-At': responsePayload.generatedAt,
        },
      });
    }

    const durationMs = performance.now() - startedAt;
    console.log(
      `[${VARIANT}] cache=${cacheStatus} period=${period} limit=${limit} offset=${offset} durationMs=${durationMs.toFixed(2)}`
    );

    return NextResponse.json(responsePayload, {
      headers: responseHeaders({
        etag: responsePayload.etag,
        cacheStatus,
        generatedAt: responsePayload.generatedAt,
        durationMs,
      }),
    });
  } catch (error) {
    console.error('Leaderboard fast API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
