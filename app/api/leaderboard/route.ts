/**
 * Leaderboard API
 * GET /api/leaderboard - Get top creators with period filter
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getLeaderboard } from '../../../lib/score';

const LeaderboardQuerySchema = z.object({
  period: z.enum(['all', '90d']).optional().default('all'),
  limit: z.coerce.number().min(1).max(100).default(50)
});

export interface LeaderboardResponse {
  leaderboard: Array<{
    id: string;
    handle: string;
    score: number;
    accuracy: number;
    totalInsights: number;
    resolvedInsights: number;
    averageBrier: number;
    rank: number;
    isProvisional: boolean;
    trend?: 'up' | 'down' | 'flat';
  }>;
  meta: {
    period: 'all' | '90d';
    limit: number;
    total: number;
    generatedAt: string;
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryResult = LeaderboardQuerySchema.safeParse({
      period: searchParams.get('period'),
      limit: searchParams.get('limit')
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
    
    const { period, limit } = queryResult.data;
    
    // Check for conditional requests (304 Not Modified)
    const ifModifiedSince = request.headers.get('if-modified-since');
    const ifNoneMatch = request.headers.get('if-none-match');
    
    // Generate ETag based on period and limit
    const etag = `"leaderboard-${period}-${limit}-${Math.floor(Date.now() / 300000)}"`; // 5-minute ETag
    
    // Check if client has cached version
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { 
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
        }
      });
    }
    
    console.log(`📋 Generating leaderboard (period: ${period}, limit: ${limit})`);
    
    // Get leaderboard data from score module
    const leaderboard = await getLeaderboard(period, limit);
    
    const response: LeaderboardResponse = {
      leaderboard,
      meta: {
        period,
        limit,
        total: leaderboard.length,
        generatedAt: new Date().toISOString()
      }
    };
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Leaderboard generated in ${processingTime}ms (P95 target: <300ms)`);
    
    // Cache for 5 minutes with ETag
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'ETag': etag,
        'Last-Modified': new Date().toUTCString(),
        'X-Processing-Time': `${processingTime}ms`
      }
    });
    
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD(request: NextRequest) {
  try {
    // Quick health check - just verify we can connect to database
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') === '90d' ? '90d' : 'all';
    
    // Get just the top creator to verify system is working
    await getLeaderboard(period, 1);
    
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('Leaderboard health check failed:', error);
    return new NextResponse(null, { status: 503 });
  }
}
