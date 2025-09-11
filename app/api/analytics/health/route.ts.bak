/**
 * Analytics Health Check Endpoint
 * GET /api/analytics/health
 */

import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    // Test database connection
    const eventCount = await prisma.analyticsEvent.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      eventsLast24h: eventCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
