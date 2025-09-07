/**
 * Monitoring Dashboard API Endpoint
 * GET /api/monitoring/dashboard
 * Provides comprehensive monitoring metrics and alert status
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { isFeatureEnabled } from '../../../lib/flags';

export async function GET(request: NextRequest) {
  try {
    // Check if P2A features are enabled
    if (!isFeatureEnabled('ACTIONS')) {
      return NextResponse.json({
        status: 'disabled',
        message: 'P2A features are disabled',
        timestamp: new Date().toISOString()
      });
    }

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get recent synthetic test results
    const syntheticTests = await prisma.intentReceipt.findMany({
      where: {
        intentId: {
          startsWith: 'synthetic_test_'
        },
        createdAt: {
          gte: oneHourAgo
        }
      },
      select: {
        intentId: true,
        status: true,
        createdAt: true,
        simJson: true,
        notes: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    // Get recent SLO alerts
    const sloAlerts = await prisma.intentReceipt.findMany({
      where: {
        intentId: {
          startsWith: 'slo_alert_'
        },
        createdAt: {
          gte: oneHourAgo
        }
      },
      select: {
        intentId: true,
        status: true,
        createdAt: true,
        simJson: true,
        notes: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Get recent simulation metrics
    const simulations = await prisma.intentReceipt.findMany({
      where: {
        status: 'simulated',
        createdAt: {
          gte: fiveMinutesAgo
        }
      },
      select: {
        intentId: true,
        createdAt: true,
        simJson: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Calculate metrics
    const syntheticStats = calculateSyntheticStats(syntheticTests);
    const sloStats = calculateSLOStats(sloAlerts);
    const simulationStats = calculateSimulationStats(simulations);

    const dashboard = {
      status: 'healthy',
      timestamp: now.toISOString(),
      features: {
        actions: isFeatureEnabled('ACTIONS'),
        embed: isFeatureEnabled('EMBED_INTENT')
      },
      synthetic: {
        totalTests: syntheticStats.totalTests,
        passedTests: syntheticStats.passedTests,
        failedTests: syntheticStats.failedTests,
        successRate: syntheticStats.successRate,
        consecutiveFailures: syntheticStats.consecutiveFailures,
        lastTestTime: syntheticStats.lastTestTime,
        p95Latency: syntheticStats.p95Latency,
        averageLatency: syntheticStats.averageLatency
      },
      slo: {
        totalAlerts: sloStats.totalAlerts,
        criticalAlerts: sloStats.criticalAlerts,
        warningAlerts: sloStats.warningAlerts,
        lastAlertTime: sloStats.lastAlertTime,
        activeViolations: sloStats.activeViolations
      },
      simulation: {
        totalSimulations: simulationStats.totalSimulations,
        averageLatency: simulationStats.averageLatency,
        p95Latency: simulationStats.p95Latency,
        maxLatency: simulationStats.maxLatency,
        minLatency: simulationStats.minLatency
      },
      recentTests: syntheticTests.slice(0, 5).map(test => ({
        intentId: test.intentId,
        status: test.status,
        timestamp: test.createdAt,
        notes: test.notes
      })),
      recentAlerts: sloAlerts.slice(0, 5).map(alert => ({
        intentId: alert.intentId,
        timestamp: alert.createdAt,
        notes: alert.notes
      }))
    };

    // Determine overall status
    if (syntheticStats.consecutiveFailures >= 2 || sloStats.criticalAlerts > 0) {
      dashboard.status = 'critical';
    } else if (syntheticStats.failedTests > 0 || sloStats.warningAlerts > 0) {
      dashboard.status = 'warning';
    }

    return NextResponse.json(dashboard);

  } catch (error) {
    console.error('Failed to get monitoring dashboard:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to get monitoring dashboard',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function calculateSyntheticStats(tests: any[]) {
  const totalTests = tests.length;
  const passedTests = tests.filter(t => t.status === 'simulated').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;
  const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 100;

  // Calculate consecutive failures
  let consecutiveFailures = 0;
  for (const test of tests) {
    if (test.status === 'failed') {
      consecutiveFailures++;
    } else {
      break;
    }
  }

  // Calculate latencies
  const latencies: number[] = [];
  for (const test of tests) {
    try {
      const data = JSON.parse(test.simJson || '{}');
      if (data.metrics && data.metrics.p95Latency) {
        latencies.push(data.metrics.p95Latency);
      }
    } catch {
      continue;
    }
  }

  const p95Latency = latencies.length > 0 ? 
    latencies.sort((a, b) => a - b)[Math.ceil(latencies.length * 0.95) - 1] : 0;
  const averageLatency = latencies.length > 0 ? 
    latencies.reduce((sum, l) => sum + l, 0) / latencies.length : 0;

  return {
    totalTests,
    passedTests,
    failedTests,
    successRate,
    consecutiveFailures,
    lastTestTime: tests[0]?.createdAt,
    p95Latency,
    averageLatency
  };
}

function calculateSLOStats(alerts: any[]) {
  const totalAlerts = alerts.length;
  const criticalAlerts = alerts.filter(a => 
    a.notes && a.notes.includes('Critical')
  ).length;
  const warningAlerts = alerts.filter(a => 
    a.notes && a.notes.includes('Warning')
  ).length;

  return {
    totalAlerts,
    criticalAlerts,
    warningAlerts,
    lastAlertTime: alerts[0]?.createdAt,
    activeViolations: criticalAlerts + warningAlerts
  };
}

function calculateSimulationStats(simulations: any[]) {
  const totalSimulations = simulations.length;
  const latencies: number[] = [];

  for (const sim of simulations) {
    try {
      const data = JSON.parse(sim.simJson || '{}');
      if (data.duration && typeof data.duration === 'number') {
        latencies.push(data.duration);
      }
    } catch {
      continue;
    }
  }

  const averageLatency = latencies.length > 0 ? 
    latencies.reduce((sum, l) => sum + l, 0) / latencies.length : 0;
  const p95Latency = latencies.length > 0 ? 
    latencies.sort((a, b) => a - b)[Math.ceil(latencies.length * 0.95) - 1] : 0;
  const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;
  const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;

  return {
    totalSimulations,
    averageLatency,
    p95Latency,
    maxLatency,
    minLatency
  };
}
