/**
 * Signals Watch Cron Job
 * POST /api/ops/signals-watch
 * 
 * Monitors signals health and automatically manages rollout
 * - Checks health metrics every 5 minutes
 * - Auto-kills rollout if issues detected
 * - Sends Slack notifications
 * - Suggests rollup when healthy for 10+ minutes
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { safeFetchJson } from '@/lib/safe-json';

// Health monitoring state
interface WatchState {
  lastCheck: number;
  consecutiveHealthyChecks: number;
  lastAlertSent: number;
  lastKillTime: number;
  alertCooldown: number; // 5 minutes between alerts
}

const watchState: WatchState = {
  lastCheck: 0,
  consecutiveHealthyChecks: 0,
  lastAlertSent: 0,
  lastKillTime: 0,
  alertCooldown: 5 * 60 * 1000 // 5 minutes
};

/**
 * Send Slack notification
 */
async function sendSlackNotification(message: string, severity: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('Slack webhook not configured, skipping notification:', message);
    return;
  }

  try {
    const color = severity === 'error' ? '#ff0000' : severity === 'warning' ? '#ffaa00' : '#00ff00';

    const payload = {
      text: `🚨 Signals API Alert`,
      attachments: [
        {
          color,
          fields: [
            {
              title: 'Status',
              value: message,
              short: false
            },
            {
              title: 'Timestamp',
              value: new Date().toISOString(),
              short: true
            },
            {
              title: 'Environment',
              value: process.env.NODE_ENV || 'unknown',
              short: true
            }
          ]
        }
      ]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Failed to send Slack notification:', response.status, response.statusText);
    } else {
      console.log('Slack notification sent:', message);
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error);
  }
}

/**
 * Check if we should send an alert (respect cooldown)
 */
function shouldSendAlert(): boolean {
  const now = Date.now();
  return (now - watchState.lastAlertSent) > watchState.alertCooldown;
}

/**
 * Update alert timestamp
 */
function markAlertSent(): void {
  watchState.lastAlertSent = Date.now();
}

/**
 * Kill rollout by setting it to 0%
 */
async function killRollout(reason: string): Promise<void> {
  try {
    const hmacSecret = process.env.OPS_HMAC_SECRET;
    if (!hmacSecret) {
      console.error('Cannot kill rollout: OPS_HMAC_SECRET not configured');
      return;
    }

    const body = JSON.stringify({ percent: 0 });
    const signature = createHmac('sha256', hmacSecret)
      .update(body)
      .digest('hex');

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/ops/rollout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ops-signature': signature
      },
      body
    });

    if (response.ok) {
      watchState.lastKillTime = Date.now();
      console.log(`Rollout killed due to: ${reason}`);

      if (shouldSendAlert()) {
        await sendSlackNotification(
          `🚨 Signals API rollout KILLED (0%)\nReason: ${reason}`,
          'error'
        );
        markAlertSent();
      }
    } else {
      console.error('Failed to kill rollout:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error killing rollout:', error);
  }
}

/**
 * Get current rollout percentage
 */
async function getCurrentRollout(): Promise<number> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const result = await safeFetchJson(`${baseUrl}/api/ops/rollout`);
    if (result.success && result.data) {
      const data = result.data as { rollout?: { percent: number } };
      return data.rollout?.percent || 0;
    }
  } catch (error) {
    console.error('Error getting current rollout:', error);
  }
  return 0;
}

/**
 * Check health and take action
 */
async function checkHealthAndAct(): Promise<void> {
  const now = Date.now();
  watchState.lastCheck = now;

  try {
    // Get health metrics
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const healthResult = await safeFetchJson(`${baseUrl}/api/ops/signals-health`);
    if (!healthResult.success || !healthResult.data) {
      throw new Error(`Health check failed: ${healthResult.error || 'Unknown error'}`);
    }

    interface HealthData {
      p95_ms: number;
      rate_5xx: number;
    }

    interface RolloutData {
      rollout: {
        percent: number;
      };
    }

    const health = healthResult.data as HealthData;
    const currentRollout = await getCurrentRollout();

    // Check for issues
    const hasIssues = health.p95_ms > 200 || health.rate_5xx > 0.005; // 200ms P95 or 0.5% 5xx rate

    if (hasIssues) {
      console.log(`Health issues detected: P95=${health.p95_ms}ms, 5xx=${(health.rate_5xx * 100).toFixed(2)}%`);

      // Kill rollout if it's not already 0%
      if (currentRollout > 0) {
        const reason = `P95: ${health.p95_ms}ms, 5xx rate: ${(health.rate_5xx * 100).toFixed(2)}%`;
        await killRollout(reason);
      }

      // Reset healthy check counter
      watchState.consecutiveHealthyChecks = 0;

    } else {
      // System is healthy
      watchState.consecutiveHealthyChecks++;

      console.log(`Health check passed (${watchState.consecutiveHealthyChecks} consecutive): P95=${health.p95_ms}ms, 5xx=${(health.rate_5xx * 100).toFixed(2)}%`);

      // Check if we should suggest rollup (healthy for 10+ minutes = 2 checks)
      const healthyForMinutes = (watchState.consecutiveHealthyChecks * 5) / 60; // 5 minutes per check

      if (healthyForMinutes >= 10 && currentRollout < 100) {
        if (shouldSendAlert()) {
          const suggestion = currentRollout === 0 ? '10%' :
            currentRollout === 10 ? '50%' :
              currentRollout === 50 ? '100%' : 'unknown';

          await sendSlackNotification(
            `✅ Signals API healthy for ${healthyForMinutes.toFixed(1)} minutes\n` +
            `Current rollout: ${currentRollout}%\n` +
            `Suggestion: Increase to ${suggestion}%`,
            'info'
          );
          markAlertSent();
        }
      }
    }

  } catch (error) {
    console.error('Health check failed:', error);

    // If we can't check health, kill rollout as a safety measure
    const currentRollout = await getCurrentRollout();
    if (currentRollout > 0) {
      await killRollout(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Optional: Verify this is called by a cron service
    const cronSecret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run health check
    await checkHealthAndAct();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      consecutiveHealthyChecks: watchState.consecutiveHealthyChecks,
      lastCheck: watchState.lastCheck
    });

  } catch (error) {
    console.error('Signals watch error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also support GET for manual triggering
export async function GET(request: NextRequest) {
  try {
    await checkHealthAndAct();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      state: watchState
    });

  } catch (error) {
    console.error('Signals watch GET error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
