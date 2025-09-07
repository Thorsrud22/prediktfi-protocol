/**
 * Intent embed page for iframe display
 * /embed/intent/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '../../../lib/flags';
import { prisma } from '../../../lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check if embed intent feature is enabled
  if (!isFeatureEnabled('EMBED_INTENT')) {
    return new NextResponse('Embed intent feature not enabled', { status: 403 });
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
      return new NextResponse('Intent not found', { status: 404 });
    }
    
    const latestReceipt = intent.receipts[0];
    
    // Generate HTML for iframe
    const html = generateEmbedHTML(intent, latestReceipt);
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'X-Frame-Options': 'ALLOWALL',
        'Cache-Control': 'public, max-age=60, s-maxage=300'
      }
    });
    
  } catch (error) {
    console.error('Embed intent page error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

function generateEmbedHTML(intent: any, receipt: any) {
  const statusColor = getStatusColor(receipt?.status);
  const statusIcon = getStatusIcon(receipt?.status);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Predikt Trade ${receipt?.status || 'Created'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #111827;
      background: transparent;
    }
    
    .embed-container {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      background: white;
      max-width: 320px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    
    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid ${statusColor.border};
      background: ${statusColor.bg};
      color: ${statusColor.text};
      font-size: 12px;
      font-weight: 500;
    }
    
    .side-badge {
      padding: 2px 6px;
      border-radius: 4px;
      background: ${intent.side === 'BUY' ? '#dcfce7' : '#fee2e2'};
      color: ${intent.side === 'BUY' ? '#166534' : '#991b1b'};
      font-size: 12px;
      font-weight: 500;
    }
    
    .trade-details {
      margin-bottom: 12px;
    }
    
    .trade-title {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }
    
    .trade-date {
      font-size: 12px;
      color: #6b7280;
    }
    
    .execution-details {
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
    }
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 4px;
    }
    
    .detail-label {
      color: #6b7280;
    }
    
    .detail-value {
      color: #111827;
      font-weight: 500;
    }
    
    .transaction-section {
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
      margin-top: 12px;
    }
    
    .transaction-label {
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    
    .transaction-hash {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .hash-code {
      font-size: 11px;
      font-family: monospace;
      background: #f3f4f6;
      padding: 4px 6px;
      border-radius: 4px;
      color: #111827;
    }
    
    .view-link {
      font-size: 11px;
      color: #3b82f6;
      text-decoration: none;
    }
    
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="embed-container">
    <!-- Header -->
    <div class="header">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="status-badge">
          ${statusIcon} ${receipt?.status || 'Created'}
        </span>
        <span class="side-badge">
          ${intent.side}
        </span>
      </div>
    </div>
    
    <!-- Trade Details -->
    <div class="trade-details">
      <div class="trade-title">
        ${JSON.parse(intent.sizeJson).value}% ${intent.base}/${intent.quote}
      </div>
      <div class="trade-date">
        ${formatDate(intent.createdAt)}
      </div>
      <div class="consent-timestamp">
        Consent: ${new Date().toLocaleString()}
      </div>
    </div>
    
    <!-- Execution Details -->
    ${receipt && receipt.status === 'executed' ? `
      <div class="execution-details">
        ${receipt.realizedPx ? `
          <div class="detail-row">
            <span class="detail-label">Price</span>
            <span class="detail-value">$${receipt.realizedPx.toFixed(2)}</span>
          </div>
        ` : ''}
        ${receipt.feesUsd ? `
          <div class="detail-row">
            <span class="detail-label">Fees</span>
            <span class="detail-value">$${receipt.feesUsd.toFixed(4)}</span>
          </div>
        ` : ''}
        ${receipt.slippageBps ? `
          <div class="detail-row">
            <span class="detail-label">Slippage</span>
            <span class="detail-value">${receipt.slippageBps} bps</span>
          </div>
        ` : ''}
      </div>
    ` : ''}
    
    <!-- Transaction Hash -->
    ${receipt?.txSig ? `
      <div class="transaction-section">
        <div class="transaction-label">Transaction</div>
        <div class="transaction-hash">
          <code class="hash-code">${receipt.txSig}</code>
          <a href="https://solscan.io/tx/${receipt.txSig}" target="_blank" class="view-link">
            View
          </a>
        </div>
      </div>
    ` : ''}
    
    <!-- Footer -->
    <div class="footer">
      <span>Powered by Predikt</span>
      <span>Jupiter</span>
    </div>
  </div>
</body>
</html>
  `;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'executed':
      return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
    case 'simulated':
      return { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' };
    case 'failed':
      return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
    default:
      return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'executed': return '✓';
    case 'simulated': return '📊';
    case 'failed': return '✗';
    default: return '?';
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
