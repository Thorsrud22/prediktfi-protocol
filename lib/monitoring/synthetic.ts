/**
 * Synthetic Monitoring & Health Checks
 */

import { tracing } from '../observability/tracing';
import { sloMonitor } from '../observability/slo';

export interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  responseTime: number;
  error?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface SyntheticTestResult {
  testName: string;
  success: boolean;
  duration: number;
  checks: HealthCheckResult[];
  errors: string[];
  timestamp: Date;
}

/**
 * Synthetic monitoring service for proactive health checks
 */
export class SyntheticMonitor {
  private baseUrl: string;
  private cronKey: string;
  
  constructor(baseUrl: string = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.cronKey = process.env.RESOLUTION_CRON_KEY || '';
  }
  
  /**
   * Run comprehensive health check suite
   */
  async runHealthChecks(): Promise<SyntheticTestResult> {
    const startTime = Date.now();
    const checks: HealthCheckResult[] = [];
    const errors: string[] = [];
    
    console.log('🔍 Starting synthetic monitoring health checks...');
    
    try {
      // Basic endpoint health
      checks.push(await this.checkEndpointHealth('/api/healthz', 'System Health'));
      checks.push(await this.checkEndpointHealth('/api/feed', 'Feed API'));
      checks.push(await this.checkEndpointHealth('/api/leaderboard', 'Leaderboard API'));
      
      // Admin endpoints (with auth)
      checks.push(await this.checkAdminEndpoint('/api/admin/metrics', 'Admin Metrics'));
      
      // Resolution system health
      checks.push(await this.checkResolutionHealth());
      
      // Score computation health
      checks.push(await this.checkScoreHealth());
      
      // Database connectivity
      checks.push(await this.checkDatabaseHealth());
      
      // External service dependencies
      checks.push(await this.checkExternalServices());
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Health check suite failed: ${errorMessage}`);
    }
    
    const duration = Date.now() - startTime;
    const success = checks.every(check => check.status !== 'critical') && errors.length === 0;
    
    const result: SyntheticTestResult = {
      testName: 'comprehensive_health_check',
      success,
      duration,
      checks,
      errors,
      timestamp: new Date()
    };
    
    // Log results
    this.logSyntheticResults(result);
    
    // Update SLO metrics
    this.updateSLOMetrics(result);
    
    return result;
  }
  
  /**
   * Check basic endpoint health
   */
  private async checkEndpointHealth(endpoint: string, name: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'HEAD',
        timeout: 5000
      } as any);
      
      const responseTime = Date.now() - startTime;
      const status = response.ok ? 'healthy' : 'critical';
      
      return {
        name,
        status,
        responseTime,
        details: {
          statusCode: response.status,
          endpoint
        },
        timestamp: new Date()
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        name,
        status: 'critical',
        responseTime,
        error: errorMessage,
        details: { endpoint },
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Check admin endpoint with authentication
   */
  private async checkAdminEndpoint(endpoint: string, name: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Basic ${Buffer.from('admin:admin').toString('base64')}`,
          'X-Cron-Key': this.cronKey
        },
        timeout: 5000
      } as any);
      
      const responseTime = Date.now() - startTime;
      const status = response.ok ? 'healthy' : 'warning';
      
      return {
        name,
        status,
        responseTime,
        details: {
          statusCode: response.status,
          endpoint,
          authenticated: true
        },
        timestamp: new Date()
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        name,
        status: 'warning', // Admin endpoints are less critical
        responseTime,
        error: errorMessage,
        details: { endpoint },
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Check resolution system health
   */
  private async checkResolutionHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Check resolution endpoint with dry-run
      const response = await fetch(`${this.baseUrl}/api/resolve/run`, {
        method: 'HEAD',
        headers: {
          'X-Cron-Key': this.cronKey
        },
        timeout: 10000
      } as any);
      
      const responseTime = Date.now() - startTime;
      const status = response.ok ? 'healthy' : 'critical';
      
      return {
        name: 'Resolution System',
        status,
        responseTime,
        details: {
          statusCode: response.status,
          system: 'resolution'
        },
        timestamp: new Date()
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        name: 'Resolution System',
        status: 'critical',
        responseTime,
        error: errorMessage,
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Check score computation health
   */
  private async checkScoreHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Check score recomputation endpoint
      const response = await fetch(`${this.baseUrl}/api/cron/recompute-scores`, {
        method: 'HEAD',
        headers: {
          'X-Cron-Key': this.cronKey
        },
        timeout: 10000
      } as any);
      
      const responseTime = Date.now() - startTime;
      const status = response.ok ? 'healthy' : 'critical';
      
      return {
        name: 'Score Computation',
        status,
        responseTime,
        details: {
          statusCode: response.status,
          system: 'scoring'
        },
        timestamp: new Date()
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        name: 'Score Computation',
        status: 'critical',
        responseTime,
        error: errorMessage,
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Check database connectivity
   */
  private async checkDatabaseHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Import Prisma client dynamically to avoid circular dependencies
      const { prisma } = await import('../../app/lib/prisma');
      
      // Simple connectivity test
      await prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'Database Connectivity',
        status: 'healthy',
        responseTime,
        details: {
          system: 'database',
          type: 'sqlite'
        },
        timestamp: new Date()
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        name: 'Database Connectivity',
        status: 'critical',
        responseTime,
        error: errorMessage,
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Check external service dependencies
   */
  private async checkExternalServices(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const services = [];
    
    try {
      // Check CoinGecko API (primary price source)
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/ping', {
          timeout: 5000
        } as any);
        services.push({
          name: 'CoinGecko',
          status: response.ok ? 'healthy' : 'warning',
          responseTime: Date.now() - startTime
        });
      } catch (error) {
        services.push({
          name: 'CoinGecko',
          status: 'warning',
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      const responseTime = Date.now() - startTime;
      const criticalFailures = services.filter(s => s.status === 'critical').length;
      const status = criticalFailures > 0 ? 'critical' : 
                    services.some(s => s.status === 'warning') ? 'warning' : 'healthy';
      
      return {
        name: 'External Services',
        status,
        responseTime,
        details: {
          services,
          total: services.length,
          healthy: services.filter(s => s.status === 'healthy').length
        },
        timestamp: new Date()
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        name: 'External Services',
        status: 'warning',
        responseTime,
        error: errorMessage,
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Log synthetic test results
   */
  private logSyntheticResults(result: SyntheticTestResult): void {
    const { success, duration, checks, errors } = result;
    
    console.log(`🔍 Synthetic monitoring completed: ${success ? '✅ PASS' : '❌ FAIL'} (${duration}ms)`);
    
    // Log individual check results
    checks.forEach(check => {
      const statusIcon = check.status === 'healthy' ? '✅' : 
                        check.status === 'warning' ? '⚠️' : '❌';
      console.log(`  ${statusIcon} ${check.name}: ${check.responseTime}ms`);
      
      if (check.error) {
        console.log(`    Error: ${check.error}`);
      }
    });
    
    if (errors.length > 0) {
      console.log('❌ Synthetic monitoring errors:');
      errors.forEach(error => console.log(`  - ${error}`));
    }
    
    // Send to observability system
    tracing.withSpan(
      'synthetic_monitoring.health_check',
      async () => {
        // Trace synthetic monitoring execution
      },
      {
        'synthetic.success': success,
        'synthetic.duration_ms': duration,
        'synthetic.checks_total': checks.length,
        'synthetic.checks_healthy': checks.filter(c => c.status === 'healthy').length,
        'synthetic.checks_warning': checks.filter(c => c.status === 'warning').length,
        'synthetic.checks_critical': checks.filter(c => c.status === 'critical').length
      }
    );
  }
  
  /**
   * Update SLO metrics based on synthetic test results
   */
  private updateSLOMetrics(result: SyntheticTestResult): void {
    // Update uptime metrics
    const criticalFailures = result.checks.filter(c => c.status === 'critical').length;
    const isSystemDown = criticalFailures > 0;
    
    // Record API latencies
    result.checks.forEach(check => {
      if (check.name.includes('API') || check.name.includes('System')) {
        sloMonitor.recordLatency('synthetic', check.responseTime);
        sloMonitor.recordRequest('synthetic', check.status === 'critical');
      }
    });
    
    // Log uptime event
    if (isSystemDown) {
      console.log('🚨 System degradation detected by synthetic monitoring');
    }
  }
  
  /**
   * Create test insight (dry-run for testing)
   */
  async createTestInsight(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // This would create a test insight in dry-run mode
      // For now, just simulate the operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'Test Insight Creation',
        status: 'healthy',
        responseTime,
        details: {
          operation: 'create_insight_dry_run',
          simulated: true
        },
        timestamp: new Date()
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        name: 'Test Insight Creation',
        status: 'critical',
        responseTime,
        error: errorMessage,
        timestamp: new Date()
      };
    }
  }
}

// Global synthetic monitor instance
export const syntheticMonitor = new SyntheticMonitor();
