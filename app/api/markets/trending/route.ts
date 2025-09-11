/**
 * Trending Markets API
 * GET /api/markets/trending - Get trending prediction markets
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');
    
    // Return empty trending markets for now
    const trendingMarkets: any[] = [];
    
    return NextResponse.json({
      markets: trendingMarkets,
      meta: {
        limit,
        total: trendingMarkets.length,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Trending markets API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
