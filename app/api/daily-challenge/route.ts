import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

/**
 * GET /api/daily-challenge
 * 
 * Fetches today's featured Daily Challenge prediction.
 * Returns the challenge details, participant count, and crowd consensus.
 */
export async function GET(request: NextRequest) {
  try {
    // Get today's date at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Find today's featured challenge
    const challenge = await prisma.insight.findFirst({
      where: {
        featuredDate: today,
        status: 'OPEN', // Only show active challenges
      },
      include: {
        creator: {
          select: {
            id: true,
            handle: true,
            score: true,
            accuracy: true,
          },
        },
        outcomes: true,
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { 
          error: 'No challenge available',
          message: 'No Daily Challenge has been set for today. Check back tomorrow!'
        },
        { status: 404 }
      );
    }

    // Calculate time remaining (challenge ends at midnight UTC)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const timeRemaining = tomorrow.getTime() - Date.now();
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

    // Get participant count and crowd consensus
    // Note: We'll need to track user predictions separately
    // For now, we'll use the insight's confidence as a placeholder
    const participantCount = 0; // Will be implemented when we add user predictions
    const crowdConsensus = challenge.probability * 100; // Convert to percentage

    return NextResponse.json({
      challenge: {
        id: challenge.id,
        title: challenge.question,
        category: challenge.category,
        deadline: challenge.horizon,
        description: challenge.rationale,
        createdBy: challenge.creator,
        createdAt: challenge.createdAt,
      },
      participantCount,
      crowdConsensus: Math.round(crowdConsensus),
      timeRemaining: {
        hours: hoursRemaining,
        minutes: minutesRemaining,
        total: timeRemaining,
      },
      userHasPredicted: false, // Will be implemented when we track user predictions
    });

  } catch (error) {
    console.error('Daily Challenge API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Unable to fetch Daily Challenge at this time'
      },
      { status: 500 }
    );
  }
}
