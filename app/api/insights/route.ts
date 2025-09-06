// E8.1 Insights Pipeline - Node.js Runtime
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { InsightRequestSchema } from './_schemas';
import { checkAuthAndQuota } from './_auth';
import { insightsCache } from './_cache';
import { runPipeline } from './_pipeline';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Step 1: Parse and validate request body
    const body = await request.json();
    const validation = InsightRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }
    
    const insightRequest = validation.data;
    
    // Step 2: Check authentication and quota
    const authResult = checkAuthAndQuota(request);
    
    if (!authResult.allowed) {
      return NextResponse.json(
        {
          error: authResult.error,
          plan: authResult.plan,
          resetTime: authResult.resetTime,
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Plan': authResult.plan,
            'X-RateLimit-Remaining': authResult.remaining?.toString() || '0',
            'Retry-After': authResult.resetTime ? Math.ceil((authResult.resetTime - Date.now()) / 1000).toString() : '60',
          }
        }
      );
    }
    
    // Step 3: Check cache first
    const cachedResult = insightsCache.get(insightRequest);
    if (cachedResult) {
      return NextResponse.json(
        { ...cachedResult, cached: true },
        {
          headers: {
            'X-Cache': 'HIT',
            'X-RateLimit-Plan': authResult.plan,
            'X-RateLimit-Remaining': authResult.remaining?.toString() || 'unlimited',
          }
        }
      );
    }
    
    // Step 4: Run the insight pipeline
    const result = await runPipeline(insightRequest);
    
    // Step 5: Cache the result
    insightsCache.set(insightRequest, result);
    
    // Step 6: Return response
    return NextResponse.json(result, {
      headers: {
        'X-Cache': 'MISS',
        'X-RateLimit-Plan': authResult.plan,
        'X-RateLimit-Remaining': authResult.remaining?.toString() || 'unlimited',
        'X-Processing-Time': `${Date.now() - startTime}ms`,
      }
    });
    
  } catch (error) {
    console.error('Insights API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Unable to process insight request at this time'
      },
      { 
        status: 500,
        headers: {
          'X-Processing-Time': `${Date.now() - startTime}ms`,
        }
      }
    );
  }
}

// Keep the old GET endpoint for backward compatibility (Solana verification)
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Method not supported in E8.1',
      message: 'Use POST for insights generation. GET is deprecated.',
      migration: 'Switch to POST /api/insights with InsightRequest body'
    },
    { status: 405 }
  );
}
