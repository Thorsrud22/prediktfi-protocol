/**
 * Creator Digest API
 * GET /api/digest/creator - Daily creator digest with top performers and transitions
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createHmac } from 'crypto';

const prisma = new PrismaClient();

export interface CreatorDigestResponse {
  date: string;
  summary: {
    totalCreators: number;
    provisionalCreators: number;
    stableCreators: number;
    newStable: number; // Creators who moved from provisional to stable
    topPerformers: number;
  };
  topPerformers: Array<{
    id: string;
    handle: string;
    score: number;
    accuracy: number;
    rank: number;
    isProvisional: boolean;
    trend: 'up' | 'down' | 'flat';
    change: number;
  }>;
  movers: Array<{
    id: string;
    handle: string;
    score: number;
    rank: number;
    previousRank: number;
    rankChange: number;
    isProvisional: boolean;
    trend: 'up' | 'down' | 'flat';
  }>;
  provisionalToStable: Array<{
    id: string;
    handle: string;
    score: number;
    maturedInsights: number;
    previousMatured: number;
    change: number;
  }>;
  generatedAt: string;
}

/**
 * Verify HMAC signature for digest endpoint
 */
function verifyHMACSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}

/**
 * Calculate trend direction for score changes
 */
function calculateTrend(currentScore: number, previousScore: number): 'up' | 'down' | 'flat' {
  const diff = currentScore - previousScore;
  const threshold = 0.01; // 1 percentage point threshold for flat trend
  
  if (Math.abs(diff) < threshold) return 'flat';
  return diff > 0 ? 'up' : 'down';
}

export async function GET(request: NextRequest) {
  try {
    // Check for HMAC signature
    const signature = request.headers.get('x-ops-signature');
    const opsSecret = process.env.OPS_SECRET;
    
    if (!opsSecret) {
      console.error('OPS_SECRET not configured');
      return NextResponse.json(
        { error: 'Operations secret not configured' },
        { status: 500 }
      );
    }
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-ops-signature header' },
        { status: 401 }
      );
    }
    
    // Get request body for signature verification (empty for GET)
    const body = '';
    
    if (!verifyHMACSignature(body, signature, opsSecret)) {
      console.error('Invalid HMAC signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    console.log('📊 Generating creator digest...');
    
    // Get current date and yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Get current leaderboard (top 50)
    const currentCreators = await prisma.creator.findMany({
      where: {
        score: { gt: 0 },
        insights: {
          some: {
            status: 'RESOLVED'
          }
        }
      },
      select: {
        id: true,
        handle: true,
        score: true,
        accuracy: true,
        insightsCount: true,
        brierMean: true,
        lastScoreUpdate: true
      },
      orderBy: {
        score: 'desc'
      },
      take: 50
    });
    
    // Get yesterday's daily records for comparison
    const yesterdayRecords = await prisma.creatorDaily.findMany({
      where: {
        day: yesterday
      },
      select: {
        creatorId: true,
        score: true,
        maturedN: true
      }
    });
    
    const yesterdayMap = new Map(yesterdayRecords.map(r => [r.creatorId, r]));
    
    // Calculate trends and changes
    const creatorsWithTrends = currentCreators.map((creator, index) => {
      const yesterdayRecord = yesterdayMap.get(creator.id);
      const previousScore = yesterdayRecord?.score || creator.score;
      const trend = calculateTrend(creator.score, previousScore);
      const change = creator.score - previousScore;
      
      return {
        ...creator,
        rank: index + 1,
        isProvisional: creator.insightsCount < 50,
        trend,
        change
      };
    });
    
    // Get top performers (top 10)
    const topPerformers = creatorsWithTrends.slice(0, 10);
    
    // Get movers (rank changes > 5 positions)
    const movers = creatorsWithTrends
      .map(creator => {
        const yesterdayRecord = yesterdayMap.get(creator.id);
        const previousRank = yesterdayRecord ? 
          currentCreators.findIndex(c => c.id === creator.id) + 1 : 
          creator.rank;
        const rankChange = previousRank - creator.rank;
        
        return {
          ...creator,
          previousRank,
          rankChange
        };
      })
      .filter(creator => Math.abs(creator.rankChange) >= 5)
      .sort((a, b) => Math.abs(b.rankChange) - Math.abs(a.rankChange))
      .slice(0, 10);
    
    // Get creators who moved from provisional to stable
    const provisionalToStable = creatorsWithTrends
      .filter(creator => {
        const yesterdayRecord = yesterdayMap.get(creator.id);
        const wasProvisional = yesterdayRecord ? yesterdayRecord.maturedN < 50 : creator.insightsCount < 50;
        const isStable = creator.insightsCount >= 50;
        
        return wasProvisional && isStable;
      })
      .map(creator => {
        const yesterdayRecord = yesterdayMap.get(creator.id);
        const previousMatured = yesterdayRecord?.maturedN || 0;
        const change = creator.insightsCount - previousMatured;
        
        return {
          id: creator.id,
          handle: creator.handle,
          score: creator.score,
          maturedInsights: creator.insightsCount,
          previousMatured,
          change
        };
      })
      .sort((a, b) => b.change - a.change);
    
    // Calculate summary statistics
    const totalCreators = currentCreators.length;
    const provisionalCreators = creatorsWithTrends.filter(c => c.isProvisional).length;
    const stableCreators = totalCreators - provisionalCreators;
    const newStable = provisionalToStable.length;
    
    const response: CreatorDigestResponse = {
      date: today.toISOString().split('T')[0],
      summary: {
        totalCreators,
        provisionalCreators,
        stableCreators,
        newStable,
        topPerformers: topPerformers.length
      },
      topPerformers,
      movers,
      provisionalToStable,
      generatedAt: new Date().toISOString()
    };
    
    console.log(`✅ Creator digest generated: ${totalCreators} creators, ${newStable} new stable, ${movers.length} movers`);
    
    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
    
  } catch (error) {
    console.error('Creator digest error:', error);
    
    return NextResponse.json(
      { 
        error: `Creator digest failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        generatedAt: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Health check endpoint
export async function HEAD(request: NextRequest) {
  try {
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Creator digest health check failed:', error);
    return new NextResponse(null, { status: 503 });
  }
}
