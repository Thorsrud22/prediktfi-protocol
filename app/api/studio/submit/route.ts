import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  selectResolver,
  verifiabilityScore,
  confidenceToProbability,
  canonicalize,
} from '@/app/lib/resolvers';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const { templateId, predictionText, confidence, timeHorizon, stakeAmount } = body;

    if (!templateId || !predictionText || !confidence || !timeHorizon || !stakeAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate expiration date based on time horizon
    const deadline = calculateExpirationDate(timeHorizon);

    // Canonicalize prediction text
    const canonical = canonicalize(predictionText.trim());

    // Select resolver automatically
    const resolver = selectResolver(canonical);

    // Calculate initial probability from confidence
    const probability = confidenceToProbability(confidence);

    // Calculate verifiability score
    const vScore = verifiabilityScore(resolver.kind, {
      kind: resolver.kind,
      deadline,
      evidenceCount: resolver.resolverRef ? 1 : 0,
    });

    // Create insight in database
    const insight = await prisma.insight.create({
      data: {
        question: canonical,
        category: getCategoryFromTemplate(templateId),
        horizon: deadline,
        probability: probability,
        confidence: parseFloat(stakeAmount), // Store stake as confidence for now
        intervalLower: Math.max(0, probability - 0.1),
        intervalUpper: Math.min(1, probability + 0.1),
        rationale: `Auto-generated from Studio. Resolver: ${
          resolver.kind
        }. Reasons: ${resolver.reasons.join(', ')}`,
        scenarios: JSON.stringify({ verifiabilityScore: vScore }),
        metrics: JSON.stringify({
          timeHorizon,
          confidence,
          stakeAmount: parseFloat(stakeAmount),
          templateId,
        }),
        sources: resolver.resolverRef || '',
        dataQuality: vScore,
        // Proof fields
        canonical,
        p: probability,
        deadline,
        resolverKind: resolver.kind,
        resolverRef: resolver.resolverRef,
        status: 'OPEN',
      },
    });

    console.log('📝 New insight created:', {
      id: insight.id,
      canonical: insight.canonical,
      resolverKind: insight.resolverKind,
      deadline: insight.deadline,
      verifiabilityScore: vScore,
    });

    // Return success response with redirect to insight page
    return NextResponse.json({
      success: true,
      insight: {
        id: insight.id,
        canonical: insight.canonical,
        resolverKind: insight.resolverKind,
        resolverRef: insight.resolverRef,
        deadline: insight.deadline,
        verifiabilityScore: vScore,
        status: insight.status,
      },
      redirectTo: `/i/${insight.id}`,
    });
  } catch (error) {
    console.error('Insight creation failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create insight',
        message: 'Something went wrong. Please try again.',
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
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
