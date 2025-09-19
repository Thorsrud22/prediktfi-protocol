// Performance monitoring utilities
import { performance } from 'perf_hooks';

interface PerformanceMetric {
  endpoint: string;
  duration: number;
  timestamp: number;
  status: number;
  cached: boolean;
}

const metrics: PerformanceMetric[] = [];
const MAX_METRICS = 1000; // Keep last 1000 requests

export function trackPerformance(
  endpoint: string,
  startTime: number,
  status: number = 200,
  cached: boolean = false,
) {
  const duration = performance.now() - startTime;

  metrics.push({
    endpoint,
    duration,
    timestamp: Date.now(),
    status,
    cached,
  });

  // Keep only last MAX_METRICS entries
  if (metrics.length > MAX_METRICS) {
    metrics.splice(0, metrics.length - MAX_METRICS);
  }

  // Log slow requests
  if (duration > 100) {
    console.warn(`🐌 Slow API: ${endpoint} took ${duration.toFixed(2)}ms`);
  }

  return duration;
}

export function getPerformanceStats() {
  const recent = metrics.filter(m => m.timestamp > Date.now() - 60000); // Last minute

  if (recent.length === 0) return null;

  const avgDuration = recent.reduce((sum, m) => sum + m.duration, 0) / recent.length;
  const slowRequests = recent.filter(m => m.duration > 100).length;
  const cacheHitRate = recent.filter(m => m.cached).length / recent.length;

  return {
    totalRequests: recent.length,
    avgDuration: Math.round(avgDuration),
    slowRequests,
    cacheHitRate: Math.round(cacheHitRate * 100),
    endpoints: Object.entries(
      recent.reduce((acc, m) => {
        acc[m.endpoint] = (acc[m.endpoint] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5),
  };
}

export function withPerformanceTracking<T extends (...args: any[]) => Promise<Response>>(
  endpoint: string,
  handler: T,
): T {
  return (async (...args: any[]) => {
    const startTime = performance.now();
    try {
      const response = await handler(...args);
      trackPerformance(endpoint, startTime, response.status);
      return response;
    } catch (error) {
      trackPerformance(endpoint, startTime, 500);
      throw error;
    }
  }) as T;
}
