/**
 * Open Graph image generation using @vercel/og
 * Returns a 1200x630 PNG image for Twitter/Facebook
 */

import { NextRequest } from 'next/server';
import { ImageResponse } from '@vercel/og';
import { prisma } from '../../../lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    // Fetch insight data
    const insight = await prisma.insight.findUnique({
      where: { id },
      include: {
        creator: {
          select: { handle: true }
        }
      }
    });
    
    if (!insight) {
      // Return fallback image
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
              backgroundColor: '#1e40af',
              fontSize: 60,
              fontWeight: 700,
            }}
          >
            <div style={{ color: 'white' }}>PrediktFi</div>
            <div style={{ color: '#93c5fd', fontSize: 40, marginTop: 20 }}>
              Prediction Not Found
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }
    
    const probability = Math.round((insight.p || insight.probability || 0.5) * 100);
    const canonical = insight.canonical || insight.question || 'Prediction';
    const status = insight.status || 'OPEN';
    const isVerified = status === 'COMMITTED' || status === 'RESOLVED';
    
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
            backgroundColor: isVerified ? '#059669' : '#1e40af',
            padding: '40px',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: 'white',
                marginRight: '20px',
              }}
            >
              PrediktFi
            </div>
            {isVerified && (
              <div
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: 24,
                  color: 'white',
                }}
              >
                ✓ Verified
              </div>
            )}
          </div>
          
          {/* Probability Circle */}
          <div
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '100px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '40px',
              border: '4px solid rgba(255,255,255,0.3)',
            }}
          >
            <div
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: 'white',
              }}
            >
              {probability}%
            </div>
          </div>
          
          {/* Prediction Text */}
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              color: 'white',
              textAlign: 'center',
              maxWidth: '1000px',
              lineHeight: 1.2,
              marginBottom: '20px',
            }}
          >
            {canonical.length > 100 ? canonical.substring(0, 97) + '...' : canonical}
          </div>
          
          {/* Status */}
          <div
            style={{
              fontSize: 24,
              color: 'rgba(255,255,255,0.8)',
              textAlign: 'center',
            }}
          >
            Status: {status} • {isVerified ? 'On-Chain Verified' : 'Awaiting Commitment'}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
          'ETag': `"og-${id}-${status}"`,
        },
      }
    );
    
  } catch (error) {
    console.error('OG image generation failed:', error);
    
    // Return fallback image on error
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
            backgroundColor: '#ef4444',
            fontSize: 60,
            fontWeight: 700,
          }}
        >
          <div style={{ color: 'white' }}>PrediktFi</div>
          <div style={{ color: '#fecaca', fontSize: 40, marginTop: 20 }}>
            Error Generating Image
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
