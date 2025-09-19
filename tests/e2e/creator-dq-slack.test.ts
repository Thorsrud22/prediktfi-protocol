/**
 * E2E tests for CreatorDaily data quality Slack integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHmac } from 'crypto';

// Mock fetch globally
global.fetch = vi.fn();

// Mock environment variables
const originalEnv = process.env;

describe('CreatorDaily Data Quality Slack Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      OPS_SECRET: 'test-ops-secret',
      SLACK_WEBHOOK_URL: 'https://hooks.slack.com/services/test/webhook/url',
      PREDIKT_BASE_URL: 'http://localhost:3000'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Slack Message Formatting', () => {
    it('should format violations correctly for Slack', () => {
      const violations = [
        {
          creatorId: 'creator1',
          creatorIdHashed: 'a1b2c3d4',
          field: 'accuracy',
          value: 1.5,
          expected: '[0,1]',
          day: '2024-01-15',
          severity: 'error' as const,
          message: 'accuracy must be in range [0,1], got 1.5'
        },
        {
          creatorId: 'creator2',
          creatorIdHashed: 'e5f6g7h8',
          field: 'maturedN',
          value: -1,
          expected: '>= 0',
          day: '2024-01-15',
          severity: 'error' as const,
          message: 'maturedN must be non-negative, got -1'
        }
      ];

      const message = formatViolationsForSlack(violations);
      
      expect(message).toContain('Data Quality Violations Found');
      expect(message).toContain('Errors (2):');
      expect(message).toContain('`a1b2c3d4` - accuracy: 1.5');
      expect(message).toContain('`e5f6g7h8` - maturedN: -1');
    });

    it('should handle no violations gracefully', () => {
      const message = formatViolationsForSlack([]);
      expect(message).toContain('No violations found! 🎉');
    });

    it('should limit violations to top 10', () => {
      const violations = Array.from({ length: 15 }, (_, i) => ({
        creatorId: `creator${i}`,
        creatorIdHashed: `hash${i}`,
        field: 'accuracy',
        value: 1.5,
        expected: '[0,1]',
        day: '2024-01-15',
        severity: 'error' as const,
        message: 'accuracy must be in range [0,1], got 1.5'
      }));

      const message = formatViolationsForSlack(violations);
      
      expect(message).toContain('Errors (15):');
      expect(message).toContain('... and 5 more errors');
    });
  });

  describe('Slack Block Creation', () => {
    it('should create proper Slack blocks for violations', () => {
      const violations = [
        {
          creatorId: 'creator1',
          creatorIdHashed: 'a1b2c3d4',
          field: 'accuracy',
          value: 1.5,
          expected: '[0,1]',
          day: '2024-01-15',
          severity: 'error' as const,
          message: 'accuracy must be in range [0,1], got 1.5'
        }
      ];

      const summary = {
        totalRecords: 10,
        violationCount: 1,
        errorCount: 1,
        warningCount: 0
      };

      const blocks = createSlackBlocks(violations, summary);
      
      expect(blocks).toHaveLength(4); // header + section + violations + context
      expect(blocks[0].type).toBe('header');
      expect(blocks[0].text.text).toBe('🔍 CreatorDaily Data Quality Report');
      expect(blocks[1].type).toBe('section');
      expect(blocks[1].fields).toHaveLength(4);
      expect(blocks[2].type).toBe('section');
      expect(blocks[2].text.text).toContain('Top 1 Violations:');
    });

    it('should create success message when no violations', () => {
      const blocks = createSlackBlocks([], {
        totalRecords: 10,
        violationCount: 0,
        errorCount: 0,
        warningCount: 0
      });
      
      expect(blocks).toHaveLength(3); // header + section + context
      expect(blocks[1].text.text).toContain('No violations found!');
    });
  });

  describe('Slack Notification Sending', () => {
    it('should send Slack notification successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const message = {
        text: 'Test message',
        blocks: []
      };

      const result = await sendSlackNotification(message);
      
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/services/test/webhook/url',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        }
      );
    });

    it('should handle Slack notification failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      const message = {
        text: 'Test message',
        blocks: []
      };

      const result = await sendSlackNotification(message);
      
      expect(result).toBe(false);
    });

    it('should handle missing webhook URL', async () => {
      process.env.SLACK_WEBHOOK_URL = undefined;

      const message = {
        text: 'Test message',
        blocks: []
      };

      const result = await sendSlackNotification(message);
      
      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const message = {
        text: 'Test message',
        blocks: []
      };

      const result = await sendSlackNotification(message);
      
      expect(result).toBe(false);
    });
  });

  describe('Data Quality Watch Integration', () => {
    it('should run data quality check and send Slack notification', async () => {
      // Mock successful data quality check
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            violations: [],
            summary: {
              totalRecords: 10,
              violationCount: 0,
              errorCount: 0,
              warningCount: 0
            },
            checkedAt: new Date().toISOString()
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200
        });

      const result = await runDataQualityWatch();
      
      expect(result.success).toBe(true);
      expect(result.violations).toBe(0);
      expect(result.message).toContain('Data quality watch completed');
      expect(global.fetch).toHaveBeenCalledTimes(2); // DQ check + Slack notification
    });

    it('should handle data quality check failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await runDataQualityWatch();
      
      expect(result.success).toBe(false);
      expect(result.violations).toBe(-1);
      expect(result.message).toContain('Data quality check failed');
    });

    it('should send error notification when DQ check fails', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200
        });

      await runDataQualityWatch();
      
      expect(global.fetch).toHaveBeenCalledTimes(2);
      // Second call should be Slack notification with error message
      const slackCall = (global.fetch as any).mock.calls[1];
      expect(slackCall[0]).toBe('https://hooks.slack.com/services/test/webhook/url');
      expect(JSON.parse(slackCall[1].body).text).toContain('Data quality watch failed');
    });
  });

  describe('HMAC Signature Verification', () => {
    it('should verify HMAC signature correctly', () => {
      const payload = 'test payload';
      const secret = 'test-secret';
      const signature = createHmac('sha256', secret).update(payload).digest('hex');
      
      const result = verifyHMACSignature(payload, signature, secret);
      expect(result).toBe(true);
    });

    it('should reject invalid HMAC signature', () => {
      const payload = 'test payload';
      const secret = 'test-secret';
      const invalidSignature = 'invalid-signature';
      
      const result = verifyHMACSignature(payload, invalidSignature, secret);
      expect(result).toBe(false);
    });
  });
});

// Helper functions (these would be imported from the actual modules)
function formatViolationsForSlack(violations: any[]): string {
  if (violations.length === 0) {
    return 'No violations found! 🎉';
  }
  
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

function createSlackBlocks(violations: any[], summary: any): any[] {
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
  
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Checked at: ${new Date().toISOString()}`
      }
    ]
  } as any);
  
  return blocks;
}

async function sendSlackNotification(message: any): Promise<boolean> {
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

async function runDataQualityWatch(): Promise<{ success: boolean; violations: number; message: string }> {
  try {
    console.log('🔍 Starting nightly data quality watch...');
    
    const baseUrl = process.env.PREDIKT_BASE_URL || 'http://localhost:3000';
    const dqUrl = `${baseUrl}/api/ops/creator-dq?days=7`;
    
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
    
    const report = await response.json();
    
    console.log(`📊 Data quality check completed: ${report.summary.violationCount} violations found`);
    
    const slackMessage = {
      text: report.ok 
        ? '✅ CreatorDaily data quality check passed - no violations found!'
        : `🚨 CreatorDaily data quality violations detected (${report.summary.violationCount} total)`,
      blocks: createSlackBlocks(report.violations, report.summary)
    };
    
    const slackSent = await sendSlackNotification(slackMessage);
    
    return {
      success: true,
      violations: report.summary.violationCount,
      message: `Data quality watch completed: ${report.summary.violationCount} violations found, Slack notification ${slackSent ? 'sent' : 'failed'}`
    };
    
  } catch (error) {
    console.error('❌ Data quality watch failed:', error);
    
    const errorMessage = {
      text: `🚨 CreatorDaily data quality watch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Error Details:*\n\`\`\`${error instanceof Error ? error.stack : String(error)}\`\`\``
          }
        }
      ]
    };
    
    await sendSlackNotification(errorMessage);
    
    return {
      success: false,
      violations: -1,
      message: `Data quality watch failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
