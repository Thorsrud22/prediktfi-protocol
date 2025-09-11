import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: creatorId } = await params;

    // Mock data for testing
    const mockData = {
      creatorIdHashed: creatorId,
      scores: {
        '30d': {
          score: 0.75,
          accuracy: 0.7,
          consistency: 0.9,
          volumeScore: 0.8,
          recencyScore: 0.7,
          maturedN: 45,
          isProvisional: true,
          rawValues: {
            brierMean: 0.3,
            retStd30d: 0.1,
            notional30d: 25000
          }
        },
        '90d': {
          score: 0.80,
          accuracy: 0.75,
          consistency: 0.92,
          volumeScore: 0.85,
          recencyScore: 0.75,
          maturedN: 120,
          isProvisional: false,
          rawValues: {
            brierMean: 0.25,
            retStd30d: 0.08,
            notional30d: 75000
          }
        }
      },
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(mockData, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300'
      }
    });

  } catch (error) {
    console.error('Creator score API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
