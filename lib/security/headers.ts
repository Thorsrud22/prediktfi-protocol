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
    "'unsafe-inline'", // Required for Next.js in development
    "'unsafe-eval'",   // Required for Next.js in development
    'https://vercel.live'
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
    'https://*.vercel.com'
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
 */
export function generateCSP(): string {
  return Object.entries(CSP_POLICY)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
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

  // X-XSS-Protection
  'X-XSS-Protection': '1; mode=block',

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
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Only apply HTTPS headers in production
  const isProduction = process.env.NODE_ENV === 'production';

  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    // Skip HTTPS-only headers in development
    if (!isProduction && key === 'Strict-Transport-Security') {
      return;
    }

    response.headers.set(key, value);
  });

  return response;
}

// Rate limiting logic has been moved to app/lib/ratelimit.ts to use Upstash Redis
