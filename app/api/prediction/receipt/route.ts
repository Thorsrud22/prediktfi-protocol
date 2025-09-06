import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { validateSession } from '../../../../lib/auth';
import { generatePredictionReceipt, ReceiptOptions } from '../../../../lib/svg-receipt';

const prisma = new PrismaClient();

// Input validation schema
const ReceiptRequestSchema = z.object({
  predictionId: z.string().uuid(),
  theme: z.enum(['light', 'dark']).default('light'),
  width: z.number().min(300).max(800).default(400),
  height: z.number().min(400).max(1200).default(600),
  showHash: z.boolean().default(true),
  showCommitment: z.boolean().default(true),
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
    const validatedData = ReceiptRequestSchema.parse(body);

    // Get prediction and verify ownership
    const prediction = await prisma.prediction.findUnique({
      where: { id: validatedData.predictionId },
      include: {
        user: {
          select: {
            name: true,
            walletAddress: true,
          },
        },
      },
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

    // Prepare receipt data
    const receiptData = {
      id: prediction.id,
      statement: prediction.statement,
      probability: prediction.probability,
      deadline: prediction.deadline,
      topic: prediction.topic,
      hash: prediction.hash,
      isCommitted: prediction.isCommitted,
      createdAt: prediction.createdAt,
      userName: prediction.user.name || undefined,
      userAddress: prediction.user.walletAddress || undefined,
    };

    // Generate receipt options
    const receiptOptions: ReceiptOptions = {
      width: validatedData.width,
      height: validatedData.height,
      theme: validatedData.theme,
      showHash: validatedData.showHash,
      showCommitment: validatedData.showCommitment,
    };

    // Generate SVG receipt
    const svg = generatePredictionReceipt(receiptData, receiptOptions);

    // Return SVG content
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Receipt generation error:', error);

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
    const theme = searchParams.get('theme') || 'light';
    const width = parseInt(searchParams.get('width') || '400');
    const height = parseInt(searchParams.get('height') || '600');
    const showHash = searchParams.get('showHash') !== 'false';
    const showCommitment = searchParams.get('showCommitment') !== 'false';

    if (!predictionId) {
      return NextResponse.json(
        { error: 'Prediction ID is required' },
        { status: 400 }
      );
    }

    // Validate parameters
    try {
      ReceiptRequestSchema.parse({
        predictionId,
        theme,
        width,
        height,
        showHash,
        showCommitment,
      });
    } catch (validationError) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    // Get prediction and verify ownership
    const prediction = await prisma.prediction.findUnique({
      where: { id: predictionId },
      include: {
        user: {
          select: {
            name: true,
            walletAddress: true,
          },
        },
      },
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

    // Prepare receipt data
    const receiptData = {
      id: prediction.id,
      statement: prediction.statement,
      probability: prediction.probability,
      deadline: prediction.deadline,
      topic: prediction.topic,
      hash: prediction.hash,
      isCommitted: prediction.isCommitted,
      createdAt: prediction.createdAt,
      userName: prediction.user.name || undefined,
      userAddress: prediction.user.walletAddress || undefined,
    };

    // Generate receipt options
    const receiptOptions: ReceiptOptions = {
      width,
      height,
      theme: theme as 'light' | 'dark',
      showHash,
      showCommitment,
    };

    // Generate SVG receipt
    const svg = generatePredictionReceipt(receiptData, receiptOptions);

    // Return SVG content
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Receipt generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
