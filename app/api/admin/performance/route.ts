/**
 * Performance Monitoring API
 * GET /api/admin/performance - Get API performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceStats } from '../../../../lib/performance/monitor';

export async function GET(request: NextRequest) {
  try {
    const stats = getPerformanceStats();

    if (!stats) {
      return NextResponse.json({
        message: 'No performance data available',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      stats,
      recommendations: generateRecommendations(stats),
    });
  } catch (error) {
    console.error('Performance API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateRecommendations(stats: any): string[] {
  const recommendations: string[] = [];

  if (stats.avgDuration > 200) {
    recommendations.push(
      '⚠️ Average response time is high (>200ms). Consider caching or query optimization.',
    );
  }

  if (stats.slowRequests > stats.totalRequests * 0.1) {
    recommendations.push('🐌 More than 10% of requests are slow (>100ms). Check database queries.');
  }

  if (stats.cacheHitRate < 50) {
    recommendations.push(
      '📦 Cache hit rate is low (<50%). Consider increasing cache TTL or coverage.',
    );
  }

  if (stats.totalRequests > 100) {
    recommendations.push('🚀 High traffic detected. Consider implementing rate limiting.');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Performance looks good!');
  }

  return recommendations;
}
