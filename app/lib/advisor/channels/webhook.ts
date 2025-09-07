// app/lib/advisor/channels/webhook.ts
export interface NotificationPayload {
  target?: string;
  payload: any;
  ruleName: string;
}

export interface WebhookPayload {
  event: 'alert_fired';
  rule_name: string;
  rule_type: string;
  threshold: number;
  current_value: string;
  wallet_address: string;
  timestamp: string;
  alert_id: string;
}

export class WebhookChannel {
  async send(notification: NotificationPayload): Promise<boolean> {
    try {
      if (!notification.target) {
        console.warn('⚠️ No webhook URL provided');
        return false;
      }

      if (!this.isValidWebhookUrl(notification.target)) {
        console.warn('⚠️ Invalid webhook URL:', notification.target);
        return false;
      }

      const webhookPayload = this.generateWebhookPayload(notification);
      
      console.log('🔗 Webhook notification:', {
        url: notification.target,
        payload: webhookPayload
      });

      // Send webhook
      const success = await this.sendWebhook(notification.target, webhookPayload);
      
      return success;
    } catch (error) {
      console.error('❌ Error sending webhook notification:', error);
      return false;
    }
  }

  private generateWebhookPayload(notification: NotificationPayload): WebhookPayload {
    const { payload, ruleName } = notification;
    
    return {
      event: 'alert_fired',
      rule_name: ruleName,
      rule_type: payload.ruleType,
      threshold: payload.threshold,
      current_value: payload.currentValue,
      wallet_address: payload.walletAddress,
      timestamp: payload.timestamp,
      alert_id: `alert_${Date.now()}`
    };
  }

  private async sendWebhook(url: string, payload: WebhookPayload): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Predikt-Advisor/1.0',
          'X-Predikt-Event': 'alert_fired',
          'X-Predikt-Timestamp': new Date().toISOString()
        },
        body: JSON.stringify(payload),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        console.warn(`⚠️ Webhook returned ${response.status}: ${response.statusText}`);
        return false;
      }

      console.log(`✅ Webhook delivered successfully to ${url}`);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          console.warn(`⚠️ Webhook timeout for ${url}`);
        } else {
          console.warn(`⚠️ Webhook error for ${url}:`, error.message);
        }
      }
      return false;
    }
  }

  private isValidWebhookUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      
      // Only allow HTTPS URLs for security
      if (parsedUrl.protocol !== 'https:') {
        return false;
      }
      
      // Block localhost and private IPs
      if (parsedUrl.hostname === 'localhost' || 
          parsedUrl.hostname.startsWith('127.') ||
          parsedUrl.hostname.startsWith('192.168.') ||
          parsedUrl.hostname.startsWith('10.') ||
          parsedUrl.hostname.startsWith('172.')) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  // Test webhook connectivity
  async testWebhook(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isValidWebhookUrl(url)) {
        return { success: false, error: 'Invalid webhook URL' };
      }

      const testPayload: WebhookPayload = {
        event: 'alert_fired',
        rule_name: 'Test Rule',
        rule_type: 'test',
        threshold: 0,
        current_value: 'Test Value',
        wallet_address: 'test-wallet',
        timestamp: new Date().toISOString(),
        alert_id: 'test_alert'
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Predikt-Advisor/1.0',
          'X-Predikt-Event': 'test',
          'X-Predikt-Timestamp': new Date().toISOString()
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(5000) // 5 second timeout for tests
      });

      if (!response.ok) {
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}` 
        };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get webhook delivery statistics
  async getDeliveryStats(webhookUrl: string): Promise<{
    totalSent: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    lastDelivery: Date | null;
  }> {
    try {
      // In a real implementation, this would query the database
      // for delivery statistics for this webhook URL
      
      return {
        totalSent: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        lastDelivery: null
      };
    } catch (error) {
      console.error('❌ Error getting webhook stats:', error);
      return {
        totalSent: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        lastDelivery: null
      };
    }
  }
}
