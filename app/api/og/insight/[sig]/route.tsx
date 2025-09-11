import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { colors, getCacheHeaders, truncateText, getProbabilityColor, getVerificationBadgeStyles, getWordmarkStyles, createCircularGaugePath } from '../../../../lib/og';
import { checkRateLimit } from '../../../../lib/ratelimit';
import { validateSignature, createSafeETag, sanitizeForDisplay } from '../../../../lib/url-validation';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting for OG endpoint
    const rateLimitResponse = await checkRateLimit(request, {
      plan: 'free', // Use free plan rate limiter for unauthenticated requests
      skipForDevelopment: true
    });
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const url = new URL(request.url);
    const sig = url.pathname.split('/').pop(); // Extract sig from path
    
    if (!sig) {
      return new Response('Missing signature parameter', { status: 400 });
    }

    // Validate signature format
    const sigValidation = validateSignature(sig);
    if (!sigValidation.isValid) {
      return new Response(sigValidation.error || 'Invalid signature format', { status: 400 });
    }

    // Fetch insight data with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    let insight;
    let verified = false;
    
    try {
      const baseUrl = request.url.includes('localhost') ? 'http://localhost:3000' : 'https://predikt.fi';
      const response = await fetch(`${baseUrl}/api/insights?sig=${encodeURIComponent(sigValidation.sanitized!)}`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'PrediktFi-OG/1.0',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        insight = data.insight;
        verified = true;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Failed to fetch insight:', error);
      
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
              background: colors.background,
              color: colors.text,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              position: 'relative'
            }}
          >
            {/* Main content */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '32px'
            }}>
              {/* Large logo */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '32px',
                fontWeight: 'bold',
                color: colors.text,
                opacity: 0.6
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: colors.surface,
                  marginRight: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px'
                }}>
                  🔮
                </div>
                Predikt
              </div>
              
              {/* Probability display */}
              <div style={{
                fontSize: '96px',
                fontWeight: 'bold',
                color: colors.textMuted,
                opacity: 0.7
              }}>
                p=–%
              </div>
              
              {/* Title */}
              <div style={{
                fontSize: '32px',
                fontWeight: '600',
                maxWidth: '800px',
                lineHeight: '1.3',
                opacity: 0.9
              }}>
                Insight Not Available
              </div>
            </div>
            
            {/* Bottom-right wordmark */}
            <div style={{
              position: 'absolute',
              bottom: '24px',
              right: '24px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                color: colors.text,
                opacity: 0.6
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: colors.surface,
                  marginRight: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px'
                }}>
                  🔮
                </div>
                Predikt
              </div>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        headers: {
          ...getCacheHeaders(),
          'ETag': createSafeETag(`${sigValidation.sanitized}-unverified`, 'og-insight'),
          'Vary': 'Accept-Encoding, User-Agent',
        },
        }
      );
    }

    // Extract and validate insight data
    const title = sanitizeForDisplay(insight?.question || 'Untitled Insight', 80);
    const rationale = sanitizeForDisplay(insight?.model || 'AI Prediction Insight', 200);
    const probability = Math.round((insight?.prob || 0) * 100);
    
    // Calculate circular gauge properties
    const gaugeSize = 160;
    const strokeWidth = 12;
    const radius = (gaugeSize - strokeWidth) / 2;
    const gauge = createCircularGaugePath(probability, radius);
    
    // Get verification badge styles
    const badgeStyles = getVerificationBadgeStyles(verified, 'md');
    
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
            background: colors.background,
            color: colors.text,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
            padding: '40px'
          }}
        >
          {/* Header with title and verification */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            maxWidth: '900px',
            textAlign: 'center'
          }}>
            {/* Title */}
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              lineHeight: '1.2',
              textAlign: 'center'
            }}>
              {title}
            </div>
            
            {/* Verification badge */}
            <div style={badgeStyles}>
              {verified ? 'VERIFIED' : 'UNVERIFIED'}
            </div>
          </div>
          
          {/* Main content area */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: '1000px',
            marginTop: '40px',
            gap: '60px'
          }}>
            {/* Left side - Probability gauge */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              {/* Circular gauge */}
              <div style={{
                width: `${gaugeSize}px`,
                height: `${gaugeSize}px`,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Background circle */}
                <svg
                  width={gaugeSize}
                  height={gaugeSize}
                  style={{ position: 'absolute', top: 0, left: 0 }}
                >
                  <circle
                    cx={gaugeSize / 2}
                    cy={gaugeSize / 2}
                    r={radius}
                    stroke={colors.border}
                    strokeWidth={strokeWidth}
                    fill="none"
                  />
                  <circle
                    cx={gaugeSize / 2}
                    cy={gaugeSize / 2}
                    r={radius}
                    stroke={gauge.color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={gauge.strokeDasharray}
                    strokeDashoffset={gauge.strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${gaugeSize / 2} ${gaugeSize / 2})`}
                  />
                </svg>
                
                {/* Center percentage text */}
                <div style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: gauge.color,
                  zIndex: 1
                }}>
                  p={probability}%
                </div>
              </div>
            </div>
            
            {/* Right side - Rationale */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{
                fontSize: '20px',
                fontWeight: '600',
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Model
              </div>
              <div style={{
                fontSize: '24px',
                lineHeight: '1.4',
                color: colors.text,
                opacity: 0.9
              }}>
                {rationale}
              </div>
            </div>
          </div>
          
          {/* Bottom-right wordmark */}
          <div style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
              color: colors.text,
              opacity: 0.6
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: colors.surface,
                marginRight: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}>
                🔮
              </div>
              Predikt
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          ...getCacheHeaders(),
          'ETag': createSafeETag(`${sigValidation.sanitized}-${verified ? 'verified' : 'unverified'}`, 'og-insight'),
          'Vary': 'Accept-Encoding, User-Agent',
        },
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    
    // Return a generic error image
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
            background: colors.background,
            color: colors.text,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            opacity: 0.7
          }}>
            🔮 Predikt
          </div>
          <div style={{
            fontSize: '24px',
            marginTop: '16px',
            opacity: 0.6
          }}>
            Something went wrong
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'ETag': createSafeETag('error', 'og'),
          'Vary': 'Accept-Encoding, User-Agent',
        },
      }
    );
  }
}
