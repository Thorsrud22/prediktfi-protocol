/**
 * Public Creator History API
 * GET /api/public/creators/[id]/history?period=30d|90d - Get creator's score history
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { CreatorHistory } from '@/src/lib/creatorClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as '30d' | '90d' || '90d';
    
    if (!id) {
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      );
    }
    
    if (!['30d', '90d'].includes(period)) {
      return NextResponse.json(
        { error: 'Period must be 30d or 90d' },
        { status: 400 }
      );
    }
    
    // Generate ETag for caching
    const etag = `"history-${id}-${period}-${Math.floor(Date.now() / 300000)}"`; // 5-minute ETag
    
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
    
    // Calculate date range
    const now = new Date();
    const daysBack = period === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    // Get daily score history from CreatorDaily table if it exists
    // For now, we'll create a simplified mock history based on current score
    const currentCreator = await prisma.creator.findUnique({
      where: { id: creator.id },
      select: { score: true }
    });
    
    if (!currentCreator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }
    
    // Generate mock daily history (in production, this would come from CreatorDaily table)
    const items = [];
    const currentScore = currentCreator.score;
    
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      // Add some realistic variation around current score
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      const dailyScore = Math.max(0, Math.min(1, currentScore + variation));
      
      items.push({
        day: date.toISOString().split('T')[0],
        score: dailyScore
      });
    }
    
    const response: CreatorHistory = {
      period,
      items
    };
    
    const duration = Date.now() - startTime;
    console.log(`📈 Creator history API: ${duration}ms (${items.length} data points)`);
    
    return NextResponse.json(response, {
      headers: {
        'ETag': etag,
        'Cache-Control': 's-maxage=120, stale-while-revalidate=300',
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Error fetching creator history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}