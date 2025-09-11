/**
 * Manual Resolution Trigger API
 * POST /api/resolve/run - Manually trigger resolution job (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { runResolutionJob } from '../../../../scripts/resolve';

export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get('authorization');
    const cronKey = request.headers.get('x-cron-key') || request.headers.get('x-resolution-key');
    
    const expectedKey = process.env.RESOLUTION_CRON_KEY;
    
    if (!expectedKey) {
      return NextResponse.json(
        { error: 'Resolution system not configured' },
        { status: 503 }
      );
    }
    
    // Check authorization
    const providedKey = authHeader?.replace('Bearer ', '') || cronKey;
    if (providedKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if resolution is enabled
    if (process.env.PRICE_RESOLUTION !== 'true') {
      return NextResponse.json(
        { error: 'Price resolution is disabled' },
        { status: 503 }
      );
    }
    
    console.log('🚀 Manual resolution job triggered via API');
    
    // Run the resolution job
    const startTime = Date.now();
    
    // Capture console output for API response
    const logs: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
      logs.push(`[LOG] ${message}`);
      originalLog(...args);
    };
    
    console.error = (...args) => {
      const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
      logs.push(`[ERROR] ${message}`);
      originalError(...args);
    };
    
    try {
      await runResolutionJob();
      
      const tookMs = Date.now() - startTime;
      
      // Restore console
      console.log = originalLog;
      console.error = originalError;
      
      return NextResponse.json({
        success: true,
        message: 'Resolution job completed successfully',
        tookMs,
        logs: logs.slice(-50) // Return last 50 log lines
      });
      
    } catch (error) {
      // Restore console
      console.log = originalLog;
      console.error = originalError;
      
      const tookMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        tookMs,
        logs: logs.slice(-50)
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Resolution API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Health check for resolution system
  try {
    const authHeader = request.headers.get('authorization');
    const cronKey = request.headers.get('x-cron-key') || request.headers.get('x-resolution-key');
    const expectedKey = process.env.RESOLUTION_CRON_KEY;
    
    if (!expectedKey) {
      return NextResponse.json({
        status: 'disabled',
        message: 'Resolution system not configured',
        config: {
          resolutionEnabled: false,
          priceResolution: process.env.PRICE_RESOLUTION === 'true',
          primarySource: process.env.PRICE_PRIMARY || 'coingecko',
          secondarySource: process.env.PRICE_SECONDARY || 'coincap'
        }
      });
    }
    
    // Check authorization for detailed status
    const providedKey = authHeader?.replace('Bearer ', '') || cronKey;
    const isAuthorized = providedKey === expectedKey;
    
    const response = {
      status: 'configured',
      message: 'Resolution system is configured',
      config: {
        resolutionEnabled: process.env.PRICE_RESOLUTION === 'true',
        priceResolution: process.env.PRICE_RESOLUTION === 'true',
        primarySource: process.env.PRICE_PRIMARY || 'coingecko',
        secondarySource: process.env.PRICE_SECONDARY || 'coincap'
      },
      ...(isAuthorized && {
        authorized: true,
        endpoints: {
          trigger: 'POST /api/resolve/run',
          status: 'GET /api/resolve/run'
        }
      })
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
