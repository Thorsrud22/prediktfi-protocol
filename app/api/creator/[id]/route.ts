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
    
    // Get creator with insights
    const creator = await prisma.creator.findUnique({
      where: { id },
      include: {
        insights: {
          where: {
            status: 'RESOLVED'
          },
          include: {
            outcomes: {
              orderBy: { decidedAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });
    
    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }
    
    // Get 90 days of CreatorDaily data
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const dailyRecords = await prisma.creatorDaily.findMany({
      where: {
        creatorId: id,
        day: {
          gte: ninetyDaysAgo
        }
      },
      orderBy: {
        day: 'asc'
      }
    });
    
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
    const totalInsights = creator.insights.length;
    const resolvedInsights = creator.insights.filter(insight => 
      insight.outcomes.length > 0
    ).length;
    const pendingInsights = await prisma.insight.count({
      where: {
        creatorId: id,
        status: { in: ['OPEN', 'COMMITTED'] }
      }
    });
    
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
    
    // For 90d rank, use the latest daily record score
    const latestScore = latestRecord?.score || creator.score;
    const creators90d = await prisma.creatorDaily.findMany({
      where: {
        day: latestRecord?.day || new Date(),
        score: { gte: latestScore }
      },
      orderBy: { score: 'desc' }
    });
    const period90dRank = creators90d.length;
    
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
