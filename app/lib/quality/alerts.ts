import 'server-only';
import { AccuracyAlert } from './monitoring';

export interface SlackAlert {
  text: string;
  attachments: {
    color: 'warning' | 'danger' | 'good';
    fields: {
      title: string;
      value: string;
      short: boolean;
    }[];
    footer: string;
    ts: number;
  }[];
}

/**
 * Send accuracy alert to Slack
 */
export async function sendSlackAlert(alert: AccuracyAlert): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL not configured, skipping alert');
    return;
  }

  const slackAlert: SlackAlert = {
    text: `🚨 Predikt Quality Alert: ${alert.severity.toUpperCase()}`,
    attachments: [
      {
        color: alert.severity === 'critical' ? 'danger' : 'warning',
        fields: [
          {
            title: 'Alert Type',
            value: 'Simulation Accuracy',
            short: true,
          },
          {
            title: 'Current Value',
            value: `${alert.currentValue.toFixed(1)}%`,
            short: true,
          },
          {
            title: 'Threshold',
            value: `${alert.threshold}%`,
            short: true,
          },
          {
            title: 'Pair',
            value: alert.pair || 'All Pairs',
            short: true,
          },
          {
            title: 'Message',
            value: alert.message,
            short: false,
          },
        ],
        footer: 'Predikt Quality Monitor',
        ts: Math.floor(alert.createdAt.getTime() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackAlert),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log(`Slack alert sent for ${alert.type}: ${alert.id}`);
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
    throw error;
  }
}

/**
 * Send multiple alerts to Slack
 */
export async function sendSlackAlerts(alerts: AccuracyAlert[]): Promise<void> {
  if (alerts.length === 0) return;

  // Group alerts by severity
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  // Send critical alerts first
  for (const alert of criticalAlerts) {
    await sendSlackAlert(alert);
    // Small delay between alerts to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Send warning alerts
  for (const alert of warningAlerts) {
    await sendSlackAlert(alert);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * Get alert severity color for UI
 */
export function getAlertColor(severity: 'warning' | 'critical'): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 border-red-300 text-red-800';
    case 'warning':
      return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    default:
      return 'bg-gray-100 border-gray-300 text-gray-800';
  }
}

/**
 * Get alert icon for UI
 */
export function getAlertIcon(severity: 'warning' | 'critical'): string {
  switch (severity) {
    case 'critical':
      return '🚨';
    case 'warning':
      return '⚠️';
    default:
      return 'ℹ️';
  }
}
