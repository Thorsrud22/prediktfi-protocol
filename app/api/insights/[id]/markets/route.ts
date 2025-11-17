import { NextResponse, type NextRequest } from 'next/server';
import { MarketMatchScore, ExternalMarket } from '../../../../lib/markets/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Mock external markets that match the expected types
    const mockExternalMarkets: ExternalMarket[] = [
      {
        platform: 'KALSHI',
        marketId: 'eth-5k-q1-2025',
        question: 'Will Ethereum price exceed $5,000 in Q1 2025?',
        yesPrice: 0.45,
        noPrice: 0.55,
        volume: 750000,
        liquidity: 42000,
        endDate: '2025-03-31T23:59:59Z',
        active: true,
        url: 'https://kalshi.com/market/eth-5k-q1-2025',
        lastUpdated: new Date().toISOString()
      },
      {
        platform: 'KALSHI',
        marketId: 'btc-hold-rate-2024',
        question: 'Will the Fed hold rates through Q4?',
        yesPrice: 0.56,
        noPrice: 0.44,
        volume: 310000,
        liquidity: 18000,
        endDate: '2024-12-31T23:59:59Z',
        active: true,
        url: 'https://kalshi.com',
        lastUpdated: new Date().toISOString()
      }
    ];

    // Mock suggested markets with match scores
    const suggestedMarkets: MarketMatchScore[] = mockExternalMarkets.map((market, index) => ({
      market,
      similarity: 0.8 - (index * 0.1), // Decreasing similarity scores
      reasons: [
        'Similar question topic',
        'Matching time frame',
        'High trading volume',
        'Active community'
      ].slice(0, 3 - index)
    }));

    // Mock connected markets (empty for demo)
    const connectedMarkets: ExternalMarket[] = [];

    console.log(`📊 Markets data requested for insight: ${id}`);

    // Return the structure expected by MarketIntegration component
    return NextResponse.json({
      suggestedMarkets,
      connectedMarkets,
      tradingEnabled: true
    });
  } catch (error) {
    console.error(`❌ Error fetching markets for insight ${id}:`, error);
    return NextResponse.json(
      {
        suggestedMarkets: [],
        connectedMarkets: [],
        tradingEnabled: false
      },
      { status: 500 }
    );
  }
}
