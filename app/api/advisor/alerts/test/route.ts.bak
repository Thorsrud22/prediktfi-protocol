// app/api/advisor/alerts/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AlertsEngine } from '../../../../../lib/advisor/alerts-engine';
import { isFeatureEnabled } from '../../../../../lib/flags';
import { prisma } from '../../../../../lib/prisma';

export async function POST(request: NextRequest) {
  // Check if alerts feature is enabled
  if (!isFeatureEnabled('ALERTS')) {
    return NextResponse.json({ error: 'Alerts feature not enabled' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { ruleId, days = 7 } = body;
    
    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID required' }, { status: 400 });
    }

    // Check if rule exists
    const rule = await prisma.alertRule.findUnique({
      where: { id: ruleId }
    });

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Initialize alerts engine
    const alertsEngine = new AlertsEngine();
    
    // Test the rule
    const testResults = await alertsEngine.testRule(ruleId, days);
    
    return NextResponse.json({
      success: true,
      data: testResults
    });

  } catch (error) {
    console.error('Error testing alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to test alert rule' },
      { status: 500 }
    );
  }
}
