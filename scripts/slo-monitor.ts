/**
 * Enhanced SLO Monitoring for Predikt Prediction-to-Action v1
 * Monitors key performance indicators and alerts on violations with comprehensive tracking
 */

import { prisma } from '../app/lib/prisma';

interface SLOMetric {
  name: string;
  value: number;
  threshold: number;
  unit: string;
  timestamp: Date;
  status: 'healthy' | 'warning' | 'critical';
  intentId?: string;
  pair?: string;
  reason?: string;
}

interface SLOAlert {
  metric: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  message: string;
  timestamp: Date;
  intentId?: string;
  pair?: string;
  reason?: string;
  duration?: number; // How long the condition has been active
}

interface MonitoringWindow {
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
}

class SLOMonitor {
  private alerts: SLOAlert[] = [];
  private monitoringWindow: MonitoringWindow = {
    startTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    endTime: new Date(),
    duration: 5
  };

  async checkAllSLOs(): Promise<SLOMetric[]> {
    console.log('📊 Checking enhanced SLOs for P2A v1...');
    
    // Update monitoring window
    this.monitoringWindow = {
      startTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      endTime: new Date(),
      duration: 5
    };

    const metrics = await Promise.all([
      this.checkSimulationLatencyP95(),
      this.checkExecutionFailRate(),
      this.checkSyntheticFailures(),
      this.checkDatabaseLatency(),
      this.checkEmbedLoadTime(),
      this.checkGuardViolationRate()
    ]);

    const allMetrics = metrics.flat();
    
    // Check for SLO violations with enhanced tracking
    await this.checkSLOViolations(allMetrics);
    
    // Report results
    this.reportSLOStatus(allMetrics);
    
    return allMetrics;
  }

  private async checkSimulationLatencyP95(): Promise<SLOMetric[]> {
    try {
      // Get recent simulation receipts within monitoring window
      const simulations = await prisma.intentReceipt.findMany({
        where: {
          status: 'simulated',
          createdAt: {
            gte: this.monitoringWindow.startTime,
            lte: this.monitoringWindow.endTime
          }
        },
        select: {
          intentId: true,
          createdAt: true,
          simJson: true
        }
      });

      if (simulations.length === 0) {
        return [{
          name: 'simulation_latency_p95',
          value: 0,
          threshold: 1500, // 1.5 seconds
          unit: 'ms',
          timestamp: new Date(),
          status: 'healthy',
          reason: 'No simulations in monitoring window'
        }];
      }

      // Extract latencies from simulation data
      const latencies: number[] = [];
      let slowestIntentId: string | undefined;
      let slowestPair: string | undefined;
      let maxLatency = 0;

      for (const sim of simulations) {
        try {
          const simData = JSON.parse(sim.simJson || '{}');
          if (simData.duration && typeof simData.duration === 'number') {
            latencies.push(simData.duration);
            if (simData.duration > maxLatency) {
              maxLatency = simData.duration;
              slowestIntentId = sim.intentId;
              slowestPair = simData.pair || 'SOL/USDC';
            }
          }
        } catch (parseError) {
          // Skip invalid JSON
          continue;
        }
      }

      if (latencies.length === 0) {
        return [{
          name: 'simulation_latency_p95',
          value: 0,
          threshold: 1500,
          unit: 'ms',
          timestamp: new Date(),
          status: 'healthy',
          reason: 'No valid latency data found'
        }];
      }

      // Calculate P95 latency
      const sortedLatencies = latencies.sort((a, b) => a - b);
      const p95Index = Math.ceil(sortedLatencies.length * 0.95) - 1;
      const p95Latency = sortedLatencies[p95Index] || 0;
      
      return [{
        name: 'simulation_latency_p95',
        value: p95Latency,
        threshold: 1500,
        unit: 'ms',
        timestamp: new Date(),
        status: p95Latency > 1500 ? 'critical' : p95Latency > 1000 ? 'warning' : 'healthy',
        intentId: slowestIntentId,
        pair: slowestPair,
        reason: p95Latency > 1500 ? `P95 latency ${p95Latency}ms exceeds 1.5s threshold` : undefined
      }];
    } catch (error) {
      console.error('Failed to check simulation latency P95:', error);
      return [{
        name: 'simulation_latency_p95',
        value: 0,
        threshold: 1500,
        unit: 'ms',
        timestamp: new Date(),
        status: 'critical',
        reason: `Error checking latency: ${error instanceof Error ? error.message : 'Unknown error'}`
      }];
    }
  }

  private async checkExecutionFailRate(): Promise<SLOMetric[]> {
    try {
      // Get recent executions within monitoring window
      const executions = await prisma.intentReceipt.findMany({
        where: {
          status: {
            in: ['executed', 'failed']
          },
          createdAt: {
            gte: this.monitoringWindow.startTime,
            lte: this.monitoringWindow.endTime
          }
        },
        select: {
          intentId: true,
          status: true,
          createdAt: true,
          notes: true
        }
      });

      if (executions.length === 0) {
        return [{
          name: 'execution_fail_rate',
          value: 0,
          threshold: 1, // 1% max fail rate
          unit: '%',
          timestamp: new Date(),
          status: 'healthy',
          reason: 'No executions in monitoring window'
        }];
      }

      const failed = executions.filter(e => e.status === 'failed');
      const failRate = (failed.length / executions.length) * 100;
      
      // Find the most recent failed execution for context
      const mostRecentFailure = failed.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      )[0];

      return [{
        name: 'execution_fail_rate',
        value: failRate,
        threshold: 1,
        unit: '%',
        timestamp: new Date(),
        status: failRate > 1 ? 'critical' : failRate > 0.5 ? 'warning' : 'healthy',
        intentId: mostRecentFailure?.intentId,
        pair: 'SOL/USDC', // Default pair
        reason: failRate > 1 ? `Execution fail rate ${failRate.toFixed(2)}% exceeds 1% threshold` : undefined
      }];
    } catch (error) {
      console.error('Failed to check execution fail rate:', error);
      return [{
        name: 'execution_fail_rate',
        value: 0,
        threshold: 1,
        unit: '%',
        timestamp: new Date(),
        status: 'critical',
        reason: `Error checking fail rate: ${error instanceof Error ? error.message : 'Unknown error'}`
      }];
    }
  }

  private async checkSyntheticFailures(): Promise<SLOMetric[]> {
    try {
      // Get recent synthetic test results
      const syntheticTests = await prisma.intentReceipt.findMany({
        where: {
          intentId: {
            startsWith: 'synthetic_test_'
          },
          createdAt: {
            gte: this.monitoringWindow.startTime,
            lte: this.monitoringWindow.endTime
          }
        },
        select: {
          intentId: true,
          status: true,
          createdAt: true,
          simJson: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (syntheticTests.length === 0) {
        return [{
          name: 'synthetic_failures',
          value: 0,
          threshold: 2, // Max 2 consecutive failures
          unit: 'count',
          timestamp: new Date(),
          status: 'healthy',
          reason: 'No synthetic tests in monitoring window'
        }];
      }

      // Calculate consecutive failures
      let consecutiveFailures = 0;
      let lastFailureIntentId: string | undefined;
      let lastFailurePair: string | undefined;

      for (const test of syntheticTests) {
        if (test.status === 'failed') {
          consecutiveFailures++;
          if (!lastFailureIntentId) {
            lastFailureIntentId = test.intentId;
            try {
              const testData = JSON.parse(test.simJson || '{}');
              lastFailurePair = testData.pair || 'SOL/USDC';
            } catch {
              lastFailurePair = 'SOL/USDC';
            }
          }
        } else {
          break; // Stop counting when we hit a successful test
        }
      }

      return [{
        name: 'synthetic_failures',
        value: consecutiveFailures,
        threshold: 2,
        unit: 'count',
        timestamp: new Date(),
        status: consecutiveFailures >= 2 ? 'critical' : consecutiveFailures >= 1 ? 'warning' : 'healthy',
        intentId: lastFailureIntentId,
        pair: lastFailurePair,
        reason: consecutiveFailures >= 2 ? `${consecutiveFailures} consecutive synthetic test failures` : undefined
      }];
    } catch (error) {
      console.error('Failed to check synthetic failures:', error);
      return [{
        name: 'synthetic_failures',
        value: 0,
        threshold: 2,
        unit: 'count',
        timestamp: new Date(),
        status: 'critical',
        reason: `Error checking synthetic failures: ${error instanceof Error ? error.message : 'Unknown error'}`
      }];
    }
  }

  private async checkGuardViolationRate(): Promise<SLOMetric[]> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // Get recent intents and receipts
      const intents = await prisma.intent.count({
        where: {
          createdAt: {
            gte: oneHourAgo
          }
        }
      });

      const failedReceipts = await prisma.intentReceipt.count({
        where: {
          status: 'failed',
          createdAt: {
            gte: oneHourAgo
          },
          notes: {
            contains: 'Guard'
          }
        }
      });

      const violationRate = intents > 0 ? (failedReceipts / intents) * 100 : 0;
      
      return [{
        name: 'guard_violation_rate',
        value: violationRate,
        threshold: 5, // 5% max violation rate
        unit: '%',
        timestamp: new Date(),
        status: violationRate > 5 ? 'critical' : violationRate > 2 ? 'warning' : 'healthy'
      }];
    } catch (error) {
      console.error('Failed to check guard violation rate:', error);
      return [];
    }
  }

  private async checkEmbedLoadTime(): Promise<SLOMetric[]> {
    try {
      // Mock embed load time check
      const embedLoadTime = 200; // Mock value
      
      return [{
        name: 'embed_load_time',
        value: embedLoadTime,
        threshold: 500, // 500ms max load time
        unit: 'ms',
        timestamp: new Date(),
        status: embedLoadTime > 500 ? 'critical' : embedLoadTime > 300 ? 'warning' : 'healthy'
      }];
    } catch (error) {
      console.error('Failed to check embed load time:', error);
      return [];
    }
  }

  private async checkDatabaseLatency(): Promise<SLOMetric[]> {
    try {
      const startTime = Date.now();
      
      // Simple database query to measure latency
      await prisma.intent.count();
      
      const latency = Date.now() - startTime;
      
      return [{
        name: 'database_latency',
        value: latency,
        threshold: 100, // 100ms max latency
        unit: 'ms',
        timestamp: new Date(),
        status: latency > 100 ? 'critical' : latency > 50 ? 'warning' : 'healthy'
      }];
    } catch (error) {
      console.error('Failed to check database latency:', error);
      return [];
    }
  }

  private async checkSLOViolations(metrics: SLOMetric[]): Promise<void> {
    this.alerts = [];
    
    for (const metric of metrics) {
      if (metric.status === 'critical') {
        // Check if this is a sustained violation (5+ minutes)
        const duration = await this.getViolationDuration(metric.name, metric.value, metric.threshold);
        
        this.alerts.push({
          metric: metric.name,
          value: metric.value,
          threshold: metric.threshold,
          severity: 'critical',
          message: `Critical SLO violation: ${metric.name} is ${metric.value}${metric.unit}, exceeding threshold of ${metric.threshold}${metric.unit}`,
          timestamp: new Date(),
          intentId: metric.intentId,
          pair: metric.pair,
          reason: metric.reason,
          duration: duration
        });
      } else if (metric.status === 'warning') {
        this.alerts.push({
          metric: metric.name,
          value: metric.value,
          threshold: metric.threshold,
          severity: 'warning',
          message: `Warning SLO violation: ${metric.name} is ${metric.value}${metric.unit}, approaching threshold of ${metric.threshold}${metric.unit}`,
          timestamp: new Date(),
          intentId: metric.intentId,
          pair: metric.pair,
          reason: metric.reason
        });
      }
    }
  }

  private async getViolationDuration(metricName: string, currentValue: number, threshold: number): Promise<number> {
    try {
      // Check historical data to determine how long this violation has been active
      const historicalMetrics = await prisma.intentReceipt.findMany({
        where: {
          simJson: {
            contains: metricName
          },
          createdAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
          }
        },
        select: {
          createdAt: true,
          simJson: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      let violationStartTime: Date | null = null;
      
      for (const record of historicalMetrics) {
        try {
          const data = JSON.parse(record.simJson || '{}');
          if (data.metrics) {
            const metric = data.metrics.find((m: any) => m.name === metricName);
            if (metric && metric.value > threshold) {
              violationStartTime = record.createdAt;
            } else {
              break; // Violation ended
            }
          }
        } catch {
          continue;
        }
      }

      if (violationStartTime) {
        return Math.floor((Date.now() - violationStartTime.getTime()) / (1000 * 60)); // minutes
      }
      
      return 0;
    } catch (error) {
      console.error('Failed to get violation duration:', error);
      return 0;
    }
  }

  private reportSLOStatus(metrics: SLOMetric[]): void {
    const healthy = metrics.filter(m => m.status === 'healthy').length;
    const warning = metrics.filter(m => m.status === 'warning').length;
    const critical = metrics.filter(m => m.status === 'critical').length;
    
    console.log('\n📈 SLO Status Report:');
    console.log(`✅ Healthy: ${healthy}`);
    console.log(`⚠️  Warning: ${warning}`);
    console.log(`🚨 Critical: ${critical}`);
    
    if (this.alerts.length > 0) {
      console.log('\n🚨 SLO Alerts:');
      this.alerts.forEach(alert => {
        const icon = alert.severity === 'critical' ? '🚨' : '⚠️';
        console.log(`${icon} ${alert.message}`);
      });
    }
    
    // Store SLO metrics in database
    this.storeSLOMetrics(metrics);
  }

  private async storeSLOMetrics(metrics: SLOMetric[]): Promise<void> {
    try {
      // Store SLO metrics as a special intent receipt
      await prisma.intentReceipt.create({
        data: {
          intentId: 'slo_monitor_' + Date.now(),
          status: this.alerts.length === 0 ? 'simulated' : 'failed',
          simJson: JSON.stringify({
            type: 'slo_metrics',
            metrics: metrics,
            alerts: this.alerts,
            summary: {
              healthy: metrics.filter(m => m.status === 'healthy').length,
              warning: metrics.filter(m => m.status === 'warning').length,
              critical: metrics.filter(m => m.status === 'critical').length
            }
          }),
          notes: `SLO check: ${metrics.length} metrics, ${this.alerts.length} alerts`
        }
      });
    } catch (error) {
      console.error('Failed to store SLO metrics:', error);
    }
  }

  async sendAlerts(): Promise<void> {
    if (this.alerts.length === 0) {
      return;
    }

    console.log(`📢 Sending ${this.alerts.length} SLO alerts...`);
    
    // Filter alerts that should be sent (sustained violations for 5+ minutes)
    const alertsToSend = this.alerts.filter(alert => {
      if (alert.severity === 'critical' && alert.duration && alert.duration >= 5) {
        return true;
      }
      if (alert.severity === 'warning') {
        return true; // Send warnings immediately
      }
      return false;
    });

    if (alertsToSend.length === 0) {
      console.log('📢 No alerts to send (violations not sustained long enough)');
      return;
    }

    // Send alerts to various channels
    for (const alert of alertsToSend) {
      await this.sendSlackAlert(alert);
      await this.sendWebhookAlert(alert);
      
      console.log(`📢 ${alert.severity.toUpperCase()}: ${alert.message}`);
      if (alert.intentId) console.log(`   IntentId: ${alert.intentId}`);
      if (alert.pair) console.log(`   Pair: ${alert.pair}`);
      if (alert.reason) console.log(`   Reason: ${alert.reason}`);
      if (alert.duration) console.log(`   Duration: ${alert.duration} minutes`);
    }

    // Store alerts in database for tracking
    await this.storeAlerts(alertsToSend);
  }

  private async sendSlackAlert(alert: SLOAlert): Promise<void> {
    try {
      const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (!slackWebhookUrl) {
        console.log('📢 Slack webhook URL not configured, skipping Slack alert');
        return;
      }

      const slackMessage = {
        text: `🚨 P2A SLO Alert: ${alert.metric}`,
        attachments: [
          {
            color: alert.severity === 'critical' ? 'danger' : 'warning',
            fields: [
              {
                title: 'Metric',
                value: alert.metric,
                short: true
              },
              {
                title: 'Value',
                value: `${alert.value}${alert.unit}`,
                short: true
              },
              {
                title: 'Threshold',
                value: `${alert.threshold}${alert.unit}`,
                short: true
              },
              {
                title: 'Severity',
                value: alert.severity.toUpperCase(),
                short: true
              }
            ]
          }
        ]
      };

      if (alert.intentId) {
        slackMessage.attachments[0].fields.push({
          title: 'IntentId',
          value: alert.intentId,
          short: true
        });
      }

      if (alert.pair) {
        slackMessage.attachments[0].fields.push({
          title: 'Pair',
          value: alert.pair,
          short: true
        });
      }

      if (alert.reason) {
        slackMessage.attachments[0].fields.push({
          title: 'Reason',
          value: alert.reason,
          short: false
        });
      }

      if (alert.duration) {
        slackMessage.attachments[0].fields.push({
          title: 'Duration',
          value: `${alert.duration} minutes`,
          short: true
        });
      }

      const response = await fetch(slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage)
      });

      if (!response.ok) {
        console.error('Failed to send Slack alert:', response.status, response.statusText);
      } else {
        console.log('📢 Slack alert sent successfully');
      }
    } catch (error) {
      console.error('Error sending Slack alert:', error);
    }
  }

  private async sendWebhookAlert(alert: SLOAlert): Promise<void> {
    try {
      const webhookUrl = process.env.ALERT_WEBHOOK_URL;
      if (!webhookUrl) {
        console.log('📢 Alert webhook URL not configured, skipping webhook alert');
        return;
      }

      const webhookPayload = {
        timestamp: alert.timestamp.toISOString(),
        service: 'p2a-monitoring',
        alert: {
          metric: alert.metric,
          value: alert.value,
          threshold: alert.threshold,
          unit: 'ms',
          severity: alert.severity,
          message: alert.message,
          intentId: alert.intentId,
          pair: alert.pair,
          reason: alert.reason,
          duration: alert.duration
        }
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });

      if (!response.ok) {
        console.error('Failed to send webhook alert:', response.status, response.statusText);
      } else {
        console.log('📢 Webhook alert sent successfully');
      }
    } catch (error) {
      console.error('Error sending webhook alert:', error);
    }
  }

  private async storeAlerts(alerts: SLOAlert[]): Promise<void> {
    try {
      for (const alert of alerts) {
        await prisma.intentReceipt.create({
          data: {
            intentId: `slo_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'failed',
            simJson: JSON.stringify({
              type: 'slo_alert',
              alert: alert,
              timestamp: new Date().toISOString()
            }),
            notes: `SLO Alert: ${alert.metric} - ${alert.message}`
          }
        });
      }
      console.log(`📊 Stored ${alerts.length} alerts in database`);
    } catch (error) {
      console.error('Failed to store alerts in database:', error);
    }
  }
}

// Run SLO monitoring if called directly
if (require.main === module) {
  const monitor = new SLOMonitor();
  
  monitor.checkAllSLOs()
    .then(() => monitor.sendAlerts())
    .then(() => {
      console.log('🎉 SLO monitoring completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 SLO monitoring failed:', error);
      process.exit(1);
    });
}

export default SLOMonitor;
