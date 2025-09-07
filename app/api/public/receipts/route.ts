/**
 * Public receipts API endpoint
 * GET /api/public/receipts
 * Returns executed receipts with ETag caching and cursor pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 items
    
    // Build where clause for executed receipts only
    const whereClause: any = {
      status: 'executed',
      txSig: { not: null } // Only receipts with transaction signatures
    };
    
    // Add cursor for pagination
    if (cursor) {
      whereClause.createdAt = {
        lt: new Date(cursor)
      };
    }
    
    // Get receipts with intent data
    const receipts = await prisma.intentReceipt.findMany({
      where: whereClause,
      include: {
        intent: {
          select: {
            id: true,
            base: true,
            quote: true,
            side: true,
            sizeJson: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1 // Take one extra to check if there are more
    });
    
    // Check if there are more items
    const hasMore = receipts.length > limit;
    const items = hasMore ? receipts.slice(0, limit) : receipts;
    
    // Transform to response format
    const responseItems = items.map(receipt => {
      const sizeData = JSON.parse(receipt.intent.sizeJson);
      const pnl = receipt.realizedPx && receipt.intent.side === 'BUY' 
        ? ((receipt.realizedPx - 1) * 100).toFixed(2) + '%' // Simplified PnL calculation
        : undefined;
      
      return {
        id: receipt.id,
        pair: `${receipt.intent.base}/${receipt.intent.quote}`,
        side: receipt.intent.side,
        size: `${sizeData.value}${sizeData.type === 'pct' ? '%' : ''}`,
        txSig: receipt.txSig,
        ts: receipt.createdAt.toISOString(),
        pnl
      };
    });
    
    // Prepare response data
    const responseData = {
      items: responseItems,
      nextCursor: hasMore ? items[items.length - 1].createdAt.toISOString() : null
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
          'Cache-Control': 'public, max-age=30, s-maxage=60'
        }
      });
    }
    
    // Return response with ETag
    return NextResponse.json(responseData, {
      headers: {
        'ETag': etag,
        'Cache-Control': 'public, max-age=30, s-maxage=60',
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Public receipts API error:', error);
    return NextResponse.json(
      { error: 'Failed to get receipts' },
      { status: 500 }
    );
  }
}
