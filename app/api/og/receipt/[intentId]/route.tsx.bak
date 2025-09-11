/**
 * Receipt OG Image Generator
 * /api/og/receipt/[intentId]
 * Generates Open Graph images for receipt sharing
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { intentId: string } }
) {
  try {
    const { intentId } = params;

    // Get receipt data
    const receipt = await prisma.intentReceipt.findFirst({
      where: { intentId },
      orderBy: { createdAt: 'desc' }
    });

    if (!receipt) {
      return new Response('Receipt not found', { status: 404 });
    }

    const simData = receipt.simJson ? JSON.parse(receipt.simJson) : {};
    const isSuccessful = receipt.status === 'simulated' || receipt.status === 'executed';
    const isExecuted = receipt.status === 'executed';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: 'system-ui',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                marginRight: '20px',
              }}
            >
              {isSuccessful ? '✅' : '❌'}
            </div>
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              Predikt Protocol
            </div>
          </div>

          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '40px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              maxWidth: '600px',
              width: '90%',
            }}
          >
            {/* Trade Info */}
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              {simData.side || 'BUY'} SOL/USDC
            </div>

            {/* Status Badge */}
            <div
              style={{
                backgroundColor: isSuccessful ? '#10b981' : '#ef4444',
                color: 'white',
                padding: '8px 24px',
                borderRadius: '20px',
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '30px',
              }}
            >
              {receipt.status.toUpperCase()}
            </div>

            {/* Performance Metrics */}
            {simData.performance && (
              <div
                style={{
                  display: 'flex',
                  gap: '40px',
                  marginBottom: '30px',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: simData.performance.expectedReturn > 0 ? '#10b981' : '#ef4444',
                    }}
                  >
                    {simData.performance.expectedReturn > 0 ? '+' : ''}
                    {simData.performance.expectedReturn?.toFixed(1)}%
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: '#6b7280',
                    }}
                  >
                    Expected Return
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#3b82f6',
                    }}
                  >
                    {Math.round((simData.confidence || 0.8) * 100)}%
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: '#6b7280',
                    }}
                  >
                    Confidence
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#1f2937',
                    }}
                  >
                    {simData.sizePct || 'N/A'}%
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: '#6b7280',
                    }}
                  >
                    Position Size
                  </div>
                </div>
              </div>
            )}

            {/* Strategy Preview */}
            {simData.rationale && (
              <div
                style={{
                  fontSize: '16px',
                  color: '#4b5563',
                  textAlign: 'center',
                  lineHeight: '1.5',
                  maxWidth: '500px',
                  marginBottom: '30px',
                }}
              >
                {simData.rationale.length > 100 
                  ? simData.rationale.substring(0, 100) + '...'
                  : simData.rationale
                }
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                color: '#6b7280',
              }}
            >
              <div>Intent ID: {intentId.slice(0, 8)}...</div>
              <div>•</div>
              <div>predikt.fi</div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Failed to generate OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
