import { NextRequest, NextResponse } from 'next/server';
import { getActiveChaosTests, cleanupExpiredChaosTests } from '../../../lib/chaos/chaos-testing';
import { isFeatureEnabled } from '../../lib/flags';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
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
        tests: [],
        message: 'Chaos testing not enabled' 
      });
    }

    // Cleanup expired tests
    cleanupExpiredChaosTests();

    const activeTests = getActiveChaosTests();
    
    return NextResponse.json({
      tests: activeTests,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chaos status error:', error);
    return NextResponse.json({ 
      tests: [],
      error: 'Failed to load chaos test status' 
    }, { status: 500 });
  }
}
