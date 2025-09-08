/**
 * Aggregator Status API
 * GET /api/aggregator/status
 * Returns current aggregator status and fallback mode information
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFallbackStatus } from '../../../lib/aggregators/fallback-service';

export async function GET(request: NextRequest) {
  try {
    const status = getFallbackStatus();
    
    return NextResponse.json(status, {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=60'
      }
    });
    
  } catch (error) {
    console.error('Aggregator status API error:', error);
    return NextResponse.json({ 
      isActive: false,
      message: 'Status check failed',
      type: 'error'
    }, { status: 500 });
  }
}
