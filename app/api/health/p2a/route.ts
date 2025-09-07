/**
 * P2A Health Check Endpoint
 * GET /api/health/p2a
 * Comprehensive health check for Prediction-to-Action system
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { isFeatureEnabled } from '../../../lib/flags';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Check if P2A features are enabled
    const actionsEnabled = isFeatureEnabled('ACTIONS');
    const embedEnabled = isFeatureEnabled('EMBED_INTENT');
    
    if (!actionsEnabled && !embedEnabled) {
      return NextResponse.json({
        status: 'disabled',
        message: 'P2A features are disabled',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      });
    }

    const healthChecks = await Promise.allSettled([
      checkDatabase(),
      checkRecentIntents(),
      checkSimulationAccuracy(),
      checkExecutionHealth(),
      checkEmbedHealth()
    ]);

    const results = healthChecks.map((result, index) => ({
      check: ['database', 'recent_intents', 'simulation_accuracy', 'execution_health', 'embed_health'][index],
      status: result.status === 'fulfilled' ? 'pass' : 'fail',
      details: result.status === 'fulfilled' ? result.value : result.reason
    }));

    const allPassed = results.every(r => r.status === 'pass');
    const failedChecks = results.filter(r => r.status === 'fail');

    const response = {
      status: allPassed ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      features: {
        actions: actionsEnabled,
        embed: embedEnabled
      },
      checks: results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.status === 'pass').length,
        failed: failedChecks.length
      }
    };

    if (failedChecks.length > 0) {
      response.summary.failed_checks = failedChecks.map(c => c.check);
    }

    return NextResponse.json(response, {
      status: allPassed ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('P2A health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      duration: Date.now()
    }, { status: 500 });
  }
}

async function checkDatabase() {
  try {
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Check if P2A tables exist
    const intentCount = await prisma.intent.count();
    const receiptCount = await prisma.intentReceipt.count();
    
    return {
      connected: true,
      tables_exist: true,
      intent_count: intentCount,
      receipt_count: receiptCount
    };
  } catch (error) {
    throw new Error(`Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function checkRecentIntents() {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Check recent intent creation
    const recentIntents = await prisma.intent.count({
      where: {
        createdAt: {
          gte: oneHourAgo
        }
      }
    });

    // Check for failed intents
    const failedReceipts = await prisma.intentReceipt.count({
      where: {
        status: 'failed',
        createdAt: {
          gte: oneHourAgo
        }
      }
    });

    return {
      recent_intents: recentIntents,
      failed_receipts: failedReceipts,
      failure_rate: recentIntents > 0 ? (failedReceipts / recentIntents) * 100 : 0
    };
  } catch (error) {
    throw new Error(`Recent intents check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function checkSimulationAccuracy() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Get executed receipts with simulation data
    const executedReceipts = await prisma.intentReceipt.findMany({
      where: {
        status: 'executed',
        createdAt: {
          gte: thirtyDaysAgo
        },
        simJson: {
          not: null
        }
      },
      select: {
        simJson: true,
        execJson: true,
        slippageBps: true
      }
    });

    if (executedReceipts.length === 0) {
      return {
        sample_size: 0,
        accuracy: 0,
        message: 'No executed receipts with simulation data'
      };
    }

    // Calculate accuracy based on slippage prediction
    let accurateCount = 0;
    let totalSlippageDiff = 0;

    executedReceipts.forEach(receipt => {
      if (receipt.simJson && receipt.execJson) {
        try {
          const simData = JSON.parse(receipt.simJson);
          const execData = JSON.parse(receipt.execJson);
          
          const slippageDiff = Math.abs(simData.estSlippageBps - execData.slippageBps);
          totalSlippageDiff += slippageDiff;
          
          if (slippageDiff <= 50) { // Within 0.5%
            accurateCount++;
          }
        } catch (parseError) {
          // Skip malformed data
        }
      }
    });

    const accuracy = (accurateCount / executedReceipts.length) * 100;
    const avgSlippageDiff = totalSlippageDiff / executedReceipts.length;

    return {
      sample_size: executedReceipts.length,
      accuracy: Math.round(accuracy),
      avg_slippage_diff: Math.round(avgSlippageDiff),
      accurate_predictions: accurateCount
    };
  } catch (error) {
    throw new Error(`Simulation accuracy check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function checkExecutionHealth() {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Check execution success rate
    const totalExecutions = await prisma.intentReceipt.count({
      where: {
        status: {
          in: ['executed', 'failed']
        },
        createdAt: {
          gte: oneHourAgo
        }
      }
    });

    const successfulExecutions = await prisma.intentReceipt.count({
      where: {
        status: 'executed',
        createdAt: {
          gte: oneHourAgo
        }
      }
    });

    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 100;

    // Check for stuck intents (created but no receipts)
    const stuckIntents = await prisma.intent.count({
      where: {
        createdAt: {
          gte: oneHourAgo
        },
        receipts: {
          none: {}
        }
      }
    });

    return {
      total_executions: totalExecutions,
      successful_executions: successfulExecutions,
      success_rate: Math.round(successRate),
      stuck_intents: stuckIntents
    };
  } catch (error) {
    throw new Error(`Execution health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function checkEmbedHealth() {
  try {
    // Check if embed script is accessible
    const embedScriptResponse = await fetch('http://localhost:3001/embed/intent.js');
    
    if (!embedScriptResponse.ok) {
      throw new Error(`Embed script not accessible: ${embedScriptResponse.status}`);
    }

    // Check recent embed page requests (simulated)
    const recentIntents = await prisma.intent.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    return {
      script_accessible: true,
      recent_intents_for_embed: recentIntents
    };
  } catch (error) {
    throw new Error(`Embed health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
