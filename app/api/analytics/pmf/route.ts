/**
 * PMF Analytics API
 * GET /api/analytics/pmf
 * Returns Product-Market Fit metrics and status
 */

import { NextRequest, NextResponse } from 'next/server';
import { PMFTracker } from '../../../lib/analytics/pmf-tracker';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as 'daily' | 'weekly' | 'monthly') || 'weekly';

    // Get metrics with status
    const { metrics, status, targets } = await PMFTracker.getMetricsWithStatus(period);

    // Calculate overall PMF score
    const passedMetrics = Object.values(status).filter(s => s === 'pass').length;
    const totalMetrics = Object.keys(status).length;
    const pmfScore = (passedMetrics / totalMetrics) * 100;

    // Determine overall status
    let overallStatus: 'excellent' | 'good' | 'warning' | 'critical';
    if (pmfScore >= 80) overallStatus = 'excellent';
    else if (pmfScore >= 60) overallStatus = 'good';
    else if (pmfScore >= 40) overallStatus = 'warning';
    else overallStatus = 'critical';

    // Get historical trends
    const historicalMetrics = await getHistoricalMetrics(period);

    const response = {
      period,
      overallStatus,
      pmfScore: Math.round(pmfScore),
      metrics: {
        clickSimRate: {
          value: Math.round(metrics.clickSimRate * 100) / 100,
          target: targets.clickSimRate,
          status: status.clickSimRate,
          percentage: Math.round(metrics.clickSimRate * 100),
          description: 'Click→Sim Rate: Users who click "Trade this" and then simulate'
        },
        simSignRate: {
          value: Math.round(metrics.simSignRate * 100) / 100,
          target: targets.simSignRate,
          status: status.simSignRate,
          percentage: Math.round(metrics.simSignRate * 100),
          description: 'Sim→Sign Rate: Users who simulate and then sign/execute'
        },
        d7Retention: {
          value: Math.round(metrics.d7Retention * 100) / 100,
          target: targets.d7Retention,
          status: status.d7Retention,
          percentage: Math.round(metrics.d7Retention * 100),
          description: 'D7 Retention: Users still active after 7 days'
        },
        socialSharing: {
          value: metrics.socialSharing,
          target: targets.socialSharing,
          status: status.socialSharing,
          percentage: Math.round((metrics.socialSharing / targets.socialSharing) * 100),
          description: 'Social Sharing: Shared receipts per week'
        },
        signalFollowing: {
          value: Math.round(metrics.signalFollowing * 100) / 100,
          target: targets.signalFollowing,
          status: status.signalFollowing,
          percentage: Math.round(metrics.signalFollowing * 100),
          description: 'Signal Following: 30-day positive performance rate'
        }
      },
      trends: historicalMetrics,
      summary: {
        passed: passedMetrics,
        total: totalMetrics,
        critical: Object.values(status).filter(s => s === 'fail').length,
        warning: Object.values(status).filter(s => s === 'warning').length
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Failed to get PMF metrics:', error);
    
    return NextResponse.json({
      error: 'Failed to get PMF metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Get historical metrics for trend analysis
 */
async function getHistoricalMetrics(period: 'daily' | 'weekly' | 'monthly') {
  const { prisma } = await import('../../../lib/prisma');
  
  try {
    const now = new Date();
    const daysBack = period === 'daily' ? 7 : period === 'weekly' ? 30 : 90;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    const historicalData = await prisma.pMFMetric.findMany({
      where: {
        period,
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    });

    // Group by metric type and create trend data
    const trends: Record<string, Array<{ date: string; value: number; target: number }>> = {};

    historicalData.forEach(metric => {
      if (!trends[metric.metricType]) {
        trends[metric.metricType] = [];
      }
      
      trends[metric.metricType].push({
        date: metric.date.toISOString().split('T')[0],
        value: metric.value,
        target: metric.target
      });
    });

    return trends;
  } catch (error) {
    console.error('Failed to get historical metrics:', error);
    return {};
  }
}
