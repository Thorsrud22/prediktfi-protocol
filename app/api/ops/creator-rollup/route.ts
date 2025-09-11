/**
 * Creator Rollup Operations API
 * POST /api/ops/creator-rollup - Run creator daily metrics rollup
 */

import { NextRequest, NextResponse } from 'next/server';
import { rollupCreatorDailyRange } from '../../../../src/server/creator/rollup';
import { createHmac } from 'crypto';

export interface RollupResponse {
  success: boolean;
  stats: {
    processed: number;
    errors: number;
    duration: number;
    creators: number;
  };
  message: string;
  generatedAt: string;
}

/**
 * Verify HMAC signature for operations endpoint
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
    const signature = request.headers.get('x-ops-signature');
    const opsSecret = process.env.OPS_SECRET;
    
    if (!opsSecret) {
      console.error('OPS_SECRET not configured');
      return NextResponse.json(
        { error: 'Operations secret not configured' },
        { status: 500 }
      );
    }
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-ops-signature header' },
        { status: 401 }
      );
    }
    
    // Get request body for signature verification
    const body = await request.text();
    
    if (!verifyHMACSignature(body, signature, opsSecret)) {
      console.error('Invalid HMAC signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Parse request body
    let requestData: { since?: string; until?: string } = {};
    try {
      requestData = JSON.parse(body);
    } catch (error) {
      requestData = {};
    }
    
    // Determine date range
    const since = requestData.since ? new Date(requestData.since) : undefined;
    const until = requestData.until ? new Date(requestData.until) : undefined;
    
    console.log(`🔄 Starting creator rollup (since: ${since?.toISOString()}, until: ${until?.toISOString()})`);
    
    // Run rollup
    const stats = await rollupCreatorDailyRange(since, until);
    
    const response: RollupResponse = {
      success: true,
      stats,
      message: `Processed ${stats.processed} records for ${stats.creators} creators in ${stats.duration}ms`,
      generatedAt: new Date().toISOString()
    };
    
    console.log(`✅ Creator rollup completed: ${response.message}`);
    
    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Creator rollup error:', error);
    
    const response: RollupResponse = {
      success: false,
      stats: {
        processed: 0,
        errors: 1,
        duration: 0,
        creators: 0
      },
      message: `Rollup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      generatedAt: new Date().toISOString()
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
    // Just verify the endpoint is accessible
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('Creator rollup health check failed:', error);
    return new NextResponse(null, { status: 503 });
  }
}
