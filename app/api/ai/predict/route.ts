import { NextRequest, NextResponse } from 'next/server';
import { predict, PredictInput } from '../../../lib/ai/kernel';
import { mockAdapter } from '../../../lib/ai/adapters/mock';
import { baselineAdapter } from '../../../lib/ai/adapters/baseline';

// In-memory rate limiting store
interface RateLimit {
  count: number;
  resetTime: number;
  dailyCount: number;
  dailyResetTime: number;
}

const rateLimitStore = new Map<string, RateLimit>();
const RATE_LIMIT_WINDOW = 6 * 1000; // 6 seconds minimum between requests
const DAILY_LIMIT_MAX = 50; // 50 requests per day per IP

function getClientIP(request: NextRequest): string {
  // Try various headers for IP detection
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const remote = request.headers.get('x-remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (real) {
    return real;
  }
  if (remote) {
    return remote;
  }
  
  // Fallback to a generic identifier
  return 'unknown-ip';
}

function checkRateLimit(ip: string): { allowed: boolean; code?: string; message?: string } {
  const now = Date.now();
  const limit = rateLimitStore.get(ip) || {
    count: 0,
    resetTime: now + RATE_LIMIT_WINDOW,
    dailyCount: 0,
    dailyResetTime: getNextDayStart()
  };
  
  // Check daily limit reset
  if (now > limit.dailyResetTime) {
    limit.dailyCount = 0;
    limit.dailyResetTime = getNextDayStart();
  }
  
  // Check daily cap
  if (limit.dailyCount >= DAILY_LIMIT_MAX) {
    return {
      allowed: false,
      code: 'FREE_DAILY_LIMIT',
      message: 'Daily free cap reached. Visit /pricing to upgrade'
    };
  }
  
  // Check frequency limit (minimum 6 seconds between requests)
  if (now < limit.resetTime) {
    return {
      allowed: false,
      code: 'RATE_LIMIT', 
      message: 'Too many requests. Try again shortly.'
    };
  }
  
  // Update limits
  limit.count = 1;
  limit.resetTime = now + RATE_LIMIT_WINDOW;
  limit.dailyCount++;
  
  rateLimitStore.set(ip, limit);
  return { allowed: true };
}

function getNextDayStart(): number {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

function createErrorResponse(error: string, message: string, status: number) {
  return NextResponse.json({ error, message }, { status });
}

function validatePredictInput(body: any): { isValid: boolean; input?: PredictInput; error?: string } {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a JSON object' };
  }
  
  const { topic, question, horizon, context } = body;
  
  // Required fields validation
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return { isValid: false, error: 'Field "topic" is required and must be a non-empty string' };
  }
  
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return { isValid: false, error: 'Field "question" is required and must be a non-empty string' };
  }
  
  if (!horizon || typeof horizon !== 'string' || horizon.trim().length === 0) {
    return { isValid: false, error: 'Field "horizon" is required and must be a non-empty string' };
  }
  
  // Optional field validation
  if (context !== undefined && typeof context !== 'string') {
    return { isValid: false, error: 'Field "context" must be a string if provided' };
  }
  
  // Length limits
  if (topic.length > 200) {
    return { isValid: false, error: 'Field "topic" must be 200 characters or less' };
  }
  
  if (question.length > 500) {
    return { isValid: false, error: 'Field "question" must be 500 characters or less' };
  }
  
  if (horizon.length > 50) {
    return { isValid: false, error: 'Field "horizon" must be 50 characters or less' };
  }
  
  if (context && context.length > 1000) {
    return { isValid: false, error: 'Field "context" must be 1000 characters or less' };
  }
  
  return {
    isValid: true,
    input: {
      topic: topic.trim(),
      question: question.trim(),
      horizon: horizon.trim(),
      context: context?.trim() || undefined
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        ok: false,
        code: rateLimitResult.code,
        message: rateLimitResult.message
      }, { status: 429 });
    }
    
    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return createErrorResponse(
        'BAD_REQUEST',
        'Invalid JSON in request body',
        400
      );
    }
    
    const validation = validatePredictInput(body);
    if (!validation.isValid) {
      return createErrorResponse(
        'BAD_REQUEST',
        validation.error || 'Invalid input',
        400
      );
    }
    
    const input = validation.input!;
    
    // Check for adapter override in development
    const isDev = process.env.NODE_ENV === 'development';
    const adapterParam = request.nextUrl.searchParams.get('adapter');
    
    let result;
    
    if (isDev && adapterParam === 'baseline') {
      try {
        // Force baseline adapter in development
        result = await baselineAdapter(input);
      } catch (error) {
        console.warn('Baseline adapter failed, falling back to mock:', error);
        result = await mockAdapter(input);
      }
    } else if (isDev && adapterParam === 'mock') {
      // Force mock adapter in development
      result = await mockAdapter(input);
    } else {
      // Use default kernel logic (baseline for crypto, mock for others)
      result = await predict(input);
    }
    
    // Return successful prediction
    return NextResponse.json({
      prob: result.prob,
      drivers: result.drivers,
      rationale: result.rationale,
      model: result.model,
      scenarioId: result.scenarioId,
      ts: result.ts
    }, { status: 200 });
    
  } catch (error) {
    console.error('Prediction API error:', error);
    return createErrorResponse(
      'SERVER_ERROR',
      'Failed to generate prediction. Please try again.',
      500
    );
  }
}

// Method not allowed for other HTTP methods
export async function GET() {
  return createErrorResponse(
    'METHOD_NOT_ALLOWED',
    'Only POST method is allowed',
    405
  );
}
