/**
 * Open Graph Image API for Intent Embeds
 * GET /api/og/intent/[id]
 * Generates dynamic OG images for social sharing
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { isFeatureEnabled } from '../../../../../lib/flags';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if embed intent feature is enabled
    if (!isFeatureEnabled('EMBED_INTENT')) {
      return new NextResponse('Embed intent feature not enabled', { status: 403 });
    }

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
      return new NextResponse('Intent not found', { status: 404 });
    }
    
    const latestReceipt = intent.receipts[0];
    const status = latestReceipt?.status || 'created';
    
    // Generate SVG image
    const svg = generateOGImage(intent, latestReceipt, status);
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300, s-maxage=600'
      }
    });
    
  } catch (error) {
    console.error('OG image generation error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

function generateOGImage(intent: any, receipt: any, status: string) {
  const statusColor = getStatusColor(status);
  const statusIcon = getStatusIcon(status);
  const sizeJson = JSON.parse(intent.sizeJson);
  
  return `
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#gradient)"/>
  
  <!-- Gradient Definition -->
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
    </linearGradient>
    
    <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0.05" />
    </linearGradient>
  </defs>
  
  <!-- Main Card -->
  <rect x="60" y="60" width="1080" height="510" rx="24" fill="url(#cardGradient)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
  
  <!-- Header -->
  <text x="120" y="140" font-family="Inter, system-ui, sans-serif" font-size="48" font-weight="700" fill="#ffffff">
    Predikt Trade Intent
  </text>
  
  <!-- Trade Details -->
  <text x="120" y="200" font-family="Inter, system-ui, sans-serif" font-size="32" font-weight="600" fill="#e2e8f0">
    ${intent.side} ${intent.base}/${intent.quote}
  </text>
  
  <!-- Size and Status -->
  <text x="120" y="250" font-family="Inter, system-ui, sans-serif" font-size="24" fill="#94a3b8">
    ${sizeJson.value}% position • ${status.toUpperCase()}
  </text>
  
  <!-- Status Badge -->
  <rect x="120" y="280" width="120" height="40" rx="20" fill="${statusColor}"/>
  <text x="180" y="305" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="600" fill="#ffffff" text-anchor="middle">
    ${statusIcon} ${status.toUpperCase()}
  </text>
  
  <!-- Rationale -->
  <text x="120" y="360" font-family="Inter, system-ui, sans-serif" font-size="20" fill="#cbd5e1" font-weight="400">
    ${intent.rationale ? intent.rationale.substring(0, 80) + '...' : 'No rationale provided'}
  </text>
  
  <!-- Confidence -->
  <text x="120" y="410" font-family="Inter, system-ui, sans-serif" font-size="18" fill="#94a3b8">
    Confidence: ${Math.round((intent.confidence || 0) * 100)}%
  </text>
  
  <!-- Footer -->
  <text x="120" y="520" font-family="Inter, system-ui, sans-serif" font-size="16" fill="#64748b">
    Powered by Predikt • Jupiter Protocol
  </text>
  
  <!-- Logo/Brand -->
  <circle cx="1000" cy="150" r="40" fill="#3b82f6"/>
  <text x="1000" y="160" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="700" fill="#ffffff" text-anchor="middle">
    P
  </text>
  
  <!-- Decorative Elements -->
  <circle cx="1000" cy="400" r="80" fill="rgba(59, 130, 246, 0.1)"/>
  <circle cx="1000" cy="400" r="40" fill="rgba(59, 130, 246, 0.2)"/>
</svg>`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'executed': return '#10b981';
    case 'simulated': return '#3b82f6';
    case 'failed': return '#ef4444';
    default: return '#6b7280';
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'executed': return '✓';
    case 'simulated': return '📊';
    case 'failed': return '✗';
    default: return '?';
  }
}
