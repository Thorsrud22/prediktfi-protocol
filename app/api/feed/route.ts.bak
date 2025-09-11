// E9.0 Feed API - Node.js Runtime
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { FeedQuerySchema, FeedResponse, FeedInsight } from './_schemas';
import { prisma } from '../../lib/prisma';
import { trackServer } from '../../lib/analytics';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      filter: searchParams.get('filter'),
      sort: searchParams.get('sort'),
    };
    
    const validation = FeedQuerySchema.safeParse(queryParams);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }
    
    const { page, limit, filter, sort } = validation.data;
    const skip = (page - 1) * limit;
    
    // Build where clause based on filter
    const whereClause: any = {};
    
    if (filter !== 'all') {
      // Map filter to creator types
      const creatorTypeMap = {
        'KOL': 'kol',
        'EXPERT': 'expert', 
        'COMMUNITY': 'community',
        'PREDIKT': 'predikt',
      };
      
      // For now, we'll filter by category since we don't have creator types yet
      // This is a simplified implementation
      if (filter === 'PREDIKT') {
        whereClause.creatorId = null; // Insights without creators are "Predikt" insights
      } else {
        whereClause.creatorId = { not: null }; // Has creator
      }
    }
    
    // Build order clause based on sort
    const orderBy: any = [];
    
    if (sort === 'trending') {
      // For trending, prioritize recent insights with high confidence and engagement
      orderBy.push({ confidence: 'desc' });
      orderBy.push({ createdAt: 'desc' });
    } else {
      // Recent sort
      orderBy.push({ createdAt: 'desc' });
    }
    
    // Get total count for pagination
    const total = await prisma.insight.count({
      where: whereClause,
    });
    
    // Get insights with pagination
    const insights = await prisma.insight.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: limit,
      include: {
        creator: {
          select: {
            handle: true,
            score: true,
          }
        }
      }
    });
    
    // Transform to feed format
    const feedInsights: FeedInsight[] = insights.map(insight => ({
      id: insight.id,
      question: insight.question,
      category: insight.category,
      probability: insight.probability,
      confidence: insight.confidence,
      stamped: insight.stamped,
      createdAt: insight.createdAt.toISOString(),
      creator: insight.creator ? {
        handle: insight.creator.handle,
        score: insight.creator.score,
      } : undefined,
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
    
    // Build response
    const response: FeedResponse = {
      insights: feedInsights,
      pagination,
      filters: {
        current: filter,
        available: ['all', 'KOL', 'EXPERT', 'COMMUNITY', 'PREDIKT'],
      },
    };
    
    const tookMs = Date.now() - startTime;
    
    trackServer('feed_viewed', {
      filter,
      sort,
      page,
      limit,
      resultsCount: feedInsights.length,
      tookMs,
    });
    
    return NextResponse.json(response, {
      headers: {
        'X-Processing-Time': `${tookMs}ms`,
        'Cache-Control': 'public, max-age=60', // 1 minute cache
      }
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
        message: 'Unable to load feed at this time'
      },
      { 
        status: 500,
        headers: {
          'X-Processing-Time': `${tookMs}ms`,
        }
      }
    );
  }
}