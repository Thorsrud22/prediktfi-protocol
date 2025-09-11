/**
 * Copy Trading Template API
 * GET /api/copy-trade/[templateId]
 * Retrieves a sanitized template for copying
 */

import { NextRequest, NextResponse } from 'next/server';
import { CopyTradingService, templateStorage } from '../../../../lib/intents/copy-trading';

export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const { templateId } = params;

    if (!CopyTradingService.isValidTemplateId(templateId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid template ID format'
      }, { status: 400 });
    }

    // Get template from storage
    const template = await templateStorage.get(templateId);

    if (!template) {
      return NextResponse.json({
        success: false,
        error: 'Template not found'
      }, { status: 404 });
    }

    if (!template.shareable) {
      return NextResponse.json({
        success: false,
        error: 'Template is not shareable'
      }, { status: 403 });
    }

    // Sanitize template for safe sharing
    const sanitizedTemplate = CopyTradingService.sanitizeTemplate(template);

    return NextResponse.json({
      success: true,
      template: sanitizedTemplate
    });

  } catch (error) {
    console.error('Failed to get copy trading template:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve template'
    }, { status: 500 });
  }
}
