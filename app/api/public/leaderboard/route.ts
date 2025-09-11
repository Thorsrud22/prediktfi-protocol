/**
 * Public Leaderboard API v1
 * GET /api/public/leaderboard - Get creator leaderboard with new scoring system
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { calculateTrend } from '../../../lib/creatorScore';

const prisma = new PrismaClient();

const LeaderboardQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d'),
  limit: z.coerce.number().min(1).max(100).default(100),
  offset: z.coerce.number().min(0).default(0)
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

/**
 * Get date range for period
 */
function getDateRange(period: string): { since: Date; until: Date } {
  const until = new Date();
  const since = new Date();
  
  switch (period) {
    case '7d':
      since.setDate(since.getDate() - 7);
      break;
    case '30d':
      since.setDate(since.getDate() - 30);
      break;
    case '90d':
      since.setDate(since.getDate() - 90);
      break;
    case 'all':
      since.setTime(0); // All time
      break;
    default:
      since.setDate(since.getDate() - 30);
  }
  
  return { since, until };
}

/**
 * Calculate aggregated scores for a period
 */
async function calculatePeriodScores(
  creatorId: string,
  since: Date,
  until: Date,
  period: string
): Promise<LeaderboardItem | null> {
  // Get daily records for the period
  // Note: Using only gte due to Prisma lte issue with SQLite dates
  const dailyRecords = await prisma.creatorDaily.findMany({
    where: {
      creatorId,
      day: {
        gte: since
      }
    },
    orderBy: { day: 'asc' }
  });

  if (dailyRecords.length === 0) {
    return null;
  }

  // Calculate aggregated metrics
  const totalMaturedN = dailyRecords.reduce((sum, record) => sum + record.maturedN, 0);
  
  // Weighted average of accuracy (equal weights for simplicity)
  const accuracy = dailyRecords.reduce((sum, record) => sum + record.accuracy, 0) / dailyRecords.length;
  
  // Average consistency
  const consistency = dailyRecords.reduce((sum, record) => sum + record.consistency, 0) / dailyRecords.length;
  
  // Average volume score
  const volumeScore = dailyRecords.reduce((sum, record) => sum + record.volumeScore, 0) / dailyRecords.length;
  
  // Average recency score
  const recencyScore = dailyRecords.reduce((sum, record) => sum + record.recencyScore, 0) / dailyRecords.length;
  
  // Calculate total score
  const score = 0.45 * accuracy + 0.25 * consistency + 0.20 * volumeScore + 0.10 * recencyScore;
  
  // Check if provisional
  const isProvisional = totalMaturedN < 50;
  
  // Calculate trend (locked 7d vs previous 7d definition)
  let trend: 'up' | 'down' | 'flat' | undefined;
  if (period === '7d') {
    // For 7d period, compare with previous 7d period
    const prevSince = new Date(since);
    const prevUntil = new Date(since);
    prevSince.setDate(prevSince.getDate() - 7);
    
    const prevRecords = await prisma.creatorDaily.findMany({
      where: {
        creatorId,
        day: {
          gte: prevSince,
          lt: prevUntil
        }
      }
    });
    
    if (prevRecords.length > 0) {
      const prevScore = prevRecords.reduce((sum, record) => sum + record.score, 0) / prevRecords.length;
      trend = calculateTrend(score, prevScore);
    }
  }

  return {
    creatorIdHashed: hashCreatorId(creatorId),
    score,
    accuracy,
    consistency,
    volumeScore,
    recencyScore,
    maturedN: totalMaturedN,
    trend,
    isProvisional
  };
}

/**
 * Generate ETag for response
 */
function generateETag(data: any): string {
  const content = JSON.stringify(data);
  return `"${createHash('md5').update(content).digest('hex')}"`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryResult = LeaderboardQuerySchema.safeParse({
      period: searchParams.get('period'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset')
    });
    
    if (!queryResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters', 
          details: queryResult.error.errors 
        },
        { status: 400 }
      );
    }
    
    const { period, limit, offset } = queryResult.data;
    
    console.log(`📋 Generating public leaderboard (period: ${period}, limit: ${limit}, offset: ${offset}) - DEBUG VERSION`);
    
    // Check ETag for caching
    const ifNoneMatch = request.headers.get('if-none-match');
    
    // Get date range
    const { since, until } = getDateRange(period);
    
    // Get all creators with daily records in the period
    // Note: Using only gte due to Prisma lte issue with SQLite dates
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
    
    console.log(`🔍 Found ${creatorsWithData.length} creators with data in period ${since.toISOString()} to ${until.toISOString()}`);
    console.log('Sample creators:', creatorsWithData.slice(0, 3));
    
    // Calculate scores for each creator
    const items: LeaderboardItem[] = [];
    
    for (const { creatorId } of creatorsWithData) {
      const item = await calculatePeriodScores(creatorId, since, until, period);
      if (item) {
        items.push(item);
      }
    }
    
    // Sort by score descending
    items.sort((a, b) => b.score - a.score);
    
    // Add top badges for 7d period
    if (period === '7d') {
      items.slice(0, 3).forEach((item, index) => {
        if (index === 0) item.topBadge = 'top1';
        else if (index === 1) item.topBadge = 'top2';
        else if (index === 2) item.topBadge = 'top3';
      });
    }
    
    // Apply pagination
    const paginatedItems = items.slice(offset, offset + limit);
    const hasMore = offset + limit < items.length;
    
    const response: LeaderboardResponse = {
      etag: '',
      generatedAt: new Date().toISOString(),
      period,
      items: paginatedItems,
      meta: {
        total: items.length,
        limit,
        offset,
        hasMore
      }
    };
    
    // Generate ETag
    const etag = generateETag(response);
    response.etag = etag;
    
    // Check if client has cached version
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }
    
    // Cache for 5 minutes, allow stale for 5 minutes (total max 15min with 10min client cache)
    return NextResponse.json(response, {
      headers: {
        'ETag': etag,
        'Cache-Control': 'public, max-age=300, s-maxage=180, stale-while-revalidate=300',
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Public leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    
    // Quick health check - just verify we can query the database
    const { since } = getDateRange(period);
    await prisma.creatorDaily.findFirst({
      where: {
        day: { gte: since }
      }
    });
    
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('Public leaderboard health check failed:', error);
    return new NextResponse(null, { status: 503 });
  }
}
