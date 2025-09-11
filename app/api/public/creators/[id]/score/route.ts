/**
 * Public Creator Score API
 * GET /api/public/creators/[id]/score - Get creator's score and basic info
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { CreatorScore } from '@/src/lib/creatorClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      );
    }
    
    // Generate ETag for caching
    const etag = `"score-${id}-${Math.floor(Date.now() / 300000)}"`; // 5-minute ETag
    
    // Check if client has cached version
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { 
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 's-maxage=120, stale-while-revalidate=300'
        }
      });
    }
    
    // Try to find creator by handle first, then by hashed id
    let creator = await prisma.creator.findUnique({
      where: { handle: id },
      include: {
        insights: {
          where: {
            status: 'RESOLVED',
            outcomes: {
              some: {
                result: { in: ['YES', 'NO'] }
              }
            }
          },
          select: {
            createdAt: true,
            status: true
          }
        }
      }
    });
    
    if (!creator) {
      creator = await prisma.creator.findUnique({
        where: { id: id },
        include: {
          insights: {
            where: {
              status: 'RESOLVED',
              outcomes: {
                some: {
                  result: { in: ['YES', 'NO'] }
                }
              }
            },
            select: {
              createdAt: true,
              status: true
            }
          }
        }
      });
    }
    
    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }
    
    // Calculate counts
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const totalInsights = await prisma.insight.count({
      where: { creatorId: creator.id }
    });
    
    const resolvedInsights = await prisma.insight.count({
      where: { 
        creatorId: creator.id,
        status: 'RESOLVED'
      }
    });
    
    const pendingInsights = totalInsights - resolvedInsights;
    
    const last90dInsights = await prisma.insight.count({
      where: {
        creatorId: creator.id,
        createdAt: { gte: ninetyDaysAgo }
      }
    });
    
    // Calculate 7-day rank (simplified - top 3 only)
    const topCreators = await prisma.creator.findMany({
      where: {
        insights: {
          some: {
            status: 'RESOLVED'
          }
        }
      },
      orderBy: { score: 'desc' },
      take: 3
    });
    
    const rank7d = topCreators.findIndex(c => c.id === creator.id);
    
    const response: CreatorScore = {
      idHashed: creator.id,
      handle: creator.handle,
      score: creator.score,
      accuracy90d: creator.accuracy, // Using general accuracy for now
      joinedAt: creator.createdAt.toISOString(),
      rank7d: rank7d >= 0 && rank7d < 3 ? rank7d + 1 : null,
      provisional: resolvedInsights < 50,
      counts: {
        resolved: resolvedInsights,
        pending: pendingInsights,
        last90d: last90dInsights,
        total: totalInsights
      }
    };
    
    const duration = Date.now() - startTime;
    console.log(`📊 Creator score API: ${duration}ms`);
    
    return NextResponse.json(response, {
      headers: {
        'ETag': etag,
        'Cache-Control': 's-maxage=120, stale-while-revalidate=300',
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Error fetching creator score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}