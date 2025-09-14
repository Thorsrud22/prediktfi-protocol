/**
 * Weekly Digest Cron API
 * POST /api/cron/weekly-digest - Generate and send weekly digest
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

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
    
    console.log('📊 Weekly digest endpoint called (simplified version)');
    
    // Simplified response since we removed the external script dependency
    return NextResponse.json({
      success: true,
      message: 'Weekly digest endpoint is working (simplified version)',
      note: 'Full digest generation requires scripts to be available',
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Weekly digest generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
    console.error('Weekly digest health check failed:', error);
    return new NextResponse(null, { status: 503 });
  }
}