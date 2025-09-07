/**
 * Latency monitoring API
 * GET /api/monitoring/latency
 */

import { NextRequest, NextResponse } from 'next/server';
import { latencyMonitor } from '../../../lib/monitoring/latency';

export async function GET(request: NextRequest) {
  try {
    const stats = latencyMonitor.getStats();
    
    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Failed to get latency stats:', error);
    return NextResponse.json(
      { error: 'Failed to get latency stats' },
      { status: 500 }
    );
  }
}
