import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

interface InsightData {
  question: string;
  prob: number;
  model: string;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sig = searchParams.get('sig');
    
    if (!sig) {
      return new Response('Missing signature parameter', { status: 400 });
    }

    // Fetch insight data server-side
    const baseUrl = request.url.includes('localhost') ? 'http://localhost:3000' : 'https://predikt.fi';
    const cluster = searchParams.get('cluster') || 'devnet'; // Allow cluster override
    
    let insight: InsightData | null = null;
    let verified = false;
    
    // TODO: Implement insight lookup without internal fetch to prevent recursion
    // For now, use fallback data to prevent server crashes
    console.warn('OG route using fallback data to prevent server crashes');
    
    // Mock insight data based on sig parameter
    insight = {
      question: `AI Prediction ${sig.substring(0, 8)}...`,
      prob: 0.7, // Default probability
      model: 'AI Baseline'
    };
    verified = false;

    // Prepare content
    const title = insight?.question || 'AI Prediction Insight';
    const probability = insight?.prob ? Math.round(insight.prob * 100) : 50;
    const model = insight?.model || 'AI Model';
    const status = verified ? 'Verified on-chain' : 'Verification pending';
    const clusterLabel = cluster === 'mainnet-beta' ? 'Mainnet' : 'Devnet';
    
    // Truncate question if too long
    const displayTitle = title.length > 80 ? title.substring(0, 77) + '...' : title;

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
            background: 'linear-gradient(135deg, #1e1b4b 0%, #7c3aed 50%, #2563eb 100%)',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '40px',
            fontSize: '32px',
            fontWeight: 'bold'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', lineHeight: '1.1' }}>Predikt</div>
              <div style={{ fontSize: '14px', opacity: 0.8, letterSpacing: '2px', textTransform: 'uppercase' }}>AI Studio</div>
            </div>
          </div>

          {/* Main probability display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px'
          }}>
            {/* Circular gauge background */}
            <div style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              border: '8px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              {/* Central probability */}
              <div style={{
                fontSize: '64px',
                fontWeight: 'bold',
                color: probability > 50 ? '#10b981' : '#ef4444'
              }}>
                {probability}%
              </div>
            </div>
          </div>

          {/* Question */}
          <div style={{
            fontSize: '28px',
            fontWeight: '600',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: '1.3',
            marginBottom: '32px',
            opacity: '0.95'
          }}>
            {displayTitle}
          </div>

          {/* Metadata */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            fontSize: '18px',
            opacity: '0.8'
          }}>
            <div style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              {model}
            </div>
            <div style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              {clusterLabel}
            </div>
            <div style={{
              padding: '8px 16px',
              background: verified ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
              borderRadius: '20px',
              border: `1px solid ${verified ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: verified ? '#10b981' : '#ef4444'
            }}>
              {status}
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
    console.error('OG Image generation error:', error);
    
    // Fallback image on error
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #7c3aed 100%)',
            color: 'white',
            fontSize: '48px',
            fontWeight: 'bold',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Predikt • AI Insights
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
