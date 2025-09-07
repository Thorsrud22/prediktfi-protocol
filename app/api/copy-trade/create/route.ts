/**
 * Create Copy Trading Template API
 * POST /api/copy-trade/create
 * Creates a shareable template from an intent
 */

import { NextRequest, NextResponse } from 'next/server';
import { CopyTradingService, templateStorage } from '../../../lib/intents/copy-trading';
import { prisma } from '../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intentId, walletId } = body;

    if (!intentId || !walletId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: intentId, walletId'
      }, { status: 400 });
    }

    // Get the intent from database
    const intent = await prisma.intent.findUnique({
      where: { id: intentId }
    });

    if (!intent) {
      return NextResponse.json({
        success: false,
        error: 'Intent not found'
      }, { status: 404 });
    }

    // Verify ownership
    if (intent.walletId !== walletId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 403 });
    }

    // Create template
    const template = CopyTradingService.createTemplate(intent);
    
    // Save template
    await templateStorage.save(template);

    // Generate shareable URL
    const shareUrl = CopyTradingService.generateShareUrl(template.id);

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        shareUrl,
        createdAt: template.createdAt,
        side: template.side,
        rationale: template.rationale,
        confidence: template.confidence
      }
    });

  } catch (error) {
    console.error('Failed to create copy trading template:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create template'
    }, { status: 500 });
  }
}
