import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const limit = parseInt(searchParams.get('limit') || '5');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Mock data for testing
    const mockData = [
      {
        creatorIdHashed: 'a1b2c3d4e5f6g7h8',
        score: 0.85,
        accuracy: 0.8,
        consistency: 0.95,
        volumeScore: 1.0,
        recencyScore: 0.8,
        maturedN: 60,
        topBadge: period === '7d' ? 'top1' : undefined,
        trend: 'up' as const,
        isProvisional: false
      },
      {
        creatorIdHashed: 'b2c3d4e5f6g7h8i9',
        score: 0.75,
        accuracy: 0.7,
        consistency: 0.9,
        volumeScore: 0.8,
        recencyScore: 0.7,
        maturedN: 45,
        topBadge: period === '7d' ? 'top2' : undefined,
        trend: 'down' as const,
        isProvisional: true
      },
      {
        creatorIdHashed: 'c3d4e5f6g7h8i9j0',
        score: 0.65,
        accuracy: 0.6,
        consistency: 0.8,
        volumeScore: 0.6,
        recencyScore: 0.6,
        maturedN: 25,
        topBadge: period === '7d' ? 'top3' : undefined,
        trend: 'flat' as const,
        isProvisional: true
      }
    ];

    const paginatedItems = mockData.slice(offset, offset + limit);
    const hasMore = offset + limit < mockData.length;

    const response = {
      etag: `"${Date.now()}"`,
      generatedAt: new Date().toISOString(),
      period,
      items: paginatedItems,
      meta: {
        total: mockData.length,
        limit,
        offset,
        hasMore
      }
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300',
        'ETag': response.etag
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
