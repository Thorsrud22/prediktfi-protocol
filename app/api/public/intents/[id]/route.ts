/**
 * Public intent status API endpoint
 * GET /api/public/intents/[id]
 * Returns intent status with ETag caching
 */

import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '../../../lib/flags';
import { prisma } from '../../../lib/prisma';
import crypto from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check if embed intent feature is enabled
  if (!isFeatureEnabled('EMBED_INTENT')) {
    return NextResponse.json({ error: 'Embed intent feature not enabled' }, { status: 403 });
  }

  try {
    const intentId = params.id;
    
    // Get intent with latest receipt
    const intent = await prisma.intent.findUnique({
      where: { id: intentId },
      include: {
        receipts: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (!intent) {
      return NextResponse.json({ 
        error: 'Intent not found' 
      }, { status: 404 });
    }
    
    // Prepare response data
    const latestReceipt = intent.receipts[0];
    const responseData = {
      id: intent.id,
      base: intent.base,
      quote: intent.quote,
      side: intent.side,
      status: latestReceipt?.status || 'created',
      createdAt: intent.createdAt,
      confidence: intent.confidence,
      backtestWin: intent.backtestWin,
      expectedDur: intent.expectedDur,
      rationale: intent.rationale,
      latestReceipt: latestReceipt ? {
        id: latestReceipt.id,
        status: latestReceipt.status,
        txSig: latestReceipt.txSig,
        realizedPx: latestReceipt.realizedPx,
        feesUsd: latestReceipt.feesUsd,
        slippageBps: latestReceipt.slippageBps,
        blockTime: latestReceipt.blockTime,
        createdAt: latestReceipt.createdAt
      } : null
    };
    
    // Generate ETag
    const dataString = JSON.stringify(responseData);
    const etag = crypto.createHash('md5').update(dataString).digest('hex');
    
    // Check if client has cached version
    const clientEtag = request.headers.get('if-none-match');
    if (clientEtag === etag) {
      return new NextResponse(null, { 
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=60, s-maxage=300'
        }
      });
    }
    
    // Return response with ETag
    return NextResponse.json(responseData, {
      headers: {
        'ETag': etag,
        'Cache-Control': 'public, max-age=60, s-maxage=300',
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Public intent API error:', error);
    return NextResponse.json(
      { error: 'Failed to get intent status' },
      { status: 500 }
    );
  }
}
