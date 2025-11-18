import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

/**
 * POST /api/daily-challenge/predict
 * 
 * Submit a prediction for today's Daily Challenge.
 * Body: { confidence: number (0-100) }
 */
export async function POST(request: NextRequest) {
  try {
    // Get wallet/user ID from headers or cookies
    const walletId = request.headers.get('x-wallet-id') || 
                    request.cookies.get('wallet_id')?.value;

    if (!walletId) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'You must be logged in to participate in Daily Challenges'
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { confidence } = body;

    // Validate confidence
    if (typeof confidence !== 'number' || confidence < 0 || confidence > 100) {
      return NextResponse.json(
        { 
          error: 'Invalid confidence',
          message: 'Confidence must be a number between 0 and 100'
        },
        { status: 400 }
      );
    }

    // Get today's date at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Find today's challenge
    const challenge = await prisma.insight.findFirst({
      where: {
        featuredDate: today,
        status: 'OPEN',
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { 
          error: 'No challenge available',
          message: 'No Daily Challenge is active right now'
        },
        { status: 404 }
      );
    }

    // Check if user already predicted on this challenge today
    // We'll use the Event model to track predictions
    const existingPrediction = await prisma.event.findFirst({
      where: {
        userId: walletId,
        type: 'DAILY_CHALLENGE_PREDICT',
        insightId: challenge.id,
        createdAt: {
          gte: today,
        },
      },
    });

    if (existingPrediction) {
      return NextResponse.json(
        { 
          error: 'Already predicted',
          message: 'You have already made a prediction for today\'s challenge. Come back tomorrow!',
          prediction: JSON.parse(existingPrediction.meta),
        },
        { status: 409 }
      );
    }

    // Create prediction event
    const prediction = await prisma.event.create({
      data: {
        userId: walletId,
        type: 'DAILY_CHALLENGE_PREDICT',
        insightId: challenge.id,
        meta: JSON.stringify({
          confidence,
          predictionDate: today.toISOString(),
          challengeTitle: challenge.question,
        }),
      },
    });

    // Get updated participant count
    const participantCount = await prisma.event.count({
      where: {
        type: 'DAILY_CHALLENGE_PREDICT',
        insightId: challenge.id,
        createdAt: {
          gte: today,
        },
      },
    });

    // Calculate crowd consensus
    const allPredictions = await prisma.event.findMany({
      where: {
        type: 'DAILY_CHALLENGE_PREDICT',
        insightId: challenge.id,
        createdAt: {
          gte: today,
        },
      },
      select: {
        meta: true,
      },
    });

    const totalConfidence = allPredictions.reduce((sum, pred) => {
      const meta = JSON.parse(pred.meta);
      return sum + meta.confidence;
    }, 0);

    const crowdConsensus = Math.round(totalConfidence / participantCount);

    return NextResponse.json({
      success: true,
      message: 'Prediction locked in! Come back tomorrow to see the results.',
      prediction: {
        confidence,
        timestamp: prediction.createdAt,
      },
      stats: {
        participantCount,
        crowdConsensus,
        yourDifference: confidence - crowdConsensus,
      },
    });

  } catch (error) {
    console.error('Daily Challenge predict API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Unable to submit prediction at this time'
      },
      { status: 500 }
    );
  }
}
