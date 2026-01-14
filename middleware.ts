/**
 * Next.js Middleware for Security Headers, Rate Limiting & Observability
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applySecurityHeaders, rateLimiters, abuseDetector } from './lib/security/headers';

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';

  // For authenticated requests, could use user ID instead
  const userId = request.headers.get('x-user-id');

  return userId || ip;
}

/**
 * Check if request should be rate limited
 */
function checkRateLimit(request: NextRequest, identifier: string): boolean {
  const pathname = request.nextUrl.pathname;

  // Different rate limits for different endpoint types
  if (pathname.includes('/idea-evaluator/evaluate')) {
    return rateLimiters.ideaGeneration.isRateLimited(identifier);
  }

  if (pathname.startsWith('/api/admin')) {
    return rateLimiters.admin.isRateLimited(identifier);
  }

  if (pathname.includes('/auth') || pathname.includes('/login')) {
    return rateLimiters.auth.isRateLimited(identifier);
  }

  if (pathname.startsWith('/api/')) {
    return rateLimiters.api.isRateLimited(identifier);
  }

  return false;
}

/**
 * Record request for rate limiting
 */
function recordRequest(request: NextRequest, identifier: string): void {
  const pathname = request.nextUrl.pathname;

  if (pathname.includes('/idea-evaluator/evaluate')) {
    rateLimiters.ideaGeneration.recordRequest(identifier);
  } else if (pathname.startsWith('/api/admin')) {
    rateLimiters.admin.recordRequest(identifier);
  } else if (pathname.includes('/auth') || pathname.includes('/login')) {
    rateLimiters.auth.recordRequest(identifier);
  } else if (pathname.startsWith('/api/')) {
    rateLimiters.api.recordRequest(identifier);
  }
}

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  const identifier = getClientIdentifier(request);

  // Skip middleware for static files, Next.js internals, and auth routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/icon.svg') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Skip rate limiting in development
  if (process.env.NODE_ENV !== 'development') {
    // Check rate limiting
    if (checkRateLimit(request, identifier)) {
      console.log(`🚨 Rate limit exceeded for ${identifier} on ${pathname}`);

      // Log abuse event
      abuseDetector.logAbuseEvent({
        type: 'rate_limit',
        identifier,
        endpoint: pathname,
        details: {
          method,
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });

      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. To protect our free AI service, we limit evaluations per hour. Please try again later.',
          retryAfter: 3600 // 1 hour
        },
        {
          status: 429,
          headers: {
            'Retry-After': '3600',
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Date.now() + 60 * 60 * 1000)
          }
        }
      );
    }
  }

  // Record request for rate limiting (only in production)
  if (process.env.NODE_ENV !== 'development') {
    recordRequest(request, identifier);
  }

  // Create response
  const response = NextResponse.next();

  // Apply security headers
  applySecurityHeaders(response);

  // Add observability headers
  const duration = Date.now() - startTime;
  response.headers.set('X-Response-Time', `${duration}ms`);
  response.headers.set('X-Request-ID', crypto.randomUUID());

  // Add plan header for client-side detection
  const planCookie = request.cookies.get('predikt_plan')?.value;
  const plan = planCookie === 'pro' ? 'pro' : 'free';
  response.headers.set('x-plan', plan);

  // Add wallet identification header
  const walletId = request.headers.get('x-wallet-id') ||
    request.cookies.get('wallet_id')?.value ||
    request.nextUrl.searchParams.get('wallet');
  if (walletId) {
    response.headers.set('x-wallet-id', walletId);
  }

  // Add rate limit headers
  if (pathname.startsWith('/api/')) {
    const limiter = pathname.includes('/idea-evaluator/evaluate') ? rateLimiters.ideaGeneration :
      pathname.startsWith('/api/admin') ? rateLimiters.admin :
        pathname.includes('/auth') ? rateLimiters.auth :
          rateLimiters.api;

    const remaining = limiter.getRemainingRequests(identifier);
    response.headers.set('X-RateLimit-Remaining', String(remaining));
  }

  // Log request for monitoring
  if (process.env.NODE_ENV === 'development') {
    console.log(`${method} ${pathname} - ${identifier} - ${duration}ms`);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/public/signals (signals API - completely excluded for performance)
     * - creator/.* (creator routes - excluded to prevent middleware interference)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/public/signals|creator/.*).*)',
  ],
};