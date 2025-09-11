/**
 * Public Model Metrics API
 * GET /api/public/models/{id}/metrics?window=30d
 * 
 * Returns trading metrics including Brier score and calibration data
 * with ETag support for efficient caching
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateTradingMetrics, generateMetricsETag, MetricsQuery } from '../../../../../../src/server/models/metrics';
import { z } from 'zod';

const MetricsQuerySchema = z.object({
  window: z.string().regex(/^\d+d$/).optional().default('30d'),
  trading_pair: z.string().optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const modelId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const queryResult = MetricsQuerySchema.safeParse({
      window: searchParams.get('window') || '30d',
      trading_pair: searchParams.get('trading_pair') || undefined
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
    
    const query: MetricsQuery = {
      modelId,
      ...queryResult.data
    };
    
    // Calculate metrics
    const startTime = Date.now();
    const metrics = await calculateTradingMetrics(query);
    const processingTime = Date.now() - startTime;
    
    // Generate ETag for caching
    const etag = generateMetricsETag(query, metrics.last_updated);
    
    // Check if client has cached version
    const clientETag = request.headers.get('if-none-match');
    if (clientETag === etag) {
      return new NextResponse(null, { 
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
        }
      });
    }
    
    // Prepare response with all required fields
    const responseData = {
      // Traditional metrics
      total_pnl_usd: metrics.total_pnl_usd,
      win_rate: metrics.win_rate,
      avg_win_usd: metrics.avg_win_usd,
      avg_loss_usd: metrics.avg_loss_usd,
      max_drawdown_usd: metrics.max_drawdown_usd,
      sharpe_ratio: metrics.sharpe_ratio,
      
      // New calibration metrics
      brier_30d: metrics.brier_30d,
      calibration: {
        status: metrics.calibration.status,
        bins: metrics.calibration.bins
      },
      matured_n: metrics.matured_n,
      matured_coverage: metrics.matured_coverage,
      calibrationNote: metrics.calibrationNote,
      
      // Metadata
      total_trades: metrics.total_trades,
      sample_period_days: metrics.sample_period_days,
      last_updated: metrics.last_updated,
      processing_time_ms: processingTime
    };
    
    return NextResponse.json(responseData, {
      headers: {
        'ETag': etag,
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'X-Processing-Time': processingTime.toString()
      }
    });
    
  } catch (error) {
    console.error('Model metrics API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to calculate model metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, If-None-Match',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// HEAD handler for health checks
export async function HEAD(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Quick health check - just verify we can access the model
    const resolvedParams = await params;
    const modelId = resolvedParams.id;
    
    if (!modelId || modelId.length < 5) {
      return new NextResponse(null, { status: 404 });
    }
    
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
        'X-Model-ID': modelId
      }
    });
    
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
