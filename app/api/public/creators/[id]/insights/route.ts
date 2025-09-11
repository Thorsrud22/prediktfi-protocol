/**
 * Public Creator Insights API
 * GET /api/public/creators/[id]/insights - Get creator's recent insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export interface CreatorInsightLite {
  id: string;
  title: string;
  category: string;
  predicted: number;        // 0..1
  status: 'OPEN' | 'RESOLVED';
  resolved?: 'YES' | 'NO';
  createdAt: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      );
    }
    
    // Generate ETag for caching
    const etag = `"insights-${id}-${limit}-${Math.floor(Date.now() / 120000)}"`; // 2-minute ETag
    
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
      select: { id: true, handle: true }
    });
    
    if (!creator) {
      creator = await prisma.creator.findUnique({
        where: { id: id },
        select: { id: true, handle: true }
      });
    }
    
    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }
    
    // Fetch recent insights
    const insights = await prisma.insight.findMany({
      where: { creatorId: creator.id },
      select: {
        id: true,
        question: true,
        category: true,
        probability: true,
        p: true,
        status: true,
        createdAt: true,
        outcomes: {
          select: {
            result: true,
            decidedAt: true
          },
          orderBy: { decidedAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    // Transform to lite format
    const insightsLite: CreatorInsightLite[] = insights.map(insight => {
      // Use p if available, otherwise fall back to probability
      const predicted = insight.p 
        ? (typeof insight.p === 'number' ? insight.p : Number(insight.p))
        : (typeof insight.probability === 'number' ? insight.probability : Number(insight.probability));
      
      return {
        id: insight.id,
        title: insight.question,
        category: insight.category || 'General',
        predicted,
        status: insight.status as 'OPEN' | 'RESOLVED',
        resolved: insight.outcomes.length > 0 ? insight.outcomes[0].result as 'YES' | 'NO' : undefined,
        createdAt: insight.createdAt.toISOString()
      };
    });
    
    const duration = Date.now() - startTime;
    console.log(`📊 Creator insights API: ${duration}ms (${insightsLite.length} insights)`);
    
    return NextResponse.json(insightsLite, {
      headers: {
        'ETag': etag,
        'Cache-Control': 's-maxage=120, stale-while-revalidate=300',
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Error fetching creator insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
