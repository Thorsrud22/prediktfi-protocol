/**
 * Quota API
 * GET /api/insights/quota - Get user's current quota status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQuota } from '../../../../app/lib/quota';

export async function GET(request: NextRequest) {
  try {
    // Get quota from client-side logic
    const quota = getQuota();
    
    return NextResponse.json({
      quota: {
        used: quota.used,
        limit: quota.limit,
        remaining: quota.remaining,
        resetAtIso: quota.resetAtIso
      },
      exhausted: quota.remaining <= 0
    });
  } catch (error) {
    console.error('Quota API error:', error);
    return NextResponse.json(
      { error: 'Failed to get quota status' },
      { status: 500 }
    );
  }
}
