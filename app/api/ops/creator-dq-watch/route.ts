/**
 * Creator Data Quality Watch Cron API
 * GET /api/ops/creator-dq-watch - Nightly data quality monitoring with Slack alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

export interface SlackMessage {
  text: string;
  blocks?: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
    fields?: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

export interface DataQualityViolation {
  creatorId: string;
  creatorIdHashed: string;
  field: string;
  value: any;
  expected: any;
  day: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface DataQualityReport {
  ok: boolean;
  violations: DataQualityViolation[];
  summary: {
    totalRecords: number;
    violationCount: number;
    errorCount: number;
    warningCount: number;
  };
  checkedAt: string;
}

/**
 * Verify HMAC signature for operations endpoint
 */
function verifyHMACSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(message: SlackMessage): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL not configured, skipping Slack notification');
    return false;
  }
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    if (!response.ok) {
      console.error(`Slack notification failed: ${response.status} ${response.statusText}`);
      return false;
    }
    
    console.log('✅ Slack notification sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending Slack notification:', error);
    return false;
  }
}

/**
 * Format violations for Slack message
 */
function formatViolationsForSlack(violations: DataQualityViolation[]): string {
  if (violations.length === 0) {
    return 'No violations found! 🎉';
  }
  
  // Group violations by severity
  const errors = violations.filter(v => v.severity === 'error');
  const warnings = violations.filter(v => v.severity === 'warning');
  
  let message = `🚨 *Data Quality Violations Found*\n\n`;
  
  if (errors.length > 0) {
    message += `*Errors (${errors.length}):*\n`;
    errors.slice(0, 10).forEach(violation => {
      message += `• \`${violation.creatorIdHashed}\` - ${violation.field}: ${violation.value} (expected: ${violation.expected})\n`;
    });
    
    if (errors.length > 10) {
      message += `• ... and ${errors.length - 10} more errors\n`;
    }
    message += '\n';
  }
  
  if (warnings.length > 0) {
    message += `*Warnings (${warnings.length}):*\n`;
    warnings.slice(0, 5).forEach(violation => {
      message += `• \`${violation.creatorIdHashed}\` - ${violation.field}: ${violation.value}\n`;
    });
    
    if (warnings.length > 5) {
      message += `• ... and ${warnings.length - 5} more warnings\n`;
    }
  }
  
  return message;
}

/**
 * Create Slack message blocks for rich formatting
 */
function createSlackBlocks(violations: DataQualityViolation[], summary: any): Array<any> {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🔍 CreatorDaily Data Quality Report'
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Total Records:* ${summary.totalRecords}`
        },
        {
          type: 'mrkdwn',
          text: `*Violations:* ${summary.violationCount}`
        },
        {
          type: 'mrkdwn',
          text: `*Errors:* ${summary.errorCount}`
        },
        {
          type: 'mrkdwn',
          text: `*Warnings:* ${summary.warningCount}`
        }
      ]
    }
  ];
  
  if (violations.length > 0) {
    // Add top 10 violations
    const topViolations = violations.slice(0, 10);
    const violationText = topViolations.map(v => 
      `• \`${v.creatorIdHashed}\` - ${v.field}: ${v.value} (expected: ${v.expected})`
    ).join('\n');
    
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Top ${Math.min(10, violations.length)} Violations:*\n${violationText}`
      }
    });
    
    if (violations.length > 10) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `... and ${violations.length - 10} more violations`
        }
      });
    }
  } else {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '✅ *No violations found!* All data quality checks passed.'
      }
    });
  }
  
  // Add timestamp
  blocks.push({
    type: 'context',
    text: {
      type: 'mrkdwn',
      text: `Checked at: ${new Date().toISOString()}`
    }
  });
  
  return blocks;
}

/**
 * Run data quality check and send Slack notification (with smart filtering)
 */
async function runDataQualityWatch(): Promise<{ success: boolean; violations: number; message: string }> {
  try {
    console.log('🔍 Starting nightly data quality watch...');
    
    // Call the data quality endpoint
    const baseUrl = process.env.PREDIKT_BASE_URL || 'http://localhost:3000';
    const dqUrl = `${baseUrl}/api/ops/creator-dq?days=7`;
    
    // Create HMAC signature for internal call
    const opsSecret = process.env.OPS_SECRET;
    if (!opsSecret) {
      throw new Error('OPS_SECRET not configured');
    }
    
    const signature = createHmac('sha256', opsSecret)
      .update('')
      .digest('hex');
    
    const response = await fetch(dqUrl, {
      method: 'GET',
      headers: {
        'x-ops-signature': signature,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Data quality check failed: ${response.status} ${response.statusText}`);
    }
    
    const report: DataQualityReport = await response.json();
    
    console.log(`📊 Data quality check completed: ${report.summary.violationCount} violations found`);
    
    // Smart filtering: Only send Slack notifications for significant issues
    const shouldNotify = shouldSendSlackNotification(report);
    
    if (shouldNotify) {
      // Create Slack message
      const slackMessage: SlackMessage = {
        text: report.ok 
          ? '✅ CreatorDaily data quality check passed - no violations found!'
          : `🚨 CreatorDaily data quality violations detected (${report.summary.violationCount} total)`,
        blocks: createSlackBlocks(report.violations, report.summary)
      };
      
      // Send Slack notification
      const slackSent = await sendSlackNotification(slackMessage);
      
      return {
        success: true,
        violations: report.summary.violationCount,
        message: `Data quality watch completed: ${report.summary.violationCount} violations found, Slack notification ${slackSent ? 'sent' : 'failed'}`
      };
    } else {
      console.log('📝 Data quality violations found but not significant enough for Slack notification');
      return {
        success: true,
        violations: report.summary.violationCount,
        message: `Data quality watch completed: ${report.summary.violationCount} violations found, no Slack notification sent (filtered)`
      };
    }
    
  } catch (error) {
    console.error('❌ Data quality watch failed:', error);
    
    // Only send error notifications for critical failures
    if (error instanceof Error && error.message.includes('OPS_SECRET')) {
      const errorMessage: SlackMessage = {
        text: `🚨 CreatorDaily data quality watch failed: ${error.message}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Critical Error:* Configuration issue detected`
            }
          }
        ]
      };
      
      await sendSlackNotification(errorMessage);
    }
    
    return {
      success: false,
      violations: -1,
      message: `Data quality watch failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Determine if Slack notification should be sent based on violation severity
 */
function shouldSendSlackNotification(report: DataQualityReport): boolean {
  // Always notify if there are critical errors
  if (report.summary.errorCount > 0) {
    return true;
  }
  
  // Only notify for warnings if there are many of them
  if (report.summary.warningCount > 10) {
    return true;
  }
  
  // Don't notify for small numbers of warnings
  if (report.summary.violationCount <= 5) {
    return false;
  }
  
  // Check for specific critical violations
  const criticalViolations = report.violations.filter(v => 
    v.field.includes('accuracy_brier_mismatch') || 
    v.field.includes('score_calculation_mismatch') ||
    v.severity === 'error'
  );
  
  if (criticalViolations.length > 0) {
    return true;
  }
  
  // Default: don't notify for minor issues
  return false;
}

export async function GET(request: NextRequest) {
  try {
    // Check for HMAC signature
    const signature = request.headers.get('x-ops-signature');
    const opsSecret = process.env.OPS_SECRET;
    
    if (!opsSecret) {
      console.error('OPS_SECRET not configured');
      return NextResponse.json(
        { error: 'Operations secret not configured' },
        { status: 500 }
      );
    }
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-ops-signature header' },
        { status: 401 }
      );
    }
    
    // Get request body for signature verification (empty for GET)
    const body = '';
    
    if (!verifyHMACSignature(body, signature, opsSecret)) {
      console.error('Invalid HMAC signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Run data quality watch
    const result = await runDataQualityWatch();
    
    const response = {
      success: result.success,
      violations: result.violations,
      message: result.message,
      checkedAt: new Date().toISOString()
    };
    
    console.log(`✅ Data quality watch completed: ${result.message}`);
    
    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Data quality watch error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: `Data quality watch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        checkedAt: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD(request: NextRequest) {
  try {
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Creator DQ watch health check failed:', error);
    return new NextResponse(null, { status: 503 });
  }
}
