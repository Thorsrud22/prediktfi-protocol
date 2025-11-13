import { NextRequest, NextResponse } from 'next/server';
import { rateLimitOrThrow } from '@/lib/rate';
import {
  PredictionReflectionInput,
} from '@/lib/ai/prediction-analyzer';
import { getReflectionWithCache } from '@/lib/cache/reflection-cache';

interface ValidationResult {
  ok: boolean;
  error?: string;
  input?: PredictionReflectionInput;
}

function normalizeProbability(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const parsed = typeof value === 'string' ? Number(value) : value;
  if (typeof parsed !== 'number' || Number.isNaN(parsed)) {
    throw new Error(`Field "${field}" must be a number`);
  }
  if (parsed < 0) {
    throw new Error(`Field "${field}" must be zero or positive`);
  }

  const normalized = parsed > 1 ? parsed / 100 : parsed;
  if (normalized > 1) {
    throw new Error(`Field "${field}" must be 0-1 or 0-100`);
  }

  return normalized;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateReflectInput(body: any): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  try {
    const {
      insightId,
      question,
      predictedOutcome,
      actualOutcome,
      predictedProbability,
      actualProbability,
      resolutionDate,
      timeframe,
      category,
      notes,
    } = body;

    if (!isNonEmptyString(question)) {
      return { ok: false, error: 'Field "question" is required' };
    }

    if (!isNonEmptyString(predictedOutcome)) {
      return { ok: false, error: 'Field "predictedOutcome" is required' };
    }

    if (!isNonEmptyString(actualOutcome)) {
      return { ok: false, error: 'Field "actualOutcome" is required' };
    }

    const sanitized: PredictionReflectionInput = {
      insightId: typeof insightId === 'string' && insightId.trim().length > 0 ? insightId.trim() : undefined,
      question: question.trim().slice(0, 400),
      predictedOutcome: predictedOutcome.trim().slice(0, 400),
      actualOutcome: actualOutcome.trim().slice(0, 120),
      timeframe: typeof timeframe === 'string' ? timeframe.trim().slice(0, 60) : undefined,
      category: typeof category === 'string' ? category.trim().slice(0, 60) : undefined,
      notes: typeof notes === 'string' ? notes.trim().slice(0, 1000) : undefined,
    };

    if (predictedProbability !== undefined) {
      sanitized.predictedProbability = normalizeProbability(predictedProbability, 'predictedProbability');
    }

    if (actualProbability !== undefined) {
      sanitized.actualProbability = normalizeProbability(actualProbability, 'actualProbability');
    }

    if (resolutionDate !== undefined) {
      if (typeof resolutionDate !== 'string') {
        return { ok: false, error: 'Field "resolutionDate" must be an ISO string' };
      }
      const parsedDate = new Date(resolutionDate);
      if (Number.isNaN(parsedDate.getTime())) {
        return { ok: false, error: 'Field "resolutionDate" must be a valid date string' };
      }
      sanitized.resolutionDate = parsedDate.toISOString();
    }

    return { ok: true, input: sanitized };
  } catch (error) {
    if (error instanceof Error) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: 'Invalid payload' };
  }
}

export async function POST(request: NextRequest) {
  try {
    try {
      rateLimitOrThrow(request);
    } catch (error) {
      if (error instanceof NextResponse || error instanceof Response) {
        return error;
      }
      throw error;
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const validation = validateReflectInput(body);
    if (!validation.ok || !validation.input) {
      return NextResponse.json({ error: validation.error || 'Invalid payload' }, { status: 400 });
    }

    const reflection = await getReflectionWithCache(validation.input, {
      tag: validation.input.insightId,
    });

    return NextResponse.json({ reflection });
  } catch (error) {
    if (error instanceof NextResponse || error instanceof Response) {
      return error;
    }

    console.error('AI reflection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
