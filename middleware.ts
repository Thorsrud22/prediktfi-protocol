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

export async function middleware(request: NextRequest) {
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

  // ============================================
  // ACCESS GATE: RESTORED
  // ============================================

  // Define protected routes that require an access token
  const isProtectedRoute =
    pathname.startsWith('/studio') ||
    pathname.includes('/idea-evaluator/') ||
    pathname.startsWith('/api/studio') ||
    pathname.startsWith('/api/idea-evaluator');

  // Check for access token
  const hasAccessToken = request.cookies.get('predikt_access')?.value;
  const hasStatusCookie = request.cookies.get('predikt_auth_status')?.value;

  if (isProtectedRoute) {
    // If no access token, redirect to home or return 401
    if (!hasAccessToken) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Invite code required' },
          { status: 401 }
        );
      } else {
        // For page visits, redirect to home (or request access page)
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }
  }

  // Create response
  const response = NextResponse.next();

  // We only set this if we are confident they are logged in. 
  // Above we have a block that verifies the token. Ideally we'd pass a flag down.
  // But checking existence of access token here is a decent proxy since invalid ones are stripped above.
  if (hasAccessToken && !hasStatusCookie) {
    response.cookies.set('predikt_auth_status', '1', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
  }

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