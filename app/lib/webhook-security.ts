/**
 * Webhook security utilities for P2A v1
 * Implements HMAC signing, HTTPS validation, and delivery tracking
 */

import crypto from 'crypto';

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: number;
  id: string;
}

export interface WebhookDelivery {
  id: string;
  url: string;
  payload: WebhookPayload;
  signature: string;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'delivered' | 'failed';
  lastAttempt?: Date;
  error?: string;
}

export class WebhookSecurity {
  private hmacSecret: string;
  private maxAttempts: number = 3;
  private timeoutMs: number = 10000; // 10 seconds

  constructor(hmacSecret: string) {
    this.hmacSecret = hmacSecret;
  }

  /**
   * Validate webhook URL for security
   */
  validateWebhookUrl(url: string): { valid: boolean; error?: string } {
    try {
      const parsedUrl = new URL(url);
      
      // Only allow HTTPS in production
      if (process.env.NODE_ENV === 'production' && parsedUrl.protocol !== 'https:') {
        return {
          valid: false,
          error: 'Only HTTPS URLs are allowed in production'
        };
      }
      
      // Block localhost and private IPs in production
      if (process.env.NODE_ENV === 'production') {
        const hostname = parsedUrl.hostname;
        if (
          hostname === 'localhost' ||
          hostname.startsWith('127.') ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.')
        ) {
          return {
            valid: false,
            error: 'Private IP addresses are not allowed in production'
          };
        }
      }
      
      // Validate URL format
      if (!parsedUrl.hostname || !parsedUrl.pathname) {
        return {
          valid: false,
          error: 'Invalid URL format'
        };
      }
      
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid URL'
      };
    }
  }

  /**
   * Sign webhook payload with HMAC
   */
  signPayload(payload: WebhookPayload): string {
    const payloadString = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', this.hmacSecret)
      .update(payloadString)
      .digest('hex');
    
    return `sha256=${signature}`;
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.hmacSecret)
        .update(payload)
        .digest('hex');
      
      const providedSignature = signature.replace('sha256=', '');
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Create webhook payload
   */
  createPayload(event: string, data: any): WebhookPayload {
    return {
      event,
      data,
      timestamp: Date.now(),
      id: crypto.randomUUID()
    };
  }

  /**
   * Send webhook with security measures
   */
  async sendWebhook(delivery: WebhookDelivery): Promise<{
    success: boolean;
    statusCode?: number;
    error?: string;
  }> {
    try {
      // Validate URL
      const urlValidation = this.validateWebhookUrl(delivery.url);
      if (!urlValidation.valid) {
        return {
          success: false,
          error: urlValidation.error
        };
      }

      // Create payload
      const payload = this.createPayload(delivery.payload.event, delivery.payload.data);
      const signature = this.signPayload(payload);

      // Send webhook with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(delivery.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Predikt-Signature': signature,
          'X-Predikt-Event': payload.event,
          'X-Predikt-Timestamp': payload.timestamp.toString(),
          'User-Agent': 'Predikt-Webhook/1.0'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          success: true,
          statusCode: response.status
        };
      } else {
        return {
          success: false,
          statusCode: response.status,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout'
          };
        }
        return {
          success: false,
          error: error.message
        };
      }
      return {
        success: false,
        error: 'Unknown error'
      };
    }
  }

  /**
   * Retry webhook delivery with exponential backoff
   */
  async retryWebhookDelivery(
    delivery: WebhookDelivery,
    attempt: number = 1
  ): Promise<boolean> {
    if (attempt > this.maxAttempts) {
      return false;
    }

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, attempt - 1) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    const result = await this.sendWebhook(delivery);
    
    if (result.success) {
      return true;
    }

    // Log failure
    console.error(`Webhook delivery failed (attempt ${attempt}):`, {
      url: delivery.url,
      error: result.error,
      statusCode: result.statusCode
    });

    // Retry if not at max attempts
    if (attempt < this.maxAttempts) {
      return this.retryWebhookDelivery(delivery, attempt + 1);
    }

    return false;
  }

  /**
   * Log webhook delivery status
   */
  async logDeliveryStatus(
    delivery: WebhookDelivery,
    success: boolean,
    error?: string
  ): Promise<void> {
    const status = success ? 'delivered' : 'failed';
    
    console.log(`Webhook delivery ${status}:`, {
      id: delivery.id,
      url: delivery.url,
      event: delivery.payload.event,
      attempts: delivery.attempts,
      error
    });

    // In a real implementation, this would store in database
    // await prisma.webhookDelivery.create({
    //   data: {
    //     id: delivery.id,
    //     url: delivery.url,
    //     event: delivery.payload.event,
    //     status,
    //     attempts: delivery.attempts,
    //     error,
    //     deliveredAt: success ? new Date() : null
    //   }
    // });
  }
}

// Singleton instance
const webhookSecurity = new WebhookSecurity(
  process.env.WEBHOOK_HMAC_SECRET || 'default-secret-change-in-production'
);

export default webhookSecurity;
