/**
 * Ops Guard - Alerting System for Critical Metrics
 * Monitors leaderboard P95 and DB error rates
 */

import { PrismaClient } from '@prisma/client';
import { sloMonitor } from '../observability/slo';

const prisma = new PrismaClient();

export interface OpsGuardAlert {
  id: string;
  type: 'leaderboard_p95' | 'db_error_rate' | 'system_health';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
}

export interface OpsGuardStatus {
  alerts: OpsGuardAlert[];
  activeAlerts: number;
  criticalAlerts: number;
  lastCheck: Date;
  status: 'healthy' | 'warning' | 'critical';
}

class OpsGuard {
  private alerts: Map<string, OpsGuardAlert> = new Map();
  private readonly LEADERBOARD_P95_THRESHOLD = 300; // ms
  private readonly DB_ERROR_RATE_THRESHOLD = 0.5; // %
  private readonly CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes
  private lastCheck: Date = new Date();

  /**
   * Check all critical metrics and generate alerts
   */
  async checkMetrics(): Promise<OpsGuardStatus> {
    console.log('🔍 Ops Guard: Checking critical metrics...');
    
    const alerts: OpsGuardAlert[] = [];
    const now = new Date();

    // Check leaderboard P95
    const leaderboardP95 = await this.checkLeaderboardP95();
    if (leaderboardP95) {
      alerts.push(leaderboardP95);
    }

    // Check DB error rate
    const dbErrorRate = await this.checkDBErrorRate();
    if (dbErrorRate) {
      alerts.push(dbErrorRate);
    }

    // Check system health
    const systemHealth = await this.checkSystemHealth();
    if (systemHealth) {
      alerts.push(systemHealth);
    }

    // Update stored alerts
    alerts.forEach(alert => {
      this.alerts.set(alert.id, alert);
    });

    // Clean up old resolved alerts (older than 24 hours)
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    for (const [id, alert] of this.alerts) {
      if (alert.resolved && alert.timestamp < cutoff) {
        this.alerts.delete(id);
      }
    }

    const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved);
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
    
    const status: OpsGuardStatus = {
      alerts: activeAlerts,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      lastCheck: now,
      status: criticalAlerts.length > 0 ? 'critical' : 
              activeAlerts.length > 0 ? 'warning' : 'healthy'
    };

    this.lastCheck = now;

    // Log status
    console.log(`📊 Ops Guard Status: ${status.status.toUpperCase()}`);
    console.log(`   Active alerts: ${status.activeAlerts}`);
    console.log(`   Critical alerts: ${status.criticalAlerts}`);

    return status;
  }

  /**
   * Check leaderboard P95 response time
   */
  private async checkLeaderboardP95(): Promise<OpsGuardAlert | null> {
    // Get P95 from SLO monitor
    const p95 = sloMonitor.getP95Latency('api/public/leaderboard');
    
    if (p95 > this.LEADERBOARD_P95_THRESHOLD) {
      const severity = p95 > 500 ? 'critical' : 'warning';
      
      return {
        id: `leaderboard_p95_${Date.now()}`,
        type: 'leaderboard_p95',
        severity,
        message: `Leaderboard P95 response time is ${p95}ms (threshold: ${this.LEADERBOARD_P95_THRESHOLD}ms)`,
        value: p95,
        threshold: this.LEADERBOARD_P95_THRESHOLD,
        timestamp: new Date(),
        resolved: false
      };
    }

    return null;
  }

  /**
   * Check database error rate
   */
  private async checkDBErrorRate(): Promise<OpsGuardAlert | null> {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    try {
      // Count total requests in last 10 minutes
      const totalRequests = await prisma.event.count({
        where: {
          type: {
            in: ['api_request', 'database_query']
          },
          createdAt: {
            gte: tenMinutesAgo
          }
        }
      });

      // Count error events in last 10 minutes
      const errorRequests = await prisma.event.count({
        where: {
          type: {
            in: ['api_error', 'database_error']
          },
          createdAt: {
            gte: tenMinutesAgo
          }
        }
      });

      const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

      if (errorRate > this.DB_ERROR_RATE_THRESHOLD) {
        const severity = errorRate > 2.0 ? 'critical' : 'warning';
        
        return {
          id: `db_error_rate_${Date.now()}`,
          type: 'db_error_rate',
          severity,
          message: `Database error rate is ${errorRate.toFixed(2)}% (threshold: ${this.DB_ERROR_RATE_THRESHOLD}%)`,
          value: errorRate,
          threshold: this.DB_ERROR_RATE_THRESHOLD,
          timestamp: new Date(),
          resolved: false
        };
      }
    } catch (error) {
      console.error('Error checking DB error rate:', error);
      
      // If we can't check the DB, that's a critical issue
      return {
        id: `db_error_rate_${Date.now()}`,
        type: 'db_error_rate',
        severity: 'critical',
        message: `Failed to check database error rate: ${error instanceof Error ? error.message : 'Unknown error'}`,
        value: 100, // Assume 100% error rate if we can't check
        threshold: this.DB_ERROR_RATE_THRESHOLD,
        timestamp: new Date(),
        resolved: false
      };
    }

    return null;
  }

  /**
   * Check overall system health
   */
  private async checkSystemHealth(): Promise<OpsGuardAlert | null> {
    const sloStatus = sloMonitor.getSLOStatus();
    
    if (sloStatus.overall === 'critical') {
      return {
        id: `system_health_${Date.now()}`,
        type: 'system_health',
        severity: 'critical',
        message: `System health is critical. Check SLO metrics for details.`,
        value: 0, // 0 = critical
        threshold: 1, // 1 = healthy
        timestamp: new Date(),
        resolved: false
      };
    }

    return null;
  }

  /**
   * Get current ops guard status
   */
  getStatus(): OpsGuardStatus {
    const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved);
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
    
    return {
      alerts: activeAlerts,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      lastCheck: this.lastCheck,
      status: criticalAlerts.length > 0 ? 'critical' : 
              activeAlerts.length > 0 ? 'warning' : 'healthy'
    };
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.timestamp = new Date();
      return true;
    }
    return false;
  }

  /**
   * Get alert history
   */
  getAlertHistory(hours: number = 24): OpsGuardAlert[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.alerts.values())
      .filter(alert => alert.timestamp >= cutoff)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

// Global ops guard instance
export const opsGuard = new OpsGuard();

/**
 * Run ops guard check (for cron jobs)
 */
export async function runOpsGuardCheck(): Promise<OpsGuardStatus> {
  console.log('🚨 Running Ops Guard check...');
  
  const status = await opsGuard.checkMetrics();
  
  // Log critical alerts
  if (status.criticalAlerts > 0) {
    console.error('🚨 CRITICAL ALERTS DETECTED:');
    status.alerts
      .filter(alert => alert.severity === 'critical')
      .forEach(alert => {
        console.error(`   ${alert.type}: ${alert.message}`);
      });
  }
  
  // Log warning alerts
  if (status.activeAlerts > status.criticalAlerts) {
    console.warn('⚠️ WARNING ALERTS:');
    status.alerts
      .filter(alert => alert.severity === 'warning')
      .forEach(alert => {
        console.warn(`   ${alert.type}: ${alert.message}`);
      });
  }
  
  if (status.status === 'healthy') {
    console.log('✅ All systems healthy');
  }
  
  return status;
}

/**
 * Format ops guard status for digest
 */
export function formatOpsGuardForDigest(status: OpsGuardStatus): string {
  let digest = '\n## 🚨 Ops Guard Status\n\n';
  
  if (status.status === 'healthy') {
    digest += '✅ **All systems healthy**\n\n';
    return digest;
  }
  
  const statusIcon = status.status === 'critical' ? '🚨' : '⚠️';
  digest += `${statusIcon} **System Status: ${status.status.toUpperCase()}**\n\n`;
  
  digest += `- **Active Alerts**: ${status.activeAlerts}\n`;
  digest += `- **Critical Alerts**: ${status.criticalAlerts}\n`;
  digest += `- **Last Check**: ${status.lastCheck.toISOString()}\n\n`;
  
  if (status.alerts.length > 0) {
    digest += '### Active Alerts\n\n';
    status.alerts.forEach((alert, index) => {
      const icon = alert.severity === 'critical' ? '🚨' : '⚠️';
      digest += `${index + 1}. ${icon} **${alert.type}** - ${alert.message}\n`;
    });
    digest += '\n';
  }
  
  return digest;
}
