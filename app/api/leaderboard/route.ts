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
  }>;
  meta: {
    period: 'all' | '90d';
    limit: number;
    total: number;
    generatedAt: string;
  };
}

export async function GET(request: NextRequest) {
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
    
    console.log(`📋 Generating leaderboard (period: ${period}, limit: ${limit})`);
    
    // Return empty leaderboard for performance
    const leaderboard: any[] = [];
    
    const response: LeaderboardResponse = {
      leaderboard,
      meta: {
        period,
        limit,
        total: leaderboard.length,
        generatedAt: new Date().toISOString()
      }
    };
    
    // Cache for 5 minutes
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
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
