/**
 * Simulator accuracy metrics API endpoint
 * GET /api/intents/accuracy
 */

import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '../../lib/flags';
import { getAccuracySummary, checkAccuracyAlerts } from '../../../lib/intents/accuracy';

export async function GET(request: NextRequest) {
  // Check if actions feature is enabled
  if (!isFeatureEnabled('ACTIONS')) {
    return NextResponse.json({ error: 'Actions feature not enabled' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const pair = searchParams.get('pair');
    const alertsOnly = searchParams.get('alerts') === 'true';
    
    if (alertsOnly) {
      // Return only accuracy alerts (for dashboard red light)
      const alerts = await checkAccuracyAlerts();
      return NextResponse.json({
        success: true,
        alerts,
        timestamp: new Date().toISOString()
      });
    }
    
    // Return full accuracy summary
    const summary = await getAccuracySummary(pair || undefined);
    
    return NextResponse.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Accuracy API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accuracy metrics' },
      { status: 500 }
    );
  }
}
