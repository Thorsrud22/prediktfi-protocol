import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

/**
 * Get predictions for the authenticated user
 * For now, returns all predictions - in production, filter by authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication when ready
    // For MVP, we'll return all predictions or filter by wallet address from headers

    const walletAddress = request.headers.get('x-wallet-address');

    let whereClause: any = {};

    if (walletAddress) {
      // If wallet address provided, try to find creator by wallet
      const creator = await prisma.creator.findFirst({
        where: {
          OR: [
            { handle: walletAddress },
            { wallet: walletAddress },
          ],
        },
        select: { id: true },
      });

      if (creator) {
        whereClause.creatorId = creator.id;
      } else {
        // No creator found for this wallet
        return NextResponse.json({
          predictions: [],
          total: 0,
        });
      }
    }

    // Fetch predictions (insights) 
    const predictions = await prisma.insight.findMany({
      where: whereClause,
      select: {
        id: true,
        canonical: true,
        p: true,
        deadline: true,
        status: true,
        createdAt: true,
        outcomes: {
          select: {
            result: true,
            evidenceUrl: true,
            decidedBy: true,
            decidedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Get the latest outcome
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to 100 most recent
    });

    // Convert Decimal to number for JSON serialization
    const formattedPredictions = predictions.map((pred) => ({
      ...pred,
      p: typeof pred.p === 'number' ? pred.p : pred.p?.toNumber() || 0,
      deadline: pred.deadline?.toISOString() || new Date().toISOString(),
      createdAt: pred.createdAt?.toISOString() || new Date().toISOString(),
      outcome: pred.outcomes && pred.outcomes.length > 0
        ? {
            ...pred.outcomes[0],
            decidedAt: pred.outcomes[0].decidedAt?.toISOString() || new Date().toISOString(),
          }
        : null,
      outcomes: undefined, // Remove outcomes array from response
    }));

    return NextResponse.json({
      predictions: formattedPredictions,
      total: formattedPredictions.length,
    });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}
