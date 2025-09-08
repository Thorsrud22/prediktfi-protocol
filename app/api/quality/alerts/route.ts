import { NextRequest, NextResponse } from 'next/server';
import { checkAccuracyAlerts } from '../../lib/quality/monitoring';
import { isFeatureEnabled } from '../../lib/flags';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Check if quality monitoring is enabled
    if (!isFeatureEnabled('QUALITY_MONITORING')) {
      return NextResponse.json({ 
        alerts: [],
        message: 'Quality monitoring not enabled' 
      });
    }

    const alerts = await checkAccuracyAlerts();
    
    return NextResponse.json({
      alerts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Quality alerts error:', error);
    return NextResponse.json({ 
      alerts: [],
      error: 'Failed to load alerts' 
    }, { status: 500 });
  }
}
