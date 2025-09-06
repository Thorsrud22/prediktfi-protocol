/**
 * SLO (Service Level Objectives) Definition & Monitoring
 */

export interface SLOTarget {
  name: string;
  description: string;
  target: number;
  unit: string;
  measurement: 'latency' | 'availability' | 'success_rate' | 'error_rate';
}

export interface SLOMetric {
  name: string;
  value: number;
  target: number;
  status: 'healthy' | 'warning' | 'critical';
  lastMeasured: Date;
  trend: 'up' | 'down' | 'stable';
}

export interface SLOStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  metrics: SLOMetric[];
  lastUpdate: Date;
  uptime: {
    current: number;
    target: number;
    status: 'healthy' | 'warning' | 'critical';
  };
}

// SLO Targets as defined in BLOKK 9
export const SLO_TARGETS: SLOTarget[] = [
  {
    name: 'api_latency_p95',
    description: 'P95 API latency',
    target: 300,
    unit: 'ms',
    measurement: 'latency'
  },
  {
    name: 'error_rate',
    description: 'Overall error rate',
    target: 1,
    unit: '%',
    measurement: 'error_rate'
  },
  {
    name: 'uptime',
    description: 'Public endpoint uptime',
    target: 99.9,
    unit: '%',
    measurement: 'availability'
  },
  {
    name: 'resolver_success_rate',
    description: 'Daily resolver job success rate',
    target: 99,
    unit: '%',
    measurement: 'success_rate'
  }
];

/**
 * SLO Status Calculator
 */
export class SLOMonitor {
  private metrics: Map<string, number[]> = new Map();
  private errors: Map<string, number> = new Map();
  private requests: Map<string, number> = new Map();
  
  /**
   * Record API latency
   */
  recordLatency(endpoint: string, latencyMs: number): void {
    const key = `latency_${endpoint}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const values = this.metrics.get(key)!;
    values.push(latencyMs);
    
    // Keep only last 1000 measurements for P95 calculation
    if (values.length > 1000) {
      values.shift();
    }
  }
  
  /**
   * Record request/error for error rate calculation
   */
  recordRequest(endpoint: string, isError: boolean = false): void {
    const requestKey = `requests_${endpoint}`;
    const errorKey = `errors_${endpoint}`;
    
    this.requests.set(requestKey, (this.requests.get(requestKey) || 0) + 1);
    
    if (isError) {
      this.errors.set(errorKey, (this.errors.get(errorKey) || 0) + 1);
    }
  }
  
  /**
   * Calculate P95 latency for endpoint
   */
  getP95Latency(endpoint: string): number {
    const key = `latency_${endpoint}`;
    const values = this.metrics.get(key);
    
    if (!values || values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    
    return sorted[p95Index] || 0;
  }
  
  /**
   * Calculate error rate for endpoint
   */
  getErrorRate(endpoint: string): number {
    const requestKey = `requests_${endpoint}`;
    const errorKey = `errors_${endpoint}`;
    
    const requests = this.requests.get(requestKey) || 0;
    const errors = this.errors.get(errorKey) || 0;
    
    if (requests === 0) return 0;
    
    return (errors / requests) * 100;
  }
  
  /**
   * Get overall SLO status
   */
  getSLOStatus(): SLOStatus {
    const now = new Date();
    const metrics: SLOMetric[] = [];
    
    // API Latency P95
    const apiLatency = this.getP95Latency('api');
    metrics.push({
      name: 'API Latency P95',
      value: apiLatency,
      target: 300,
      status: apiLatency <= 300 ? 'healthy' : apiLatency <= 500 ? 'warning' : 'critical',
      lastMeasured: now,
      trend: 'stable' // TODO: Calculate trend from historical data
    });
    
    // Error Rate
    const errorRate = this.getErrorRate('api');
    metrics.push({
      name: 'Error Rate',
      value: errorRate,
      target: 1,
      status: errorRate <= 1 ? 'healthy' : errorRate <= 5 ? 'warning' : 'critical',
      lastMeasured: now,
      trend: 'stable'
    });
    
    // Resolver Success Rate (mock for now)
    metrics.push({
      name: 'Resolver Success Rate',
      value: 99.5,
      target: 99,
      status: 'healthy',
      lastMeasured: now,
      trend: 'stable'
    });
    
    // Overall status
    const criticalCount = metrics.filter(m => m.status === 'critical').length;
    const warningCount = metrics.filter(m => m.status === 'warning').length;
    
    const overall = criticalCount > 0 ? 'critical' : 
                   warningCount > 0 ? 'degraded' : 'healthy';
    
    return {
      overall,
      metrics,
      lastUpdate: now,
      uptime: {
        current: 99.95, // Mock uptime
        target: 99.9,
        status: 'healthy'
      }
    };
  }
  
  /**
   * Reset metrics (for testing)
   */
  reset(): void {
    this.metrics.clear();
    this.errors.clear();
    this.requests.clear();
  }
}

// Global SLO monitor instance
export const sloMonitor = new SLOMonitor();
