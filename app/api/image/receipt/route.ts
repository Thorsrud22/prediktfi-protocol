/**
 * NEW BLOKK 3: SVG Receipt Generation
 * GET /api/image/receipt?id=<id> - Shareable receipt card
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID parameter required' },
        { status: 400 }
      );
    }

    const insight = await prisma.insight.findUnique({
      where: { id },
      include: {
        creator: {
          select: { handle: true }
        }
      }
    });

    if (!insight) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      );
    }

    // Generate SVG receipt
    const svg = generateReceiptSVG(insight);

    // Set caching headers - use content hash for proper cache invalidation
    const contentHash = crypto.createHash('md5').update(JSON.stringify({
      id: insight.id,
      canonical: insight.canonical || insight.question,
      probability: insight.p || insight.probability,
      status: insight.status,
      creator: insight.creator?.handle,
      updatedAt: insight.updatedAt
    })).digest('hex');
    const etag = `"${contentHash}"`;
    const requestEtag = request.headers.get('if-none-match');

    if (requestEtag === etag) {
      return new NextResponse(null, { status: 304 });
    }

    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'ETag': etag,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateReceiptSVG(insight: any): string {
  const canonical = insight.canonical || insight.question;
  const probability = Math.round((insight.p || insight.probability) * 100);
  const status = insight.status || 'OPEN';
  const creator = insight.creator?.handle || 'Anonymous';
  const publicUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://predikt.fi'}/i/${insight.id}`;

  // Generate QR code data (simplified - in production use a QR library)
  const qrData = `QR:${publicUrl}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="card" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#334155;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)" />
  
  <!-- Card -->
  <rect x="60" y="60" width="1080" height="510" rx="20" fill="url(#card)" stroke="#475569" stroke-width="2" />
  
  <!-- Header -->
  <text x="100" y="120" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="bold" fill="#f8fafc">
    PREDIKT RECEIPT
  </text>
  
  <!-- Status badge -->
  <rect x="100" y="140" width="${status === 'COMMITTED' ? '140' : '80'}" height="30" rx="15" fill="${status === 'COMMITTED' ? '#22c55e' : '#f59e0b'}" />
  <text x="${status === 'COMMITTED' ? '170' : '140'}" y="160" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">
    ${status}
  </text>
  
  <!-- Prediction text -->
  <text x="100" y="220" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600" fill="#e2e8f0">
    Prediction:
  </text>
  <text x="100" y="260" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#cbd5e1" text-anchor="start">
    ${canonical.length > 60 ? canonical.substring(0, 57) + '...' : canonical}
  </text>
  
  <!-- Probability -->
  <text x="100" y="320" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600" fill="#e2e8f0">
    Confidence: ${probability}%
  </text>
  
  <!-- Creator -->
  <text x="100" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#94a3b8">
    By: ${creator}
  </text>
  
  <!-- Date -->
  <text x="100" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#64748b">
    Created: ${new Date(insight.createdAt).toLocaleDateString()}
  </text>
  
  <!-- Consent -->
  <text x="100" y="450" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#64748b">
    Consent: ${new Date().toLocaleString()}
  </text>
  
  <!-- QR Code placeholder -->
  <rect x="900" y="200" width="180" height="180" fill="#f8fafc" rx="10" />
  <text x="990" y="300" font-family="monospace" font-size="12" fill="#1e293b" text-anchor="middle">
    QR CODE
  </text>
  <text x="990" y="320" font-family="monospace" font-size="10" fill="#64748b" text-anchor="middle">
    Scan to view
  </text>
  
  <!-- Footer -->
  <text x="600" y="540" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">
    predikt.fi - Proof Agent
  </text>
  
  <!-- Memo signature (if committed) -->
  ${insight.memoSig ? `
  <text x="100" y="480" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#64748b">
    Tx: ${insight.memoSig.substring(0, 20)}...
  </text>
  ` : ''}
</svg>`;
}
