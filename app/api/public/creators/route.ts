/**
 * Public Creators List API
 * GET /api/public/creators - Get list of all creators for sitemap
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export interface CreatorListItem {
  id: string;
  handle: string;
  score: number;
  accuracy: number;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500);
    
    // Generate ETag for caching
    const etag = `"creators-list-${limit}-${Math.floor(Date.now() / 3600000)}"`; // 1-hour ETag
    
    // Check if client has cached version
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { 
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200'
        }
      });
    }
    
    // Fetch creators with basic info
    const creators = await prisma.creator.findMany({
      select: {
        id: true,
        handle: true,
        score: true,
        accuracy: true,
        createdAt: true
      },
      where: {
        // Only include creators with some activity
        insights: {
          some: {}
        }
      },
      orderBy: { score: 'desc' },
      take: limit
    });
    
    const response: CreatorListItem[] = creators.map(creator => ({
      id: creator.id,
      handle: creator.handle,
      score: creator.score,
      accuracy: creator.accuracy,
      createdAt: creator.createdAt.toISOString()
    }));
    
    const duration = Date.now() - startTime;
    console.log(`📋 Creators list API: ${duration}ms (${response.length} creators)`);
    
    return NextResponse.json(response, {
      headers: {
        'ETag': etag,
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200',
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Error fetching creators list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
