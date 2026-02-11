/**
 * Security Headers & CSP Configuration
 */

import { NextResponse } from 'next/server';

/**
 * Content Security Policy configuration
 */
export const CSP_POLICY = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Fallback for older browsers
    "'unsafe-eval'",   // Required for Next.js in development
    'https://vercel.live',
    'https://*.posthog.com',
    'https://us.i.posthog.com'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled-components and CSS-in-JS
    'https://fonts.googleapis.com'
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https://*.dicebear.com',
    'https://api.dicebear.com',
    'https://vercel.com',
    'https://*.vercel.com',
    'https://*.posthog.com',
    'https://us.i.posthog.com'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com'
  ],
  'connect-src': [
    "'self'",
    'https://api.coingecko.com',
    'https://api.coincap.io',
    'https://vercel.live',
    'https://*.posthog.com',
    'https://us.i.posthog.com',
    'wss://ws.coincap.io'
  ],
  'frame-src': [
    "'none'"
  ],
  'object-src': [
    "'none'"
  ],
  'base-uri': [
    "'self'"
  ],
  'form-action': [
    "'self'"
  ],
  'frame-ancestors': [
    "'none'"
  ],
  'upgrade-insecure-requests': []
};

/**
 * Generate CSP header value
 * @param nonce - Optional cryptographic nonce for inline scripts (production only)
 */
export function generateCSP(nonce?: string): string {
  const isProduction = process.env.NODE_ENV === 'production';

  return Object.entries(CSP_POLICY)
    .map(([directive, sources]) => {
      let finalSources = [...sources];

      // Handle script-src directive
      if (directive === 'script-src') {
        // Always remove unsafe-eval in production
        if (isProduction) {
          finalSources = finalSources.filter(s => s !== "'unsafe-eval'");
        }

        // In production with nonce: replace 'unsafe-inline' with nonce + strict-dynamic
        if (isProduction && nonce) {
          finalSources = finalSources.filter(s => s !== "'unsafe-inline'");
          // Add nonce and strict-dynamic for better security
          // 'strict-dynamic' allows scripts loaded by trusted scripts
          // Keep 'unsafe-inline' as fallback for older browsers (ignored when nonce present)
          finalSources.push(`'nonce-${nonce}'`);
          finalSources.push("'strict-dynamic'");
          // Add additional allowed script sources
          finalSources.push('https://va.vercel-scripts.com');
        }
      }

      if (finalSources.length === 0) {
        return directive;
      }
      return `${directive} ${finalSources.join(' ')}`;
    })
    .join('; ');
}

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': generateCSP(),

  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // X-Frame-Options (backup for frame-ancestors)
  'X-Frame-Options': 'DENY',

  // X-Content-Type-Options
  'X-Content-Type-Options': 'nosniff',

  // X-XSS-Protection (Disabled in favor of CSP)
  'X-XSS-Protection': '0',

  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Permissions Policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()'
  ].join(', '),

  // Cross-Origin Policies
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

/**
 * Apply security headers to response
 * @param response - NextResponse to add headers to
 * @param nonce - Optional cryptographic nonce for CSP inline scripts
 */
export function applySecurityHeaders(response: NextResponse, nonce?: string): NextResponse {
  // Only apply HTTPS headers in production
  const isProduction = process.env.NODE_ENV === 'production';

  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    // Skip HTTPS-only headers in development
    if (!isProduction && key === 'Strict-Transport-Security') {
      return;
    }

    // Override CSP with nonce-based version if nonce provided
    if (key === 'Content-Security-Policy' && nonce) {
      response.headers.set(key, generateCSP(nonce));
      return;
    }

    response.headers.set(key, value);
  });

  return response;
}

// Rate limiting logic has been moved to app/lib/ratelimit.ts to use Upstash Redis
