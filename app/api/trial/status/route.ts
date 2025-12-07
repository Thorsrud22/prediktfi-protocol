import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/flags';

export const runtime = 'edge';

/**
 * Minimal Edge route - returns static response
 * TODO: Implement proper proxy once build issue is resolved
 */
export async function GET(request: NextRequest) {
  try {
    if (!isFeatureEnabled('PRO_TRIALS')) {
      return NextResponse.json({ isOnTrial: false });
    }

    // For now, return static response until proxy architecture works
    return NextResponse.json({
      isOnTrial: false,
      message: 'Pro trials temporarily disabled during deployment fix'
    });
  } catch (error) {
    console.error('Trial status error:', error);
    return NextResponse.json({ isOnTrial: false });
  }
}
