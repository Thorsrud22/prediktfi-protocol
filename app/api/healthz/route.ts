/**
 * Health Check API
 * GET /api/healthz - System health status
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    database: 'connected' | 'error';
    redis?: 'connected' | 'error';
    resolution: 'active' | 'inactive' | 'error';
  };
  version?: string;
  uptime?: number;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const health: HealthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'error',
        resolution: 'inactive'
      },
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime()
    };
    
    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = 'connected';
    } catch (error) {
      console.error('Database health check failed:', error);
      health.services.database = 'error';
      health.status = 'error';
    }
    
    // Test Redis connection (if configured)
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
          headers: {
            'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          },
        });
        
        if (response.ok) {
          health.services.redis = 'connected';
        } else {
          health.services.redis = 'error';
          health.status = 'error';
        }
      } catch (error) {
        console.error('Redis health check failed:', error);
        health.services.redis = 'error';
        health.status = 'error';
      }
    }
    
    // Check resolution system
    try {
      // Check if we have resolved insights (indicates resolution is working)
      const resolvedCount = await prisma.insight.count({
        where: { status: 'RESOLVED' }
      });
      
      health.services.resolution = resolvedCount > 0 ? 'active' : 'inactive';
    } catch (error) {
      console.error('Resolution system health check failed:', error);
      health.services.resolution = 'error';
      health.status = 'error';
    }
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      { ...health, responseTime },
      { 
        status: health.status === 'ok' ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Response-Time': `${responseTime}ms`
        }
      }
    );
    
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        responseTime: Date.now() - startTime
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  }
}

// HEAD request for simple health check
export async function HEAD(request: NextRequest) {
  try {
    // Quick database ping
    await prisma.$queryRaw`SELECT 1`;
    
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