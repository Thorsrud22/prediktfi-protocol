/**
 * Check Noise Filter API endpoint
 * Validates if a trade would be blocked by noise filter
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkNoiseFilterWithMarketData } from '../../../lib/intents/noise-filter';

export async function POST(request: NextRequest) {
  try {
    const { sizeUsd, base, quote } = await request.json();

    if (!sizeUsd || !base || !quote) {
      return NextResponse.json({ error: 'Size USD, base, and quote are required' }, { status: 400 });
    }

    const result = await checkNoiseFilterWithMarketData(sizeUsd, base, quote);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error checking noise filter:', error);
    return NextResponse.json(
      { error: 'Failed to check noise filter' },
      { status: 500 }
    );
  }
}
