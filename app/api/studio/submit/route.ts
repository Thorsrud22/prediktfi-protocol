import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

interface PredictionSubmission {
  id: string;
  userId?: string;
  templateId: string;
  predictionText: string;
  confidence: 'high' | 'medium' | 'low';
  timeHorizon: string;
  stakeAmount: number;
  category: string;
  status: 'pending' | 'active' | 'resolved';
  potentialReward: number;
  createdAt: string;
  expiresAt: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const { templateId, predictionText, confidence, timeHorizon, stakeAmount } = body;

    if (!templateId || !predictionText || !confidence || !timeHorizon || !stakeAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate expiration date based on time horizon
    const expirationDate = calculateExpirationDate(timeHorizon);

    // Calculate potential reward based on stake and difficulty
    const potentialReward = calculatePotentialReward(stakeAmount, confidence, templateId);

    // Create prediction submission
    const prediction: PredictionSubmission = {
      id: uuidv4(),
      userId: body.userId || 'anonymous', // In production, get from auth
      templateId,
      predictionText: predictionText.trim(),
      confidence,
      timeHorizon,
      stakeAmount: parseFloat(stakeAmount),
      category: getCategoryFromTemplate(templateId),
      status: 'pending',
      potentialReward,
      createdAt: new Date().toISOString(),
      expiresAt: expirationDate.toISOString(),
    };

    // In production, save to database
    // For now, simulate database save
    console.log('📝 New prediction submitted:', {
      id: prediction.id,
      text: prediction.predictionText,
      confidence: prediction.confidence,
      stake: prediction.stakeAmount,
      reward: prediction.potentialReward,
    });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));

    // Return success response
    return NextResponse.json({
      success: true,
      prediction: {
        id: prediction.id,
        status: 'submitted',
        message: 'Prediction submitted successfully!',
        details: {
          predictionText: prediction.predictionText,
          confidence: prediction.confidence,
          timeHorizon: prediction.timeHorizon,
          stakeAmount: prediction.stakeAmount,
          potentialReward: prediction.potentialReward,
          expiresAt: prediction.expiresAt,
        },
      },
    });
  } catch (error) {
    console.error('Prediction submission failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit prediction',
        message: 'Something went wrong. Please try again.',
      },
      { status: 500 },
    );
  }
}

function calculateExpirationDate(timeHorizon: string): Date {
  const now = new Date();

  switch (timeHorizon) {
    case '1h':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case '1w':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case '1m':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case '3m':
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

function calculatePotentialReward(
  stakeAmount: number,
  confidence: string,
  templateId: string,
): number {
  // Base multiplier based on confidence level
  const confidenceMultiplier =
    {
      high: 1.8, // Lower risk, lower reward
      medium: 2.5, // Moderate risk/reward
      low: 4.0, // Higher risk, higher reward
    }[confidence] || 2.5;

  // Template difficulty multiplier
  const templateMultiplier = getTemplateDifficulty(templateId);

  // Calculate reward
  const baseReward = stakeAmount * confidenceMultiplier * templateMultiplier;

  // Add some randomness (±10%)
  const randomFactor = 0.9 + Math.random() * 0.2;

  return Math.round(baseReward * randomFactor * 100) / 100;
}

function getTemplateDifficulty(templateId: string): number {
  const difficulties: { [key: string]: number } = {
    '1': 1.2, // Bitcoin - medium difficulty
    '2': 1.5, // Tesla - harder
    '3': 2.0, // Sports - very hard
    '4': 0.8, // Weather - easier
    '5': 1.3, // Ethereum gas
    '6': 1.4, // Apple earnings
    '7': 2.2, // Champions League
    '8': 1.6, // AI chip demand
  };

  return difficulties[templateId] || 1.0;
}

function getCategoryFromTemplate(templateId: string): string {
  const categories: { [key: string]: string } = {
    '1': 'crypto',
    '2': 'stocks',
    '3': 'sports',
    '4': 'weather',
    '5': 'crypto',
    '6': 'stocks',
    '7': 'sports',
    '8': 'tech',
  };

  return categories[templateId] || 'general';
}
