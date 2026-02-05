import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applySecurityHeaders, generateCSP } from './lib/security/headers';
import { checkRateLimit } from './app/lib/ratelimit';

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Generate a unique nonce for each request (used for CSP)
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // Skip middleware for static files, Next.js internals, and auth routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/icon.svg') ||
    pathname.startsWith('/auth') || // Skip NextAuth routes (they have their own protection usually, but we might want to limit)
    pathname.startsWith('/api/auth') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Create response (moved down, but we need next() to be called later or initialized?) 
  // Rate checking doesn't need response object, just request.

  // Extract wallet ID early for rate limiting
  const walletId = request.headers.get('x-wallet-id') ||
    request.cookies.get('wallet_id')?.value ||
    request.nextUrl.searchParams.get('wallet');

  // --- RATE LIMITING ---
  // Only apply to API routes
  if (pathname.startsWith('/api/')) {
    let plan: 'free' | 'pro' | 'admin' | 'auth' | 'idea_eval_ip' | 'idea_eval_wallet' | 'image_gen' = 'free';

    if (pathname.includes('/idea-evaluator/evaluate')) {
      plan = walletId ? 'idea_eval_wallet' : 'idea_eval_ip';
    } else if (pathname.includes('/generate-image')) {
      plan = 'image_gen'; // Strict limit for images
    } else if (pathname.startsWith('/api/admin')) {
      plan = 'admin';
    } else if (pathname.includes('/auth') || pathname.includes('/login')) {
      plan = 'auth';
    }

    const rateLimitResponse = await checkRateLimit(request, {
      plan,
      identifier: walletId || undefined // Use wallet as identifier if available
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // Create response with nonce in request headers (for layout.tsx to read)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Apply security headers with nonce-based CSP
  applySecurityHeaders(response, nonce);

  // Add observability headers
  const duration = Date.now() - startTime;
  response.headers.set('X-Response-Time', `${duration}ms`);
  response.headers.set('X-Request-ID', crypto.randomUUID());

  // Add plan header for client-side detection
  const planCookie = request.cookies.get('predikt_plan')?.value;
  const plan = planCookie === 'pro' ? 'pro' : 'free';
  response.headers.set('x-plan', plan);

  // Add wallet identification header
  if (walletId) {
    response.headers.set('x-wallet-id', walletId);
  }

  // Add pathname header for server-side layout logic (fixes hydration mismatch)
  response.headers.set('x-pathname', pathname);

  // Add nonce header (for client-side access if needed)
  response.headers.set('x-nonce', nonce);

  // Log request for monitoring
  if (process.env.NODE_ENV === 'development') {
    // console.log(`${method} ${pathname} - ${duration}ms`);
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
