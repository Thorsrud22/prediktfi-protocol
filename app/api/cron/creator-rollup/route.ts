/**
 * Nightly Creator Rollup Cron Endpoint
 * POST /api/cron/creator-rollup - Trigger nightly rollup
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { rollupCreatorDailyRange } from '../../../../src/server/creator/rollup';

export interface RollupCronResponse {
  success: boolean;
  message: string;
  stats?: {
    processed: number;
    errors: number;
    duration: number;
    creators: number;
  };
  executedAt: string;
}

/**
 * Verify HMAC signature for cron endpoint
 */
function verifyHMACSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for HMAC signature
    const signature = request.headers.get('x-cron-signature');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-cron-signature header' },
        { status: 401 }
      );
    }
    
    // Get request body for signature verification
    const body = await request.text();
    
    if (!verifyHMACSignature(body, signature, cronSecret)) {
      console.error('Invalid HMAC signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    console.log('🌙 Starting nightly creator rollup...');
    
    // Calculate date range (yesterday to ensure all data is available)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log(`📅 Rolling up data for ${yesterday.toISOString().split('T')[0]}`);
    
    // Run rollup for yesterday
    const stats = await rollupCreatorDailyRange(yesterday, today);
    
    const response: RollupCronResponse = {
      success: stats.errors === 0,
      message: `Nightly rollup completed: ${stats.processed} records processed for ${stats.creators} creators in ${stats.duration}ms`,
      stats,
      executedAt: new Date().toISOString()
    };
    
    console.log('✅ Nightly rollup completed:', response.message);
    
    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Nightly rollup cron error:', error);
    
    const response: RollupCronResponse = {
      success: false,
      message: `Nightly rollup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      executedAt: new Date().toISOString()
    };
    
    return NextResponse.json(response, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Health check endpoint
export async function HEAD(request: NextRequest) {
  try {
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Creator rollup cron health check failed:', error);
    return new NextResponse(null, { status: 503 });
  }
}
