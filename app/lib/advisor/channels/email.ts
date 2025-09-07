// app/lib/advisor/channels/email.ts
export interface NotificationPayload {
  target?: string;
  payload: any;
  ruleName: string;
}

export class EmailChannel {
  async send(notification: NotificationPayload): Promise<boolean> {
    try {
      if (!notification.target) {
        console.warn('⚠️ No email target provided');
        return false;
      }

      // In a real implementation, this would:
      // 1. Use a service like SendGrid, AWS SES, or Resend
      // 2. Send formatted HTML email
      // 3. Handle bounces and delivery status
      
      const emailContent = this.generateEmailContent(notification);
      
      console.log('📧 Email notification:', {
        to: notification.target,
        subject: emailContent.subject,
        rule: notification.ruleName
      });

      // For now, we'll simulate email sending
      // In production, you'd use an actual email service
      await this.simulateEmailSend(notification.target, emailContent);
      
      return true;
    } catch (error) {
      console.error('❌ Error sending email notification:', error);
      return false;
    }
  }

  private generateEmailContent(notification: NotificationPayload): { subject: string; html: string; text: string } {
    const { payload, ruleName } = notification;
    
    const subject = `🚨 Predikt Alert: ${ruleName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
            .alert-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
            .button { background: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Predikt Alert</h1>
              <p>Your portfolio monitoring rule has been triggered</p>
            </div>
            <div class="content">
              <div class="alert-box">
                <h2>${ruleName}</h2>
                <p><strong>Rule Type:</strong> ${payload.ruleType}</p>
                <p><strong>Threshold:</strong> ${payload.threshold}%</p>
                <p><strong>Current Value:</strong> ${payload.currentValue}</p>
                <p><strong>Wallet:</strong> ${payload.walletAddress}</p>
                <p><strong>Time:</strong> ${new Date(payload.timestamp).toLocaleString()}</p>
              </div>
              
              <p>This alert was triggered because your portfolio met the conditions you set up in Predikt Advisor.</p>
              
              <p>
                <a href="https://predikt.fi/advisor" class="button">View Portfolio</a>
                <a href="https://predikt.fi/advisor/alerts" class="button" style="margin-left: 10px;">Manage Alerts</a>
              </p>
              
              <div class="footer">
                <p>This is an automated message from Predikt Advisor.</p>
                <p>You can manage your alerts at <a href="https://predikt.fi/advisor/alerts">predikt.fi/advisor/alerts</a></p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const text = `
      Predikt Alert: ${ruleName}
      
      Your portfolio monitoring rule has been triggered:
      
      Rule Type: ${payload.ruleType}
      Threshold: ${payload.threshold}%
      Current Value: ${payload.currentValue}
      Wallet: ${payload.walletAddress}
      Time: ${new Date(payload.timestamp).toLocaleString()}
      
      View your portfolio: https://predikt.fi/advisor
      Manage alerts: https://predikt.fi/advisor/alerts
      
      This is an automated message from Predikt Advisor.
    `;
    
    return { subject, html, text };
  }

  private async simulateEmailSend(email: string, content: { subject: string; html: string; text: string }): Promise<void> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In production, you'd use an actual email service:
    // await emailService.send({
    //   to: email,
    //   subject: content.subject,
    //   html: content.html,
    //   text: content.text
    // });
  }

  // Validate email address format
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Check if email is in bounce list
  async isBounced(email: string): Promise<boolean> {
    // In a real implementation, you'd check against your bounce list
    return false;
  }
}
