import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { normalizePrediction } from '../../../lib/normalize';
import { validateSession } from '../../../lib/auth';

const prisma = new PrismaClient();

// Input validation schema
const CreatePredictionSchema = z.object({
  rawText: z.string().min(10).max(500),
  commitToChain: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session = await validateSession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreatePredictionSchema.parse(body);

    // Normalize the prediction text
    const normalized = normalizePrediction(validatedData.rawText);

    // Check for duplicate predictions by hash
    const existingPrediction = await prisma.prediction.findUnique({
      where: { hash: normalized.hash }
    });

    if (existingPrediction) {
      return NextResponse.json(
        { error: 'A prediction with this content already exists' },
        { status: 409 }
      );
    }

    // Create prediction in database
    const prediction = await prisma.prediction.create({
      data: {
        userId: session.userId,
        rawText: validatedData.rawText,
        statement: normalized.statement,
        probability: normalized.probability,
        deadline: normalized.deadline,
        resolverKind: normalized.resolver.kind,
        resolverRef: normalized.resolver.ref,
        topic: normalized.topic,
        hash: normalized.hash,
        status: 'DRAFT',
        isCommitted: false,
      },
    });

    // Return the created prediction
    return NextResponse.json({
      id: prediction.id,
      statement: prediction.statement,
      probability: prediction.probability,
      deadline: prediction.deadline,
      topic: prediction.topic,
      hash: prediction.hash,
      status: prediction.status,
      isCommitted: prediction.isCommitted,
      readyToCommit: validatedData.commitToChain,
    });

  } catch (error) {
    console.error('Prediction creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const session = await validateSession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const status = searchParams.get('status');
    const topic = searchParams.get('topic');

    // Build where clause
    const where: any = { userId: session.userId };
    if (status) where.status = status;
    if (topic) where.topic = topic;

    // Get predictions with pagination
    const [predictions, total] = await Promise.all([
      prisma.prediction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          outcomes: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.prediction.count({ where }),
    ]);

    return NextResponse.json({
      predictions: predictions.map((p: any) => ({
        id: p.id,
        statement: p.statement,
        probability: p.probability,
        deadline: p.deadline,
        topic: p.topic,
        status: p.status,
        isCommitted: p.isCommitted,
        createdAt: p.createdAt,
        latestOutcome: p.outcomes[0] || null,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Prediction fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
