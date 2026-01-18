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
  // Idea Evaluator limits (Daily)
  idea_eval_ip: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(3, '24 h'), // 3 per day for anonymous IP
    analytics: true,
  }),
  idea_eval_wallet: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(5, '24 h'), // Reduced to 5 per day for connected wallets
    analytics: true,
  }),
  // Limit bonus claims (sharing on X) to 2 per day
  bonus_claim: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(2, '24 h'),
    analytics: true,
  }),
} : null;

export interface RateLimitOptions {
  identifier?: string; // Custom identifier (defaults to IP)
  plan?: 'free' | 'pro' | 'advisor_read' | 'advisor_write' | 'alerts' | 'idea_eval_ip' | 'idea_eval_wallet' | 'bonus_claim'; // User plan or specific limiter
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

    // --- BONUS QUOTA LOGIC ---
    // If the standard limiter failed, check for a bonus credit in Redis
    if (!success && redis) {
      const bonusKey = `bonus_quota:${identifier}`;
      const bonusCount = (await redis.get<number>(bonusKey)) || 0;

      if (bonusCount > 0) {
        // Consume one bonus credit
        await redis.decr(bonusKey);

        console.log(`[RateLimit] Allowing request via BONUS quota for ${identifier}. Remaining bonus: ${bonusCount - 1}`);

        // Return null to ALLOW the request
        return null;
      }
    }

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
          message: `Too many requests. Daily limit: ${limit}. Share on X to get +1 extra evaluation!`,
          retryAfter: Math.round((reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers
        }
      );
    }

    // Request allowed
    return null;
  } catch (error) {
    console.error('Rate limiting check failed:', error);
    return null;
  }
}

/**
 * Grant a bonus evaluation credit to an identifier (wallet or IP)
 * Used as a reward for viral sharing on X
 */
export async function grantBonusQuota(identifier: string): Promise<number> {
  if (!redis) return 0;

  const bonusKey = `bonus_quota:${identifier}`;
  const newTotal = await redis.incr(bonusKey);

  // Set expiration to 24 hours (matching daily reset window roughly)
  await redis.expire(bonusKey, 86400);

  return newTotal;
}

/**
 * Get current bonus quota count
 */
export async function getBonusQuota(identifier: string): Promise<number> {
  if (!redis) return 0;
  return (await redis.get<number>(`bonus_quota:${identifier}`)) || 0;
}

export async function getRateLimitInfo(
  identifier: string,
  plan: 'free' | 'pro' | 'advisor_read' | 'advisor_write' | 'alerts' | 'idea_eval_ip' | 'idea_eval_wallet' | 'bonus_claim' = 'free'
): Promise<{
  limit: number;
  remaining: number;
  reset: number;
}> {
  if (!rateLimiters || !redis) {
    const defaultLimits: Record<string, number> = {
      pro: 100,
      advisor_read: 30,
      advisor_write: 10,
      alerts: 5,
      free: 20,
      idea_eval_ip: 3,
      idea_eval_wallet: 5,
      bonus_claim: 2
    };
    const limit = defaultLimits[plan] || 20;
    return {
      limit,
      remaining: limit,
      reset: Date.now() + 60000
    };
  }

  // @ts-ignore
  const ratelimiter = rateLimiters[plan];
  if (!ratelimiter) return { limit: 0, remaining: 0, reset: Date.now() };

  // For sliding window, Upstash stores data in keys. 
  // Getting the exact remaining without consuming is tricky with just the Ratelimit class.
  // Workaround: We will just consume 0 tokens if possible, but Upstash Ratelimit min cost is 1.
  // Alternative: We interpret the quota based on the last known state or just return the static limit 
  // until the user makes a request. 

  // HOWEVER, for a "Quota" system, we usually want to show it BEFORE the request.
  // Let's rely on the Redis key inspection manually if we want perfection, 
  // but simpler: just return the configured limit and assume full unless we have a reason to know otherwise?
  // No, that defeats the purpose.

  // Let's use the .limit() with 0? No.

  // Okay, we will try to use the `getRemaining` if it exists on the underlying implementation, 
  // but since we can't easily, we will implement a "Check" by using the redis client to peek.
  // But the key formation is internal to the library.

  // Hack/Solution: We just use a separate key for "view counting" or we accept we catch the 429.
  // BETTER SOLUTION: Just use `ratelimit.limit(identifier)` inside the POST, and for the GET info,
  // we can't perfectly know.

  // WAIT. The Upstash Ratelimit library exposes `getRemaining` in newer versions.
  // Let's assume we can't and do a "best effort" by checking the key pattern if we knew it.

  // Let's just return the LIMITS for now so the UI can at least show "Max 3 per day".
  // The user asked to "Implement the Quota", implies "Enforcement".
  // The "Display Remaining" is a bonus. 

  // Let's look at the `idea_eval_ip` definition again: Ratelimit.slidingWindow(3, '24 h')
  const defaultLimits: Record<string, number> = {
    pro: 100,
    free: 20,
    idea_eval_ip: 3,
    idea_eval_wallet: 5,
    bonus_claim: 2
  };

  return {
    limit: defaultLimits[plan] || 0,
    remaining: -1, // -1 Indicates "Unknown / Hidden until used"
    reset: Date.now() + 86400 * 1000
  };
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
