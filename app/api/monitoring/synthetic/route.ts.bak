/**
 * Synthetic Monitoring API Endpoint
 * GET /api/monitoring/synthetic
 * Runs synthetic tests and SLO monitoring every 10 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '../../lib/flags';

export async function GET(request: NextRequest) {
  try {
    // Check if P2A features are enabled
    if (!isFeatureEnabled('ACTIONS')) {
      return NextResponse.json({
        status: 'disabled',
        message: 'P2A features are disabled',
        timestamp: new Date().toISOString()
      });
    }

    // Verify cron key for security
    const cronKey = request.headers.get('X-Cron-Key');
    const expectedKey = process.env.CRON_KEY;
    
    if (!expectedKey || cronKey !== expectedKey) {
      return NextResponse.json({
        status: 'unauthorized',
        message: 'Invalid or missing cron key',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    console.log('🔄 Starting synthetic monitoring via API...');
    const startTime = Date.now();

    // Import and run synthetic tests
    const SyntheticTester = (await import('../../../../scripts/synthetic-p2a')).default;
    const SLOMonitor = (await import('../../../../scripts/slo-monitor')).default;

    // Run synthetic tests
    console.log('🧪 Running synthetic tests...');
    const syntheticTester = new SyntheticTester();
    await syntheticTester.runAllTests();
    await syntheticTester.reportResults();

    // Run SLO monitoring
    console.log('📊 Running SLO monitoring...');
    const sloMonitor = new SLOMonitor();
    await sloMonitor.checkAllSLOs();
    await sloMonitor.sendAlerts();

    const duration = Date.now() - startTime;
    console.log(`✅ Synthetic monitoring completed in ${duration}ms`);

    return NextResponse.json({
      status: 'success',
      message: 'Synthetic monitoring completed successfully',
      timestamp: new Date().toISOString(),
      duration: duration
    });

  } catch (error) {
    console.error('💥 Synthetic monitoring failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Synthetic monitoring failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}