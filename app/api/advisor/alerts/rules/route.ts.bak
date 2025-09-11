// app/api/advisor/alerts/rules/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '../../../../lib/flags';
import { prisma } from '../../../../lib/prisma';
import { checkRateLimit } from '../../../../lib/ratelimit';
import { validateCSRF, validateInput, AlertRuleSchema, sanitizeString } from '../../../../lib/security';

export interface AlertRule {
  id?: string;
  walletId: string;
  name: string;
  ruleJson: any;
  channel: 'inapp' | 'email' | 'webhook';
  target?: string;
  enabled: boolean;
}

export async function GET(request: NextRequest) {
  // Check if alerts feature is enabled
  if (!isFeatureEnabled('ALERTS')) {
    return NextResponse.json({ error: 'Alerts feature not enabled' }, { status: 403 });
  }

  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, { plan: 'advisor_read' });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('walletId');
    
    if (!walletId) {
      return NextResponse.json({ error: 'Wallet ID required' }, { status: 400 });
    }

    const rules = await prisma.alertRule.findMany({
      where: { walletId },
      include: {
        events: {
          orderBy: { firedAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: rules.map(rule => ({
        id: rule.id,
        walletId: rule.walletId,
        name: rule.name,
        ruleJson: JSON.parse(rule.ruleJson),
        channel: rule.channel,
        target: rule.target,
        enabled: rule.enabled,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
        recentEvents: rule.events.map(event => ({
          id: event.id,
          firedAt: event.firedAt,
          delivered: event.delivered,
          payload: JSON.parse(event.payloadJson)
        }))
      }))
    });

  } catch (error) {
    console.error('Error getting alert rules:', error);
    return NextResponse.json(
      { error: 'Failed to get alert rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Check if alerts feature is enabled
  if (!isFeatureEnabled('ALERTS')) {
    return NextResponse.json({ error: 'Alerts feature not enabled' }, { status: 403 });
  }

  // CSRF protection
  if (!validateCSRF(request)) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
  }

  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, { plan: 'advisor_write' });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    
    // Input validation
    const validation = validateInput(body, AlertRuleSchema);
    if (!validation.valid) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: validation.errors 
      }, { status: 400 });
    }
    
    const { walletId, name, ruleJson, channel, target, enabled = true } = body;
    
    // Sanitize inputs
    const sanitizedName = sanitizeString(name);
    const sanitizedTarget = target ? sanitizeString(target) : undefined;

    // Validate channel
    if (!['inapp', 'email', 'webhook'].includes(channel)) {
      return NextResponse.json({ 
        error: 'Invalid channel. Must be: inapp, email, or webhook' 
      }, { status: 400 });
    }

    // Validate target for email/webhook channels
    if ((channel === 'email' || channel === 'webhook') && !target) {
      return NextResponse.json({ 
        error: 'Target required for email and webhook channels' 
      }, { status: 400 });
    }

    // Check if wallet exists
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId }
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const rule = await prisma.alertRule.create({
      data: {
        walletId,
        name,
        ruleJson: JSON.stringify(ruleJson),
        channel,
        target,
        enabled
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: rule.id,
        walletId: rule.walletId,
        name: rule.name,
        ruleJson: JSON.parse(rule.ruleJson),
        channel: rule.channel,
        target: rule.target,
        enabled: rule.enabled,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      }
    });

  } catch (error) {
    console.error('Error creating alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to create alert rule' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // Check if alerts feature is enabled
  if (!isFeatureEnabled('ALERTS')) {
    return NextResponse.json({ error: 'Alerts feature not enabled' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, name, ruleJson, channel, target, enabled } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Rule ID required' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (ruleJson !== undefined) updateData.ruleJson = JSON.stringify(ruleJson);
    if (channel !== undefined) updateData.channel = channel;
    if (target !== undefined) updateData.target = target;
    if (enabled !== undefined) updateData.enabled = enabled;

    const rule = await prisma.alertRule.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: {
        id: rule.id,
        walletId: rule.walletId,
        name: rule.name,
        ruleJson: JSON.parse(rule.ruleJson),
        channel: rule.channel,
        target: rule.target,
        enabled: rule.enabled,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to update alert rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Check if alerts feature is enabled
  if (!isFeatureEnabled('ALERTS')) {
    return NextResponse.json({ error: 'Alerts feature not enabled' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Rule ID required' }, { status: 400 });
    }

    await prisma.alertRule.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Alert rule deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert rule' },
      { status: 500 }
    );
  }
}
