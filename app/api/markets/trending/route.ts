/**
 * Trending Markets API
 * Returns a mix of high-volume external markets and popular insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { polymarketClient } from '../../../lib/markets/polymarket';
// import { kalshiClient } from '../../../lib/markets/kalshi';

export async function GET(request: NextRequest) {
  try {
    // Get search params
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '6');
    
    // Fetch trending insights from our database
    const now = new Date(); // Current date
    const trendingInsights = await prisma.insight.findMany({
      where: {
        status: 'COMMITTED',
        deadline: {
          gte: now // Only future predictions (comparing dates)
        }
      },
      orderBy: [
        { marketVolume: 'desc' }, // Prioritize by volume first
        { createdAt: 'desc' }
      ],
      take: 2, // Show only 2 PREDIKT markets to make room for Polymarket
      include: {
        creator: {
          select: {
            handle: true,
            score: true
          }
        }
      }
    });

    // Fetch external markets from Polymarket (will use mock data if no API key)
    const remainingLimit = Math.max(0, limit - trendingInsights.length);
    console.log('Fetching Polymarket markets, remaining limit:', remainingLimit);
    // Disabled for performance
    const polymarketResults = { markets: [] }; // await polymarketClient.searchMarkets('', remainingLimit);
    console.log('Polymarket results: 0 markets (disabled for performance)');

    const externalMarkets = polymarketResults.markets;
    
    // Combine and format the results
    const combinedMarkets = [
      ...trendingInsights.map(insight => ({
        id: insight.id,
        type: 'PREDIKT' as const,
        title: insight.question,
        probability: insight.probability,
        volume: insight.marketVolume || 0,
        deadline: insight.deadline,
        creator: insight.creator?.handle || 'Anonymous',
        creatorScore: insight.creator?.score || 0,
        status: insight.status,
        url: `/i/${insight.id}`
      })),
      ...externalMarkets.map(market => ({
        id: market.marketId,
        type: market.platform as 'POLYMARKET' | 'KALSHI',
        title: market.question,
        probability: market.yesPrice,
        volume: market.volume,
        deadline: new Date(market.endDate).getTime(),
        creator: market.platform.toLowerCase(),
        creatorScore: 0,
        status: market.active ? 'ACTIVE' : 'CLOSED',
        url: market.url
      }))
    ];

    // Sort by volume and creation date for PREDIKT markets
    combinedMarkets.sort((a, b) => {
      // First by volume (higher volume first)
      if (b.volume !== a.volume) return b.volume - a.volume;
      
      // Then by deadline (later deadline first)
      const deadlineA = typeof a.deadline === 'number' ? a.deadline : new Date(a.deadline).getTime();
      const deadlineB = typeof b.deadline === 'number' ? b.deadline : new Date(b.deadline).getTime();
      return deadlineB - deadlineA;
    });
    const topMarkets = combinedMarkets.slice(0, limit);

    return NextResponse.json({
      markets: topMarkets,
      totalCount: topMarkets.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Trending markets error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { error: 'Failed to fetch trending markets', details: error.message },
      { status: 500 }
    );
  }
}
