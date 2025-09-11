import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { checkRateLimit } from '../../../../lib/ratelimit';
import { validateCreatorHandle, createSafeETag, sanitizeForDisplay } from '../../../../lib/url-validation';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    // Apply rate limiting for OG endpoint
    const rateLimitResponse = await checkRateLimit(request, {
      plan: 'free', // Use free plan rate limiter for unauthenticated requests
      skipForDevelopment: true
    });
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { handle } = await params;
    
    if (!handle) {
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #0b0b0c 0%, #1e1b4b 50%, #0d9488 100%)',
              color: 'white',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px' }}>
                Creator Not Found
              </div>
              <div style={{ fontSize: '20px', opacity: 0.8 }}>
                The creator profile you're looking for doesn't exist
              </div>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            'ETag': '"og-creator-not-found"',
            'Vary': 'Accept-Encoding, User-Agent',
          },
        }
      );
    }

    // Validate and sanitize handle
    const handleValidation = validateCreatorHandle(handle);
    if (!handleValidation.isValid) {
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #0b0b0c 0%, #1e1b4b 50%, #0d9488 100%)',
              color: 'white',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px' }}>
                Invalid Creator Handle
              </div>
              <div style={{ fontSize: '20px', opacity: 0.8 }}>
                {sanitizeForDisplay(handleValidation.error || 'Invalid handle format', 80)}
              </div>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
          headers: {
            'Cache-Control': 'public, max-age=300, s-maxage=300',
            'ETag': createSafeETag('invalid', 'og-creator'),
            'Vary': 'Accept-Encoding, User-Agent',
          },
        }
      );
    }

    const sanitizedHandle = handleValidation.sanitized!;

    // Try to fetch creator data using sanitized handle with timeout
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    let creatorData = null;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300); // 300ms timeout
      
      const response = await fetch(`${baseUrl}/api/public/creators/${encodeURIComponent(sanitizedHandle)}/score`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        creatorData = await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch creator data:', error);
      // Continue with fallback image generation
    }

    // Generate avatar initials from sanitized handle
    const initials = sanitizedHandle.charAt(0).toUpperCase();
    
    // Format score and accuracy with fallback values
    const score = creatorData?.score ? (creatorData.score * 100).toFixed(1) : '—';
    const accuracy = creatorData?.accuracy90d ? (creatorData.accuracy90d * 100).toFixed(1) : '—';
    const resolvedCount = creatorData?.counts?.resolved || 0;
    
    // Use fallback image if no data available
    const useFallback = !creatorData;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0b0b0c 0%, #1e1b4b 50%, #0d9488 100%)',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)',
            }}
          />
          
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '48px',
              maxWidth: '1000px',
              padding: '0 60px',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '64px',
                fontWeight: 'bold',
                color: 'white',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              }}
            >
              {initials}
            </div>
            
            {/* Content */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px' }}>
                @{sanitizedHandle}
              </div>
              <div style={{ fontSize: '24px', opacity: 0.9, marginBottom: '32px' }}>
                Creator Profile
              </div>
              
              {useFallback ? (
                /* Fallback content when data is not available */
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '16px' }}>
                    🔮
                  </div>
                  <div style={{ fontSize: '24px', opacity: 0.8, marginBottom: '8px' }}>
                    Creator Profile
                  </div>
                  <div style={{ fontSize: '18px', opacity: 0.6 }}>
                    Data temporarily unavailable
                  </div>
                </div>
              ) : (
                /* Stats when data is available */
                <div
                  style={{
                    display: 'flex',
                    gap: '48px',
                    fontSize: '20px',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#60a5fa' }}>
                      {score}%
                    </div>
                    <div style={{ opacity: 0.8 }}>Predikt Score</div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#34d399' }}>
                      {accuracy}%
                    </div>
                    <div style={{ opacity: 0.8 }}>90d Accuracy</div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#fbbf24' }}>
                      {resolvedCount}
                    </div>
                    <div style={{ opacity: 0.8 }}>Resolved</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Brand */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              right: '60px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '24px',
              fontWeight: 'bold',
            }}
          >
            <span>🔮</span>
            <span>PrediktFi</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': useFallback ? 's-maxage=60, stale-while-revalidate=600' : 'public, max-age=3600, s-maxage=3600',
          'ETag': createSafeETag(`${sanitizedHandle}-${useFallback ? 'fallback' : (creatorData?.lastUpdated || 'unknown')}`, 'creator'),
          'Vary': 'Accept-Encoding, User-Agent',
        },
      }
    );
  } catch (error) {
    console.error('OG image generation error:', error);
    
    // Return 200 with fallback image, not 500
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0b0b0c 0%, #1e1b4b 50%, #0d9488 100%)',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px' }}>
              🔮
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>
              Creator Profile
            </div>
            <div style={{ fontSize: '20px', opacity: 0.8 }}>
              Data temporarily unavailable
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 's-maxage=60, stale-while-revalidate=600',
          'ETag': '"og-creator-fallback"',
          'Vary': 'Accept-Encoding, User-Agent',
        },
      }
    );
  }
}
