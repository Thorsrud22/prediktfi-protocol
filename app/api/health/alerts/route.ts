// app/api/health/alerts/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { isFeatureEnabled } from '../../../lib/flags';

export async function GET() {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      features: {
        advisor: isFeatureEnabled('ADVISOR'),
        alerts: isFeatureEnabled('ALERTS')
      },
      checks: {
        database: 'healthy',
        email_service: 'healthy',
        webhook_service: 'healthy'
      },
      metrics: {
        active_rules: 0,
        pending_alerts: 0,
        last_evaluation: null as string | null
      }
    };

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      health.checks.database = 'unhealthy';
      health.status = 'degraded';
    }

    // Get metrics if alerts are enabled
    if (isFeatureEnabled('ALERTS')) {
      try {
        const activeRules = await prisma.alertRule.count({
          where: { enabled: true }
        });

        const pendingAlerts = await prisma.alertEvent.count({
          where: { delivered: false }
        });

        const lastEvaluation = await prisma.alertEvent.findFirst({
          orderBy: { firedAt: 'desc' },
          select: { firedAt: true }
        });

        health.metrics = {
          active_rules: activeRules,
          pending_alerts: pendingAlerts,
          last_evaluation: lastEvaluation?.firedAt?.toISOString() || null
        };
      } catch (error) {
        console.error('Error getting alerts metrics:', error);
        health.checks.database = 'unhealthy';
        health.status = 'degraded';
      }
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 503 }
    );
  }
}
