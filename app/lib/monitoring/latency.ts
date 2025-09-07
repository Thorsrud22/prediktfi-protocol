/**
 * Latency monitoring and SLO tracking
 * Tracks performance metrics for simulation and execution
 */

interface LatencyMetric {
  operation: 'simulate' | 'execute' | 'quote';
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

interface SLOThresholds {
  simulateP95: number; // ms
  executeP95: number; // ms
  quoteP95: number; // ms
}

class LatencyMonitor {
  private metrics: LatencyMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics
  private readonly thresholds: SLOThresholds = {
    simulateP95: 1500, // 1.5s
    executeP95: 20000, // 20s
    quoteP95: 2000 // 2s
  };

  recordMetric(operation: 'simulate' | 'execute' | 'quote', duration: number, success: boolean, error?: string): void {
    const metric: LatencyMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      success,
      error
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    const threshold = this.thresholds[`${operation}P95` as keyof SLOThresholds];
    if (duration > threshold) {
      console.warn(`🐌 Slow ${operation}: ${duration}ms (threshold: ${threshold}ms)`);
    }
  }

  getP95Latency(operation: 'simulate' | 'execute' | 'quote', windowMs: number = 300000): number {
    const cutoff = Date.now() - windowMs;
    const recentMetrics = this.metrics.filter(
      m => m.operation === operation && m.timestamp > cutoff && m.success
    );

    if (recentMetrics.length === 0) return 0;

    const durations = recentMetrics.map(m => m.duration).sort((a, b) => a - b);
    const p95Index = Math.ceil(durations.length * 0.95) - 1;
    return durations[p95Index] || 0;
  }

  getSuccessRate(operation: 'simulate' | 'execute' | 'quote', windowMs: number = 300000): number {
    const cutoff = Date.now() - windowMs;
    const recentMetrics = this.metrics.filter(
      m => m.operation === operation && m.timestamp > cutoff
    );

    if (recentMetrics.length === 0) return 1;

    const successful = recentMetrics.filter(m => m.success).length;
    return successful / recentMetrics.length;
  }

  checkSLOViolations(): Array<{
    operation: string;
    metric: string;
    value: number;
    threshold: number;
    severity: 'warning' | 'critical';
  }> {
    const violations: Array<{
      operation: string;
      metric: string;
      value: number;
      threshold: number;
      severity: 'warning' | 'critical';
    }> = [];

    const operations: Array<'simulate' | 'execute' | 'quote'> = ['simulate', 'execute', 'quote'];

    for (const operation of operations) {
      const p95 = this.getP95Latency(operation);
      const threshold = this.thresholds[`${operation}P95` as keyof SLOThresholds];
      
      if (p95 > threshold) {
        violations.push({
          operation,
          metric: 'P95 Latency',
          value: p95,
          threshold,
          severity: p95 > threshold * 1.5 ? 'critical' : 'warning'
        });
      }

      const successRate = this.getSuccessRate(operation);
      if (successRate < 0.95) {
        violations.push({
          operation,
          metric: 'Success Rate',
          value: successRate * 100,
          threshold: 95,
          severity: successRate < 0.9 ? 'critical' : 'warning'
        });
      }
    }

    return violations;
  }

  getStats(): {
    totalMetrics: number;
    operations: Record<string, {
      count: number;
      p95Latency: number;
      successRate: number;
      avgLatency: number;
    }>;
    violations: Array<{
      operation: string;
      metric: string;
      value: number;
      threshold: number;
      severity: 'warning' | 'critical';
    }>;
  } {
    const operations: Record<string, {
      count: number;
      p95Latency: number;
      successRate: number;
      avgLatency: number;
    }> = {};

    const opTypes: Array<'simulate' | 'execute' | 'quote'> = ['simulate', 'execute', 'quote'];

    for (const op of opTypes) {
      const opMetrics = this.metrics.filter(m => m.operation === op);
      const successful = opMetrics.filter(m => m.success);
      
      operations[op] = {
        count: opMetrics.length,
        p95Latency: this.getP95Latency(op),
        successRate: opMetrics.length > 0 ? successful.length / opMetrics.length : 1,
        avgLatency: opMetrics.length > 0 ? 
          opMetrics.reduce((sum, m) => sum + m.duration, 0) / opMetrics.length : 0
      };
    }

    return {
      totalMetrics: this.metrics.length,
      operations,
      violations: this.checkSLOViolations()
    };
  }

  // Clear metrics (useful for testing)
  clear(): void {
    this.metrics = [];
  }
}

// Singleton instance
export const latencyMonitor = new LatencyMonitor();

// Export types
export type { LatencyMetric, SLOThresholds };
