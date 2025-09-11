/**
 * HMAC Signing API for Admin Panel
 * POST /api/admin/hmac-sign
 * 
 * Generates HMAC signatures for admin operations
 * - Internal use only for admin panel
 * - Signs data with OPS_HMAC_SECRET
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Get HMAC secret from environment
    const hmacSecret = process.env.OPS_HMAC_SECRET;
    if (!hmacSecret) {
      return NextResponse.json(
        { error: 'OPS_HMAC_SECRET not configured' },
        { status: 500 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { data } = body;
    
    if (!data) {
      return NextResponse.json(
        { error: 'Missing data field' },
        { status: 400 }
      );
    }
    
    // Generate HMAC signature
    const signature = createHmac('sha256', hmacSecret)
      .update(data)
      .digest('hex');
    
    return NextResponse.json({
      signature,
      data
    });
    
  } catch (error) {
    console.error('HMAC signing error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
