import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

/**
 * Manual resolution endpoint for predictions
 * Allows creators to manually mark their predictions as resolved
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add proper authentication when ready
    // For MVP, accept wallet address in header or body
    const walletAddress = request.headers.get('x-wallet-address');
    
    const body = await request.json();
    const { insightId, result, evidenceUrl, evidenceNote, creatorWallet } = body;

    const effectiveWallet = walletAddress || creatorWallet;

    if (!effectiveWallet) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 401 }
      );
    }

    if (!insightId || !result) {
      return NextResponse.json(
        { error: 'Missing required fields: insightId and result' },
        { status: 400 }
      );
    }

    if (!['YES', 'NO', 'INVALID'].includes(result)) {
      return NextResponse.json(
        { error: 'Invalid result. Must be YES, NO, or INVALID' },
        { status: 400 }
      );
    }

    // Fetch the insight and verify ownership
    const insight = await prisma.insight.findUnique({
      where: { id: insightId },
      include: {
        creator: {
          select: {
            id: true,
            handle: true,
            wallet: true,
          },
        },
      },
    });

    if (!insight) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      );
    }

    // Check if wallet matches creator
    if (insight.creator?.wallet !== effectiveWallet && insight.creator?.handle !== effectiveWallet) {
      return NextResponse.json(
        { error: 'You can only resolve your own predictions' },
        { status: 403 }
      );
    }

    if (insight.status === 'RESOLVED') {
      return NextResponse.json(
        { error: 'Insight already resolved' },
        { status: 400 }
      );
    }

    // Create outcome and update insight status in a transaction
    await prisma.$transaction(async (tx) => {
      // Create outcome record
      await tx.outcome.create({
        data: {
          insightId: insight.id,
          result,
          evidenceUrl: evidenceUrl || undefined,
          decidedBy: 'USER',
          decidedAt: new Date(),
        },
      });

      // Update insight status
      await tx.insight.update({
        where: { id: insight.id },
        data: { status: 'RESOLVED' },
      });
    });

    // Update creator profile aggregates (accuracy score, etc.)
    if (insight.creatorId) {
      try {
        const { updateProfileAggregates } = await import('@/lib/score');
        await updateProfileAggregates(insight.creatorId);
      } catch (error) {
        console.error('Failed to update profile aggregates:', error);
        // Don't fail the resolution if profile update fails
      }
    }

    return NextResponse.json({
      success: true,
      result,
      message: 'Prediction resolved successfully',
    });
  } catch (error) {
    console.error('Error resolving insight:', error);
    return NextResponse.json(
      { error: 'Failed to resolve prediction' },
      { status: 500 }
    );
  }
}
