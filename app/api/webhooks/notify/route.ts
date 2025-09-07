// app/api/webhooks/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { WebhookChannel } from '../../../lib/advisor/channels/webhook';
import { isFeatureEnabled } from '../../../lib/flags';

export async function POST(request: NextRequest) {
  // Check if alerts feature is enabled
  if (!isFeatureEnabled('ALERTS')) {
    return NextResponse.json({ error: 'Alerts feature not enabled' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { webhookUrl, payload, ruleName } = body;
    
    if (!webhookUrl || !payload || !ruleName) {
      return NextResponse.json({ 
        error: 'Missing required fields: webhookUrl, payload, ruleName' 
      }, { status: 400 });
    }

    // Initialize webhook channel
    const webhookChannel = new WebhookChannel();
    
    // Send webhook notification
    const success = await webhookChannel.send({
      target: webhookUrl,
      payload,
      ruleName
    });

    return NextResponse.json({
      success,
      message: success ? 'Webhook sent successfully' : 'Failed to send webhook'
    });

  } catch (error) {
    console.error('Error sending webhook notification:', error);
    return NextResponse.json(
      { error: 'Failed to send webhook notification' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Test webhook endpoint
  const { searchParams } = new URL(request.url);
  const webhookUrl = searchParams.get('url');
  
  if (!webhookUrl) {
    return NextResponse.json({ error: 'Webhook URL required' }, { status: 400 });
  }

  try {
    const webhookChannel = new WebhookChannel();
    const result = await webhookChannel.testWebhook(webhookUrl);
    
    return NextResponse.json({
      success: result.success,
      error: result.error
    });

  } catch (error) {
    console.error('Error testing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to test webhook' },
      { status: 500 }
    );
  }
}
