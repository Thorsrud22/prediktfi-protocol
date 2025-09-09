/**
 * Public Market Signals API
 * GET /api/public/signals
 * 
 * Returns cached market context signals with ETag support
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMarketSignals } from '../../../../src/server/signals/feed';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    // Check feature flag
    const signalsEnabled = process.env.SIGNALS === 'on' || process.env.NODE_ENV === 'development';
    if (!signalsEnabled) {
      return NextResponse.json({ items: [], updatedAt: new Date().toISOString() });
    }

    // Get optional pair parameter
    const { searchParams } = new URL(request.url);
    const pair = searchParams.get('pair') || undefined;

    // Fetch signals data
    const signalsData = await getMarketSignals(pair);
    
    // Generate ETag based on content
    const contentHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(signalsData))
      .digest('hex')
      .slice(0, 16);
    
    const etag = `"${contentHash}"`;
    
    // Check If-None-Match header
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { 
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
        }
      });
    }

    // Return fresh data with ETag
    return NextResponse.json(signalsData, {
      headers: {
        'ETag': etag,
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
      }
    });

  } catch (error) {
    console.error('Signals API error:', error);
    
    // Return empty data on error (non-blocking)
    return NextResponse.json({ 
      items: [], 
      updatedAt: new Date().toISOString() 
    });
  }
}
