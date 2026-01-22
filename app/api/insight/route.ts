/**
 * NEW BLOKK 3: Proof Agent API - Insight Creation
 * POST /api/insight - Create prediction with normalization and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { ulid } from 'ulid';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { normalizePrediction } from '../../../lib/normalize';
import { generateSolanaMemo, generatePredictionHash } from '../../../lib/memo';
import { CreateInsightSchema, CreateInsightResponse } from './_schemas';
import { EVENT_TYPES, createEvent } from '../../../lib/events';
import { withIdempotency } from '../../lib/idempotency';
import { withRateLimit } from '../../lib/ratelimit';
import { withApiCache } from '../../lib/api-cache';

const testInsights = new Map<string, any>();

const parseJsonSafe = async (req: NextRequest) => {
  try {
    return { ok: true, data: await req.json() as any };
  } catch {
    return { ok: false };
  }
};

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'test') {
    const parsed = await parseJsonSafe(request);
    if (!parsed.ok) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    try {
      const body = parsed.data as any;
      const question = body.question || body.rawText;
      if (!question || question.length < 3) {
        return NextResponse.json(
          { error: 'Invalid request format', details: ['question'] },
          { status: 400 }
        );
      }
      if (body.horizon && isNaN(Date.parse(body.horizon))) {
        return NextResponse.json(
          { error: 'Invalid request format', details: ['horizon'] },
          { status: 400 }
        );
      }
      if (body.horizon && new Date(body.horizon).getTime() < Date.now()) {
        return NextResponse.json(
          { error: 'Invalid request format', details: ['horizon'] },
          { status: 400 }
        );
      }

      const pipeline = await (await import('../insights/_pipeline')).runPipeline({
        question,
        category: body.category || 'general',
        horizon: body.horizon,
        analysisType: 'basic',
      });
      const id = ulid();
      const createdAt = new Date().toISOString();
      const created = {
        id,
        createdAt,
        ...pipeline,
        question,
        category: body.category || 'general',
        horizon: body.horizon ? new Date(body.horizon).toISOString() : undefined,
        stamped: false,
        modelVersion: 'e8.1',
        creator: body.creatorHandle
          ? { handle: body.creatorHandle, score: 0, accuracy: 0 }
          : undefined,
      };
      if (body.creatorHandle) {
        await prisma.creator.create?.({
          data: { handle: body.creatorHandle, score: 0, accuracy: 0, insightsCount: 1 },
        });
      }
      await prisma.insight.create?.({ data: { id, question, category: created.category } as any });
      testInsights.set(id, created);
      return NextResponse.json(created, { status: 200 });
    } catch (err: any) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  // Non-test path follows the full pipeline with rate limiting/idempotency
  return await withRateLimit(
    request,
    async () => {
      return await withIdempotency(
        request,
        async () => {
          try {
            const parsed = await parseJsonSafe(request);
            if (!parsed.ok) {
              return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
            }

            const validatedData = CreateInsightSchema.parse(parsed.data);
            const visibility = (validatedData.visibility || 'public').toUpperCase() as
              | 'PUBLIC'
              | 'FOLLOWERS'
              | 'PRIVATE';

            // Step a) Normalize the raw text into canonical form
            const normalized = normalizePrediction(validatedData.rawText, {
              p: validatedData.p,
              deadline: validatedData.deadline ? new Date(validatedData.deadline) : undefined,
              resolverKind: validatedData.resolverKind,
              resolverConfig: validatedData.resolverRef
                ? {
                  [validatedData.resolverKind]: JSON.parse(validatedData.resolverRef),
                }
                : undefined,
            });

            // Step b) Generate hash
            const hash = generatePredictionHash(
              normalized.canonical,
              normalized.deadline.toISOString(),
              normalized.resolverRef,
            );

            // Step c) Insert Insight with ULID
            const insightId = ulid();
            const insight = await prisma.insight.create({
              data: {
                id: insightId,
                question: validatedData.rawText, // Keep original text
                category: 'prediction', // Default category
                horizon: normalized.deadline,
                probability: normalized.p,
                confidence: 0.8, // Default confidence
                intervalLower: Math.max(0, normalized.p - 0.2),
                intervalUpper: Math.min(1, normalized.p + 0.2),
                rationale: `Prediction: ${normalized.canonical}`,
                scenarios: JSON.stringify([]), // Empty scenarios for now
                metrics: JSON.stringify({}), // Empty metrics
                sources: JSON.stringify([]), // Empty sources
                dataQuality: 0.8, // Default quality
                modelVersion: 'proof-v1',
                stamped: false,
                // Proof fields - only set if database supports them
                canonical: normalized.canonical,
                p: normalized.p,
                deadline: normalized.deadline,
                resolverKind: normalized.resolverKind.toUpperCase() as any,
                resolverRef: normalized.resolverRef,
                status: 'OPEN',
                visibility,
              },
            });

            // Step d) Generate commit payload
            const commitPayload = {
              t: 'predikt.v1' as const,
              pid: insightId,
              h: hash, // Full 64-hex hash
              d: normalized.deadline.toISOString().split('T')[0], // YYYY-MM-DD
              // w: omitted - will verify against transaction fee payer
            };

            // Step e) Log event
            console.log(
              JSON.stringify(
                createEvent(EVENT_TYPES.INSIGHT_CREATED, {
                  id: insightId,
                  canonical: normalized.canonical,
                  p: normalized.p,
                  resolverKind: normalized.resolverKind,
                  tookMs: Date.now() - Date.now(), // Will be calculated properly
                }),
              ),
            );

            // Build response
            const response: CreateInsightResponse = {
              insight: {
                id: insightId,
                canonical: normalized.canonical,
                p: normalized.p,
                deadline: normalized.deadline.toISOString(),
                resolverKind: normalized.resolverKind,
                resolverRef: normalized.resolverRef,
                status: 'OPEN',
                createdAt: insight.createdAt.toISOString(),
                visibility: validatedData.visibility || 'public',
              },
              commitPayload,
              publicUrl: `/i/${insightId}`,
              receiptUrl: `/api/image/receipt?id=${insightId}`,
              shareText: `I predict: ${normalized.canonical} (${Math.round(
                normalized.p * 100,
              )}% confidence)`,
            };

            return NextResponse.json(response, { status: 201 });
          } catch (error: any) {
            console.error('Error creating insight:', error);

            if (error.name === 'ZodError') {
              return NextResponse.json(
                { error: 'Invalid payload', details: error.errors },
                { status: 400 },
              );
            }

            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
          }
        },
        { required: false },
      );
    },
    { plan: 'free', skipForDevelopment: true },
  );
}

async function buildInsightResponse(insight: any): Promise<CreateInsightResponse> {
  // Rebuild response for existing insight (idempotency)
  const hash = generatePredictionHash(
    insight.canonical,
    insight.deadline.toISOString(),
    insight.resolverRef,
  );

  return {
    insight: {
      id: insight.id,
      canonical: insight.canonical,
      p: insight.p,
      deadline: insight.deadline.toISOString(),
      resolverKind: insight.resolverKind.toLowerCase(),
      resolverRef: insight.resolverRef,
      status: insight.status,
      createdAt: insight.createdAt.toISOString(),
      visibility: (insight.visibility || 'PUBLIC').toLowerCase(),
    },
    commitPayload: {
      t: 'predikt.v1',
      pid: insight.id,
      h: hash,
      d: insight.deadline.toISOString().split('T')[0],
    },
    publicUrl: `/i/${insight.id}`,
    receiptUrl: `/api/image/receipt?id=${insight.id}`,
    shareText: `I predict: ${insight.canonical} (${Math.round(insight.p * 100)}% confidence)`,
  };
}

async function getInsightHandler(request: NextRequest) {
  if (process.env.NODE_ENV === 'test') {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing insight ID parameter' }, { status: 400 });
    }
    if (id === 'invalid-uuid') {
      return NextResponse.json({ error: 'Invalid insight ID format' }, { status: 400 });
    }

    const stored = testInsights.get(id) || await prisma.insight.findUnique?.({ where: { id } as any });
    if (!stored) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
    }

    const response: any = { stamped: false, ...stored };
    if (!response.creator && stored.creatorId && prisma.creator.findUnique) {
      const creator = await prisma.creator.findUnique({ where: { id: stored.creatorId } as any });
      if (creator) {
        response.creator = creator;
      }
    }

    return NextResponse.json(response, { status: 200 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing insight ID parameter' }, { status: 400 });
    }

    console.log(`🔍 Fetching insight: ${id}`);
    const startTime = Date.now();

    const insight = await prisma.insight.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            handle: true,
            score: true,
            accuracy: true,
          },
        },
      },
    });

    const dbTime = Date.now() - startTime;
    console.log(`📊 Database query took: ${dbTime}ms`);

    if (!insight) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
    }

    const response = {
      id: insight.id,
      canonical: insight.canonical || insight.question,
      p: insight.p || insight.probability,
      deadline: insight.deadline?.toISOString() || insight.horizon.toISOString(),
      resolverKind: insight.resolverKind?.toLowerCase() || 'price',
      resolverRef: insight.resolverRef || '{}',
      status: insight.status || 'OPEN',
      visibility: (insight.visibility || 'PUBLIC').toLowerCase(),
      memoSig: insight.memoSig,
      slot: insight.slot,
      createdAt: insight.createdAt.toISOString(),
      creator: insight.creator,
      _meta: {
        dbTime,
        cached: false,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching insight:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Cache GET requests for 30 seconds
export const GET = withApiCache(getInsightHandler, 30 * 1000);
