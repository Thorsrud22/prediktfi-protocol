/**
 * Profile API
 * GET /api/profile/[handle] - Get creator profile with stats and recent insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { validateCreatorHandle } from '../../../lib/url-validation';
import { calculateBrierMetrics, calculateCalibrationBins, type CalibrationBin } from '../../../../lib/score';

export interface ProfileResponse {
  creator: {
    id: string;
    handle: string;
    score: number;
    accuracy: number;
    joinedAt: string;
    lastActive: string;
  };
  stats: {
    totalInsights: number;
    resolvedInsights: number;
    pendingInsights: number;
    averageBrier: number;
    calibrationBins: CalibrationBin[];
    period90d: {
      totalInsights: number;
      resolvedInsights: number;
      averageBrier: number;
    };
  };
  recentInsights: Array<{
    id: string;
    question: string;
    probability: number;
    status: string;
    outcome?: 'YES' | 'NO' | 'INVALID';
    brierScore?: number;
    createdAt: string;
    resolvedAt?: string;
  }>;
  rank: {
    overall: number;
    period90d: number;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;

    if (!handle) {
      return NextResponse.json(
        { error: 'Handle is required' },
        { status: 400 }
      );
    }

    // Validate handle format
    const handleValidation = validateCreatorHandle(handle);
    if (!handleValidation.isValid) {
      return NextResponse.json(
        { error: handleValidation.error },
        { status: 400 }
      );
    }

    const decodedHandle = handleValidation.sanitized!;

    // Try to find creator by handle first, then by hashed id
    let creator = await prisma.creator.findUnique({
      where: { handle: decodedHandle },
      include: {
        insights: {
          include: {
            outcomes: {
              orderBy: { decidedAt: 'desc' },
              take: 1
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20 // Get last 20 insights for recent activity
        }
      }
    });

    // If not found by handle, try to find by hashed id
    if (!creator) {
      creator = await prisma.creator.findUnique({
        where: { id: decodedHandle },
        include: {
          insights: {
            include: {
              outcomes: {
                orderBy: { decidedAt: 'desc' },
                take: 1
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 20 // Get last 20 insights for recent activity
          }
        }
      });
    }

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Calculate stats
    const allInsights = creator.insights;
    const resolvedInsights = allInsights.filter(insight =>
      insight.status === 'RESOLVED' && insight.outcomes.length > 0
    );
    const pendingInsights = allInsights.filter(insight =>
      insight.status !== 'RESOLVED'
    );

    // Filter for 90-day period
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const recent90dInsights = allInsights.filter(insight =>
      insight.createdAt >= ninetyDaysAgo
    );
    const recent90dResolved = recent90dInsights.filter(insight =>
      insight.status === 'RESOLVED' && insight.outcomes.length > 0
    );

    // Prepare predictions for metric calculations
    const allPredictions = resolvedInsights
      .filter(insight => insight.p !== null)
      .map(insight => ({
        predicted: typeof insight.p === 'number' ? insight.p : insight.p!.toNumber(),
        actual: insight.outcomes[0].result as 'YES' | 'NO' | 'INVALID'
      }));

    const recent90dPredictions = recent90dResolved
      .filter(insight => insight.p !== null)
      .map(insight => ({
        predicted: typeof insight.p === 'number' ? insight.p : insight.p!.toNumber(),
        actual: insight.outcomes[0].result as 'YES' | 'NO' | 'INVALID'
      }));

    // Calculate metrics
    const allMetrics = calculateBrierMetrics(allPredictions);
    const recent90dMetrics = calculateBrierMetrics(recent90dPredictions);

    // Use stored calibration bins if available, otherwise calculate
    let calibrationBins = calculateCalibrationBins(allPredictions);
    if (creator.calibration) {
      try {
        const parsed = JSON.parse(creator.calibration);
        if (Array.isArray(parsed)) {
          calibrationBins = parsed;
        }
      } catch (error) {
        console.warn('Failed to parse stored calibration data:', error);
      }
    }

    // Prepare recent insights with Brier scores
    const recentInsights = allInsights.slice(0, 20).map(insight => {
      let brierScore: number | undefined;

      if (insight.status === 'RESOLVED' &&
        insight.outcomes.length > 0 &&
        insight.p !== null &&
        insight.outcomes[0].result !== 'INVALID') {

        const predicted = typeof insight.p === 'number' ? insight.p : insight.p!.toNumber();
        const actual = insight.outcomes[0].result === 'YES' ? 1 : 0;
        brierScore = Math.pow(predicted - actual, 2);
      }

      return {
        id: insight.id,
        question: insight.question,
        probability: typeof insight.probability === 'number' ? insight.probability : Number(insight.probability),
        status: insight.status,
        outcome: insight.outcomes.length > 0 ? insight.outcomes[0].result as 'YES' | 'NO' | 'INVALID' : undefined,
        brierScore,
        createdAt: insight.createdAt.toISOString(),
        resolvedAt: insight.outcomes.length > 0 ? insight.outcomes[0].decidedAt.toISOString() : undefined
      };
    });

    // Calculate ranks (simplified - in production you'd cache these)
    const allCreators = await prisma.creator.findMany({
      where: {
        insights: {
          some: {
            status: 'RESOLVED'
          }
        }
      },
      orderBy: { score: 'desc' }
    });

    const overallRank = allCreators.findIndex(c => c.id === creator.id) + 1;

    // For 90d rank, we'd need more complex query - simplified for now
    const period90dRank = overallRank; // TODO: Implement proper 90d ranking

    const response: ProfileResponse = {
      creator: {
        id: creator.id,
        handle: creator.handle,
        score: creator.score,
        accuracy: creator.accuracy,
        joinedAt: creator.createdAt.toISOString(),
        lastActive: creator.lastScoreUpdate?.toISOString() || creator.updatedAt.toISOString()
      },
      stats: {
        totalInsights: allInsights.length,
        resolvedInsights: resolvedInsights.length,
        pendingInsights: pendingInsights.length,
        averageBrier: allMetrics.score,
        calibrationBins,
        period90d: {
          totalInsights: recent90dInsights.length,
          resolvedInsights: recent90dResolved.length,
          averageBrier: recent90dMetrics.score
        }
      },
      recentInsights,
      rank: {
        overall: overallRank,
        period90d: period90dRank
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
