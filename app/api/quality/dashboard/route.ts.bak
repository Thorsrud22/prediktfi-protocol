import { NextRequest, NextResponse } from 'next/server';
import { getQualityMetrics, checkAccuracyAlerts } from '../../lib/quality/monitoring';
import { sendSlackAlerts } from '../../lib/quality/alerts';
import { isFeatureEnabled } from '../../lib/flags';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Check if quality monitoring is enabled
    if (!isFeatureEnabled('QUALITY_MONITORING')) {
      return NextResponse.json({ 
        error: 'Quality monitoring not enabled' 
      }, { status: 403 });
    }

    const metrics = await getQualityMetrics();
    const alerts = await checkAccuracyAlerts();

    // Send alerts to Slack if any exist
    if (alerts.length > 0) {
      try {
        await sendSlackAlerts(alerts);
      } catch (error) {
        console.error('Failed to send Slack alerts:', error);
        // Continue with response even if Slack fails
      }
    }

    return NextResponse.json({
      metrics,
      alerts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Quality dashboard error:', error);
    return NextResponse.json({ 
      error: 'Failed to load quality metrics' 
    }, { status: 500 });
  }
}
