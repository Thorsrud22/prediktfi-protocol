import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Simulate AI analysis (in production, this would call an actual AI service)
    // For now, we'll generate a reasonable probability based on keywords
    const analysis = generateMockAnalysis(question);

    return NextResponse.json(analysis, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error generating analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}

function generateMockAnalysis(question: string): {
  probability: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  factors: string[];
  dataPoints: number;
} {
  const lowerQuestion = question.toLowerCase();

  // Determine probability based on question content
  let probability = 50;
  const factors: string[] = [];

  // Bitcoin related
  if (lowerQuestion.includes('bitcoin') || lowerQuestion.includes('btc')) {
    if (lowerQuestion.includes('100')) {
      probability = 65;
      factors.push('Historical bull run patterns', 'Institutional adoption', 'Halving cycle');
    } else if (lowerQuestion.includes('50')) {
      probability = 85;
      factors.push('Market momentum', 'Support levels', 'Trading volume');
    }
  }

  // Ethereum related
  if (lowerQuestion.includes('ethereum') || lowerQuestion.includes('eth')) {
    if (lowerQuestion.includes('5000') || lowerQuestion.includes('5k')) {
      probability = 58;
      factors.push('ETH 2.0 upgrades', 'DeFi growth', 'Layer 2 adoption');
    }
  }

  // Stock market
  if (lowerQuestion.includes('tesla') || lowerQuestion.includes('stock')) {
    probability = 62;
    factors.push('Market sentiment', 'Earnings reports', 'Sector performance');
  }

  // AI/Tech
  if (lowerQuestion.includes('ai') || lowerQuestion.includes('artificial intelligence')) {
    probability = 72;
    factors.push('Research velocity', 'Investment trends', 'Breakthrough timeline');
  }

  // Weather
  if (lowerQuestion.includes('weather') || lowerQuestion.includes('temperature')) {
    probability = 55;
    factors.push('Historical patterns', 'Climate models', 'Seasonal trends');
  }

  // Sports
  if (lowerQuestion.includes('nfl') || lowerQuestion.includes('nba') || lowerQuestion.includes('sports')) {
    probability = 68;
    factors.push('Team performance', 'Player statistics', 'Historical data');
  }

  // Add default factors if none were added
  if (factors.length === 0) {
    factors.push('Market trends', 'Historical data', 'Expert analysis', 'Current indicators');
  }

  // Determine confidence based on probability
  let confidence: 'high' | 'medium' | 'low';
  if (probability >= 70 || probability <= 30) {
    confidence = 'high';
  } else if (probability >= 55 || probability <= 45) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // Generate reasoning
  const reasoning = generateReasoning(question, probability, factors);

  return {
    probability,
    confidence,
    reasoning,
    factors,
    dataPoints: Math.floor(Math.random() * 5000) + 1000, // Random number between 1000-6000
  };
}

function generateReasoning(question: string, probability: number, factors: string[]): string {
  const sentiment = probability > 50 ? 'positive' : probability < 50 ? 'negative' : 'neutral';

  const reasoningTemplates = {
    high_positive: `Based on comprehensive analysis of ${factors.length} key factors, there is strong evidence supporting this prediction. The data shows ${sentiment} indicators across multiple dimensions, with historical patterns aligning favorably with the predicted outcome.`,
    medium_positive: `Analysis of available data suggests a moderately ${sentiment} outlook. While several factors support this prediction, there are some variables that introduce uncertainty. The overall trend leans toward the predicted outcome.`,
    low_positive: `The available data presents a mixed picture with roughly equal weight on both sides. Current indicators are ${sentiment} but with significant uncertainty. This prediction could go either way depending on how key variables evolve.`,
  };

  if (probability >= 70 || probability <= 30) {
    return reasoningTemplates.high_positive;
  } else if (probability >= 55 || probability <= 45) {
    return reasoningTemplates.medium_positive;
  } else {
    return reasoningTemplates.low_positive;
  }
}
