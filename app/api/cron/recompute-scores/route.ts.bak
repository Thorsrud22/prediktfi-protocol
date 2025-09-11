/**
 * Cron API for Score Recomputation
 * GET /api/cron/recompute-scores - Trigger score recomputation (cron only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateAllProfileAggregates } from '../../../../lib/score';
import { createEvent } from '../../../../lib/events';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify cron key
    const cronKey = request.headers.get('X-Cron-Key') || request.headers.get('Authorization')?.replace('Bearer ', '');
    const expectedKey = process.env.RESOLUTION_CRON_KEY;
    
    if (!expectedKey || cronKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron key' },
        { status: 401 }
      );
    }
    
    console.log('🧮 Starting scheduled score recomputation...');
    
    // Run score recomputation
    await updateAllProfileAggregates();
    
    const duration = Date.now() - startTime;
    
    // Log completion event
    await createEvent('scores_recomputed_cron', {
      durationMs: duration,
      trigger: 'cron',
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ Scheduled score recomputation completed in ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      message: 'Score recomputation completed',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('❌ Scheduled score recomputation failed:', errorMessage);
    
    // Log failure event
    await createEvent('scores_recomputation_failed_cron', {
      durationMs: duration,
      error: errorMessage,
      trigger: 'cron',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Score recomputation failed', 
        message: errorMessage,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Health check for cron endpoint
export async function HEAD(request: NextRequest) {
  try {
    const cronKey = request.headers.get('X-Cron-Key') || request.headers.get('Authorization')?.replace('Bearer ', '');
    const expectedKey = process.env.RESOLUTION_CRON_KEY;
    
    if (!expectedKey || cronKey !== expectedKey) {
      return new NextResponse(null, { status: 401 });
    }
    
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
