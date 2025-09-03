import { NextRequest, NextResponse } from 'next/server';
import { predict, PredictInput } from '../../../lib/ai/kernel';
import { rateLimitOrThrow } from '../../../lib/rate';

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
    // Apply rate limiting with Pro bypass
    await rateLimitOrThrow(request);
    
    // Parse and validate request body
    const body = await request.json();
    const validation = validatePredictInput(body);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    // Generate prediction using the AI kernel
    const result = await predict(validation.input!);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('AI predict error:', error);
    
    // Handle rate limit errors with structured response
    if (error instanceof Error) {
      if (error.message.includes('rate_limit_exceeded')) {
        return NextResponse.json(
          { 
            error: 'rate_limit_exceeded',
            message: 'Too many requests. Please wait before trying again.',
            code: 'RATE_LIMIT'
          },
          { status: 429 }
        );
      }
      
      if (error.message.includes('daily_limit_exceeded')) {
        return NextResponse.json(
          { 
            error: 'daily_limit_exceeded',
            message: 'Daily limit reached. Upgrade to Pro for unlimited access.',
            code: 'FREE_DAILY_LIMIT'
          },
          { status: 429 }
        );
      }
    }
    
    // Generic server error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
