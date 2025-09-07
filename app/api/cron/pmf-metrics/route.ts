/**
 * PMF Metrics Cron API
 * POST /api/cron/pmf-metrics
 * Calculates and stores PMF metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { PMFTracker } from '../../../lib/analytics/pmf-tracker';

export async function POST(request: NextRequest) {
  try {
    // Verify cron key for security
    const cronKey = request.headers.get('X-Cron-Key');
    const expectedKey = process.env.CRON_KEY;
    
    if (!expectedKey || cronKey !== expectedKey) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or missing cron key'
      }, { status: 401 });
    }

    console.log('📊 Starting PMF metrics calculation...');
    const startTime = Date.now();
    
    // Calculate metrics for different periods
    const periods = ['daily', 'weekly', 'monthly'] as const;
    const results = [];
    
    for (const period of periods) {
      console.log(`📈 Calculating ${period} metrics...`);
      
      // Calculate metrics
      const metrics = await PMFTracker.calculateMetrics(period);
      
      // Store metrics
      await PMFTracker.storeMetrics(metrics, period);
      
      results.push({
        period,
        metrics: {
          clickSimRate: Math.round(metrics.clickSimRate * 100),
          simSignRate: Math.round(metrics.simSignRate * 100),
          d7Retention: Math.round(metrics.d7Retention * 100),
          socialSharing: metrics.socialSharing,
          signalFollowing: Math.round(metrics.signalFollowing * 100)
        }
      });
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ PMF metrics calculation completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'PMF metrics calculated successfully',
      results,
      duration
    });

  } catch (error) {
    console.error('💥 PMF metrics calculation failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate PMF metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
