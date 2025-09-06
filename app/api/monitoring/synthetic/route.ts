/**
 * Synthetic Monitoring API
 * GET /api/monitoring/synthetic - Run synthetic health checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { syntheticMonitor } from '../../../../lib/monitoring/synthetic';
import { tracing } from '../../../../lib/observability/tracing';

// Cron key validation
function isAuthorizedCron(request: NextRequest): boolean {
  const cronKey = request.headers.get('X-Cron-Key') || request.headers.get('Authorization')?.replace('Bearer ', '');
  const expectedKey = process.env.RESOLUTION_CRON_KEY;
  
  return !!(expectedKey && cronKey === expectedKey);
}

export async function GET(request: NextRequest) {
  return tracing.traceAPIRequest(
    'GET',
    '/api/monitoring/synthetic',
    async () => {
      try {
        // Verify cron authorization
        if (!isAuthorizedCron(request)) {
          return NextResponse.json(
            { error: 'Unauthorized - Cron key required' },
            { status: 401 }
          );
        }
        
        console.log('🔍 Starting synthetic monitoring via API...');
        
        // Run comprehensive health checks
        const result = await syntheticMonitor.runHealthChecks();
        
        // Determine HTTP status based on results
        const httpStatus = result.success ? 200 : 
                          result.checks.some(c => c.status === 'critical') ? 503 : 207;
        
        return NextResponse.json(
          {
            success: result.success,
            timestamp: result.timestamp.toISOString(),
            duration: `${result.duration}ms`,
            summary: {
              total: result.checks.length,
              healthy: result.checks.filter(c => c.status === 'healthy').length,
              warning: result.checks.filter(c => c.status === 'warning').length,
              critical: result.checks.filter(c => c.status === 'critical').length
            },
            checks: result.checks.map(check => ({
              name: check.name,
              status: check.status,
              responseTime: `${check.responseTime}ms`,
              error: check.error,
              details: check.details
            })),
            errors: result.errors
          },
          { 
            status: httpStatus,
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'X-Synthetic-Test': 'true',
              'X-Test-Duration': `${result.duration}ms`
            }
          }
        );
        
      } catch (error) {
        console.error('Synthetic monitoring API error:', error);
        
        return NextResponse.json(
          { 
            success: false,
            error: 'Synthetic monitoring failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          },
          { status: 500 }
        );
      }
    }
  );
}

// Health check for the monitoring endpoint itself
export async function HEAD(request: NextRequest) {
  try {
    if (!isAuthorizedCron(request)) {
      return new NextResponse(null, { status: 401 });
    }
    
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
        'X-Monitoring-Endpoint': 'active'
      }
    });
    
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
