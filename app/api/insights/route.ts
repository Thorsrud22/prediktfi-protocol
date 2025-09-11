// E8.1 Insights Pipeline - Node.js Runtime
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { InsightRequestSchema } from './_schemas';
import { checkAuthAndQuota } from './_auth';
import { insightsCache } from './_cache';
import { runPipeline } from './_pipeline';
import { checkAntiGaming, logAntiGamingViolation, getAntiGamingStatus } from '../../lib/anti-gaming';

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
    
    // Step 3: Check anti-gaming measures
    const walletId = request.headers.get('x-wallet-id') || 
                    request.cookies.get('wallet_id')?.value ||
                    request.nextUrl.searchParams.get('wallet');
    
    if (walletId) {
      const antiGamingCheck = await checkAntiGaming({
        walletId,
        question: insightRequest.question,
        probability: 0.5, // Default probability for anti-gaming check
        category: insightRequest.category,
        timestamp: new Date()
      });
      
      if (!antiGamingCheck.allowed) {
        // Log the violation
        await logAntiGamingViolation(walletId, antiGamingCheck.reason || 'Unknown violation', {
          walletId,
          question: insightRequest.question,
          probability: 0.5, // Default probability for logging
          category: insightRequest.category,
          timestamp: new Date()
        });
        
        return NextResponse.json(
          {
            error: 'Anti-gaming violation',
            message: antiGamingCheck.reason,
            cooldownUntil: antiGamingCheck.cooldownUntil?.toISOString(),
            violations: antiGamingCheck.violations
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Plan': authResult.plan,
              'Retry-After': antiGamingCheck.cooldownUntil ? 
                Math.ceil((antiGamingCheck.cooldownUntil.getTime() - Date.now()) / 1000).toString() : '60',
            }
          }
        );
      }
    }
    
    // Step 4: Check cache first
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
    
    // Step 5: Run the insight pipeline
    const result = await runPipeline(insightRequest);
    
    // Step 6: Cache the result
    insightsCache.set(insightRequest, result);
    
    // Step 7: Return response
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
