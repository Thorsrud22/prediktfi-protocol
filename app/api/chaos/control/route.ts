import { NextRequest, NextResponse } from 'next/server';
import { enableChaosTest, disableChaosTest, getChaosTestResults } from '../../../lib/chaos/chaos-testing';
import { isFeatureEnabled } from '../../../lib/flags';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Only allow in staging/development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        error: 'Chaos testing not allowed in production' 
      }, { status: 403 });
    }

    // Check if chaos testing is enabled
    if (!isFeatureEnabled('CHAOS_TESTING')) {
      return NextResponse.json({ 
        error: 'Chaos testing not enabled' 
      }, { status: 403 });
    }

    const { action, testId, config } = await request.json();
    
    if (!action || !testId) {
      return NextResponse.json({ 
        error: 'Missing required fields: action, testId' 
      }, { status: 400 });
    }

    let success = false;
    let message = '';

    switch (action) {
      case 'enable':
        success = enableChaosTest(testId, config);
        message = success ? `Chaos test ${testId} enabled` : `Failed to enable chaos test ${testId}`;
        break;
        
      case 'disable':
        success = disableChaosTest(testId);
        message = success ? `Chaos test ${testId} disabled` : `Failed to disable chaos test ${testId}`;
        break;
        
      default:
        return NextResponse.json({ 
          error: 'Invalid action. Use "enable" or "disable"' 
        }, { status: 400 });
    }

    return NextResponse.json({
      success,
      message,
      testId,
      action,
    });
  } catch (error) {
    console.error('Chaos control error:', error);
    return NextResponse.json({ 
      error: 'Failed to control chaos test' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Only allow in staging/development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        error: 'Chaos testing not allowed in production' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    
    if (!testId) {
      return NextResponse.json({ 
        error: 'Missing testId parameter' 
      }, { status: 400 });
    }

    const results = getChaosTestResults(testId);
    
    return NextResponse.json({
      testId,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chaos results error:', error);
    return NextResponse.json({ 
      error: 'Failed to load chaos test results' 
    }, { status: 500 });
  }
}
