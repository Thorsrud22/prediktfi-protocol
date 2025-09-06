import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { validateSession } from '../../../../lib/auth';
import { createMemoInstruction, createPrediktMemoPayload } from '../../../../lib/memo';
import { isFeatureEnabled } from '../../../../lib/flags';

const prisma = new PrismaClient();

// Input validation schema
const CommitPredictionSchema = z.object({
  predictionId: z.string().uuid(),
  walletPublicKey: z.string().min(32),
  transactionSignature: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check if commit feature is enabled
    if (!isFeatureEnabled('COMMIT_ENABLED')) {
      return NextResponse.json(
        { error: 'Commitment feature is currently disabled' },
        { status: 503 }
      );
    }

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
    const validatedData = CommitPredictionSchema.parse(body);

    // Get prediction and verify ownership
    const prediction = await prisma.prediction.findUnique({
      where: { id: validatedData.predictionId },
    });

    if (!prediction) {
      return NextResponse.json(
        { error: 'Prediction not found' },
        { status: 404 }
      );
    }

    if (prediction.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to prediction' },
        { status: 403 }
      );
    }

    if (prediction.isCommitted) {
      return NextResponse.json(
        { error: 'Prediction is already committed' },
        { status: 409 }
      );
    }

    if (prediction.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft predictions can be committed' },
        { status: 400 }
      );
    }

    // Create memo payload for on-chain commitment
    const memoPayload = createPrediktMemoPayload(
      prediction.id,
      prediction.hash,
      prediction.deadline,
      validatedData.walletPublicKey
    );

    // If transaction signature provided, record the commitment
    if (validatedData.transactionSignature) {
      // Update prediction as committed
      const updatedPrediction = await prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          status: 'ACTIVE',
          isCommitted: true,
          commitTxSignature: validatedData.transactionSignature,
          commitPublicKey: validatedData.walletPublicKey,
          committedAt: new Date(),
        },
      });

      return NextResponse.json({
        id: updatedPrediction.id,
        status: 'committed',
        transactionSignature: validatedData.transactionSignature,
        message: 'Prediction successfully committed to blockchain',
      });
    }

    // Return memo data for client to create transaction
    const memoData = JSON.stringify(memoPayload);

    return NextResponse.json({
      id: prediction.id,
      status: 'ready_to_commit',
      memoData,
      payload: memoPayload,
      message: 'Memo data created. Please create transaction with this data.',
    });

  } catch (error) {
    console.error('Prediction commitment error:', error);

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
    const predictionId = searchParams.get('predictionId');

    if (!predictionId) {
      return NextResponse.json(
        { error: 'Prediction ID is required' },
        { status: 400 }
      );
    }

    // Get prediction with commitment details
    const prediction = await prisma.prediction.findUnique({
      where: { id: predictionId },
    });

    if (!prediction) {
      return NextResponse.json(
        { error: 'Prediction not found' },
        { status: 404 }
      );
    }

    if (prediction.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to prediction' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: prediction.id,
      isCommitted: prediction.isCommitted,
      commitTxSignature: prediction.commitTxSignature,
      commitPublicKey: prediction.commitPublicKey,
      committedAt: prediction.committedAt,
      status: prediction.status,
    });

  } catch (error) {
    console.error('Commitment status fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
