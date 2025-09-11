/**
 * Admin Metrics API
 * GET /api/admin/metrics - Get aggregated metrics for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminMetrics } from '../../../../lib/metrics/aggregations';

const MetricsQuerySchema = z.object({
  period: z.enum(['24h', '7d', '30d', 'all']).default('7d'),
  resolver: z.enum(['PRICE', 'URL', 'TEXT']).nullable().optional()
});

// Admin authorization check
function isAuthorizedAdmin(request: NextRequest): boolean {
  // Check feature flag
  const adminEnabled = process.env.NEXT_PUBLIC_ENABLE_ADMIN === 'true';
  if (!adminEnabled) {
    return false;
  }
  
  // Check basic auth or admin key
  const authHeader = request.headers.get('Authorization');
  const adminKey = request.headers.get('X-Admin-Key');
  
  // Basic auth check
  if (authHeader?.startsWith('Basic ')) {
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [username, password] = credentials.split(':');
    
    const expectedUser = process.env.ADMIN_USER;
    const expectedPass = process.env.ADMIN_PASS;
    
    if (expectedUser && expectedPass && username === expectedUser && password === expectedPass) {
      return true;
    }
  }
  
  // Admin key check
  if (adminKey && process.env.ADMIN_KEY && adminKey === process.env.ADMIN_KEY) {
    return true;
  }
  
  return false;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check admin authorization
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryResult = MetricsQuerySchema.safeParse({
      period: searchParams.get('period'),
      resolver: searchParams.get('resolver')
    });
    
    if (!queryResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters', 
          details: queryResult.error.errors 
        },
        { status: 400 }
      );
    }
    
    const { period, resolver } = queryResult.data;
    
    console.log(`📊 Admin metrics request: period=${period}, resolver=${resolver || 'all'}`);
    
    // Get metrics with caching
    const metrics = await getAdminMetrics(period, resolver);
    
    const responseTime = Date.now() - startTime;
    
    // Add performance metadata
    const response = {
      ...metrics,
      meta: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        period,
        resolver: resolver || 'all'
      }
    };
    
    return NextResponse.json(response, {
      headers: {
        // 5 minute cache with SWR
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'X-Response-Time': `${responseTime}ms`,
        'X-Cache-Key': metrics.cacheKey
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Admin metrics API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: `${responseTime}ms`
      },
      { status: 500 }
    );
  }
}

// Health check for admin metrics
export async function HEAD(request: NextRequest) {
  try {
    if (!isAuthorizedAdmin(request)) {
      return new NextResponse(null, { status: 401 });
    }
    
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}

// Options for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, X-Admin-Key, Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}
