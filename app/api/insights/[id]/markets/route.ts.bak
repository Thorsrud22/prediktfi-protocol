/**
 * Market Integration API
 * GET /api/insights/[id]/markets - Find matching markets for an insight
 * POST /api/insights/[id]/markets - Connect insight to external markets
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { marketMatcher } from '../../../../lib/markets/matcher';
import { z } from 'zod';

const ConnectMarketsSchema = z.object({
  marketIds: z.array(z.string()).min(1).max(3), // Allow connecting up to 3 markets
  platform: z.enum(['POLYMARKET', 'KALSHI']),
});

/**
 * GET /api/insights/[id]/markets
 * Find matching external markets for an insight
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const insight = await prisma.insight.findUnique({
      where: { id },
    });

    if (!insight) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      );
    }

    // Find matching markets
    const matches = await marketMatcher.findMatchingMarkets(insight);

    // Parse existing connected markets
    const existingMarkets = insight.externalMarkets 
      ? JSON.parse(insight.externalMarkets) 
      : [];

    return NextResponse.json({
      insight: {
        id: insight.id,
        question: insight.question,
        probability: insight.probability,
        deadline: insight.deadline,
      },
      suggestedMarkets: matches,
      connectedMarkets: existingMarkets,
      tradingEnabled: insight.tradingEnabled,
    });

  } catch (error) {
    console.error('Market search error:', error);
    return NextResponse.json(
      { error: 'Failed to search markets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/insights/[id]/markets
 * Connect insight to external markets
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { marketIds, platform } = ConnectMarketsSchema.parse(body);

    const insight = await prisma.insight.findUnique({
      where: { id },
    });

    if (!insight) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      );
    }

    // TODO: Verify user has permission to connect markets to this insight
    // This would check if user is the creator or has admin rights

    // Fetch market details from external APIs
    const connectedMarkets = [];
    let totalVolume = 0;

    for (const marketId of marketIds) {
      // TODO: Fetch market details based on platform
      // For now, create placeholder market data
      const marketData = {
        platform,
        marketId,
        connectedAt: new Date().toISOString(),
        // TODO: Add actual market data from API
      };
      
      connectedMarkets.push(marketData);
      // totalVolume += marketData.volume || 0;
    }

    // Update insight with connected markets
    const updatedInsight = await prisma.insight.update({
      where: { id },
      data: {
        externalMarkets: JSON.stringify(connectedMarkets),
        tradingEnabled: true,
        marketVolume: totalVolume,
        lastMarketSync: new Date(),
      },
    });

    // Log market connection event
    await prisma.event.create({
      data: {
        kind: 'markets_connected',
        entityId: insight.id,
        entityType: 'insight',
        creatorId: insight.creatorId,
        props: JSON.stringify({
          platform,
          marketCount: marketIds.length,
          marketIds,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      insight: {
        id: updatedInsight.id,
        tradingEnabled: updatedInsight.tradingEnabled,
        marketVolume: updatedInsight.marketVolume,
      },
      connectedMarkets,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Market connection error:', error);
    return NextResponse.json(
      { error: 'Failed to connect markets' },
      { status: 500 }
    );
  }
}
