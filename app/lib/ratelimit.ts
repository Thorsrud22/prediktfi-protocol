/**
 * Rate limiting middleware using Upstash Redis
 * Provides different limits for FREE and PRO users
 */

import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { handler } from 'next/dist/build/templates/app-page';
import { number } from 'zod';

// Initialize Redis (fallback to in-memory for development)
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Rate limiters for different user tiers
const rateLimiters = redis ? {
  free: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 requests per minute
    analytics: true,
  }),
  pro: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    analytics: true,
  }),
  // Global rate limit for unauthenticated requests
  global: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
    analytics: true,
  }),
  // Advisor-specific rate limits (stricter for write operations)
  advisor_read: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 reads per minute
    analytics: true,
  }),
  advisor_write: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 writes per minute
    analytics: true,
  }),
  alerts: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 alert operations per minute
    analytics: true,
  }),
} : null;

export interface RateLimitOptions {
  identifier?: string; // Custom identifier (defaults to IP)
  plan?: 'free' | 'pro' | 'advisor_read' | 'advisor_write' | 'alerts'; // User plan or specific limiter
  skipForDevelopment?: boolean; // Skip rate limiting in development
}

/**
 * Apply rate limiting to a request
 * Returns null if request is allowed, NextResponse with 429 if rate limited
 */
export async function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions = {}
): Promise<NextResponse | null> {
  // Skip rate limiting in development if requested
  if (options.skipForDevelopment && process.env.NODE_ENV === 'development') {
    return null;
  }
  
  // Skip rate limiting if Redis is not available
  if (!rateLimiters) {
    return null;
  }
  
  try {
    // Determine identifier (IP address or custom)
    const identifier = options.identifier || 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown';
    
    // Select appropriate rate limiter
    const plan = options.plan || 'free';
    const ratelimiter = rateLimiters[plan];
    
    // Check rate limit
    const { success, limit, remaining, reset } = await ratelimiter.limit(identifier);
    
    // Add rate limit headers to response
    const headers = {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    };
    
    if (!success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `Too many requests. Limit: ${limit} requests per minute.`,
          retryAfter: Math.round((reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers
        }
      );
    }
    
    // Request allowed, but we can't easily add headers here
    // Headers will need to be added by the calling API route
    return null;
  } catch (error) {
    console.error('Rate limiting check failed:', error);
    // Don't fail the request if rate limiting fails
    return null;
  }
}

export async function getRateLimitInfo(
  identifier: string,
  plan: 'free' | 'pro' | 'advisor_read' | 'advisor_write' | 'alerts' = 'free'
): Promise<{
  limit: number;
  remaining: number;
  reset: number;
}> {
  try {
    if (!rateLimiters) {
      const defaultLimits = {
        pro: 100,
        advisor_read: 30,
        advisor_write: 10,
        alerts: 5,
        free: 20
      };
      const limit = defaultLimits[plan] || 20;
      return {
        limit,
        remaining: limit,
        reset: Date.now() + 60000 // 1 minute from now
      };
    }
    
    const ratelimiter = rateLimiters[plan];
    // This is a bit of a hack - we'd need to implement a separate check method
    const defaultLimits = {
      pro: 100,
      advisor_read: 30,
      advisor_write: 10,
      alerts: 5,
      free: 20
    };
    const limit = defaultLimits[plan] || 20;
    return {
      limit,
      remaining: limit,
      reset: Date.now() + 60000 // 1 minute from now
    };
  } catch (error) {
    console.error('Failed to get rate limit info:', error);
    return {
      limit: plan === 'pro' ? 100 : 20,
      remaining: plan === 'pro' ? 100 : 20,
      reset: Date.now() + 60000 // 1 minute from now
    };
  }
}
/**
 * Wrapper function for easy use in API routes
 */
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  options: RateLimitOptions = {}
): Promise<NextResponse> {
  // Check rate limit first
  const rateLimitResponse = await checkRateLimit(request, options);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  
  // Execute handler
  const response = await handler();
  
  // Add rate limit headers to successful responses
  try {
    const identifier = options.identifier || 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown';
    const info = await getRateLimitInfo(identifier, options.plan);
    
    response.headers.set('X-RateLimit-Limit', info.limit.toString());
    response.headers.set('X-RateLimit-Remaining', info.remaining.toString());
    response.headers.set('X-RateLimit-Reset', info.reset.toString());
  } catch (error) {
    // Don't fail if we can't add headers
    console.error('Failed to add rate limit headers:', error);
  }
  
  return response;
}
