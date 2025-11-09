/**
 * Creator Profile API with 90d component graphs
 * GET /api/creator/[id] - Get creator profile with detailed score components
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isProvisional } from '../../../lib/creatorScore';

const prisma = new PrismaClient();

export interface CreatorProfileResponse {
  creator: {
    id: string;
    handle: string;
    score: number;
    accuracy: number;
    brierMean: number;
    insightsCount: number;
    createdAt: string;
    lastScoreUpdate: string;
    isProvisional: boolean;
  };
  stats: {
    totalInsights: number;
    resolvedInsights: number;
    pendingInsights: number;
    maturedInsights: number;
  };
  scoreComponents: {
    accuracy: number;
    consistency: number;
    volumeScore: number;
    recencyScore: number;
  };
  dailyData: Array<{
    date: string;
    score: number;
    accuracy: number;
    consistency: number;
    volumeScore: number;
    recencyScore: number;
    maturedN: number;
  }>;
  rank: {
    overall: number;
    period90d: number;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      );
    }
    
    console.time(`creatorProfile:fetchCreator:${id}`);
    const creator = await prisma.creator.findUnique({
      where: { id },
      select: {
        id: true,
        handle: true,
        score: true,
        accuracy: true,
        brierMean: true,
        insightsCount: true,
        createdAt: true,
        lastScoreUpdate: true,
        updatedAt: true,
        _count: {
          select: {
            insights: true
          }
        }
      }
    });
    console.timeEnd(`creatorProfile:fetchCreator:${id}`);
    
    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }
    
    // Get 90 days of CreatorDaily data
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    console.time(`creatorProfile:dailyRecords:${id}`);
    const [dailyRecords, resolvedInsights] = await Promise.all([
      prisma.creatorDaily.findMany({
        where: {
          creatorId: id,
          day: {
            gte: ninetyDaysAgo
          }
        },
        orderBy: {
          day: 'asc'
        }
      }),
      prisma.insight.count({
        where: {
          creatorId: id,
          status: 'RESOLVED'
        }
      })
    ]);
    console.timeEnd(`creatorProfile:dailyRecords:${id}`);
    
    // Calculate current score components from latest daily record
    const latestRecord = dailyRecords[dailyRecords.length - 1];
    const scoreComponents = latestRecord ? {
      accuracy: latestRecord.accuracy,
      consistency: latestRecord.consistency,
      volumeScore: latestRecord.volumeScore,
      recencyScore: latestRecord.recencyScore
    } : {
      accuracy: creator.accuracy,
      consistency: 0,
      volumeScore: 0,
      recencyScore: 0
    };
    
    // Calculate stats
    const totalInsights = creator._count.insights;

    const latestDay = latestRecord?.day;
    const latestScore = latestRecord?.score ?? creator.score;

    const pendingInsightsPromise = prisma.insight.count({
      where: {
        creatorId: id,
        status: { in: ['OPEN', 'COMMITTED'] }
      }
    });

    const overallRankCountPromise =
      resolvedInsights === 0
        ? Promise.resolve(0)
        : prisma.creator.count({
            where: {
              score: { gte: creator.score },
              insights: {
                some: {
                  status: 'RESOLVED'
                }
              }
            }
          });

    const period90dRankCountPromise =
      resolvedInsights === 0 || !latestDay
        ? Promise.resolve(0)
        : prisma.creatorDaily.count({
            where: {
              day: latestDay,
              score: { gte: latestScore }
            }
          });

    console.time(`creatorProfile:ranksAndPending:${id}`);
    const [pendingInsights, overallRankCount, period90dRankCount] = await Promise.all([
      pendingInsightsPromise,
      overallRankCountPromise,
      period90dRankCountPromise
    ]);
    console.timeEnd(`creatorProfile:ranksAndPending:${id}`);
    
    const maturedInsights = latestRecord?.maturedN || 0;
    const isProvisionalFlag = isProvisional(maturedInsights);
    
    // Prepare daily data for graphs
    const dailyData = dailyRecords.map(record => ({
      date: record.day.toISOString().split('T')[0],
      score: record.score,
      accuracy: record.accuracy,
      consistency: record.consistency,
      volumeScore: record.volumeScore,
      recencyScore: record.recencyScore,
      maturedN: record.maturedN
    }));
    
    // Calculate ranks
    const overallRank = overallRankCount;
    const period90dRank = latestDay ? period90dRankCount : overallRankCount;
    
    const response: CreatorProfileResponse = {
      creator: {
        id: creator.id,
        handle: creator.handle,
        score: creator.score,
        accuracy: creator.accuracy,
        brierMean: creator.brierMean || 0,
        insightsCount: creator.insightsCount,
        createdAt: creator.createdAt.toISOString(),
        lastScoreUpdate: creator.lastScoreUpdate?.toISOString() || creator.updatedAt.toISOString(),
        isProvisional: isProvisionalFlag
      },
      stats: {
        totalInsights,
        resolvedInsights,
        pendingInsights,
        maturedInsights
      },
      scoreComponents,
      dailyData,
      rank: {
        overall: overallRank,
        period90d: period90dRank
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Creator profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
