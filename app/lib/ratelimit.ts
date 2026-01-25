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
  // Idea Evaluator limits (Burst Spam Protection)
  // The daily 3/5 limit is now enforced via getEvalCount explicitly in checkRateLimit
  idea_eval_ip: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(3, '1 m'), // 3 attempts per minute
    analytics: true,
  }),
  idea_eval_wallet: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 attempts per minute
    analytics: true,
  }),
  // Limit bonus claims (sharing on X) to 2 per day
  bonus_claim: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(2, '24 h'),
    analytics: true,
  }),
  // Live Coach / Copilot limit (per hour)
  copilot: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(40, '1 h'), // 40 tips per hour
    analytics: true,
  }),
  auth: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 attempts per minute
    analytics: true,
  }),
  image_gen: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(3, '10 m'), // 3 images per 10 minutes (prevents spam)
    analytics: true,
  }),
  admin: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(60, '1 h'), // 60 requests per hour
    analytics: true,
  }),
} : null;

export type RateLimitPlan = 'free' | 'pro' | 'global' | 'advisor_read' | 'advisor_write' | 'alerts' | 'idea_eval_ip' | 'idea_eval_wallet' | 'bonus_claim' | 'copilot' | 'auth' | 'admin' | 'image_gen';

export interface RateLimitOptions {
  identifier?: string; // Custom identifier (defaults to IP)
  plan?: RateLimitPlan; // User plan or specific limiter
  skipForDevelopment?: boolean; // Skip rate limiting in development
}

/**
 * Apply rate limiting to a request
 * Returns null if request is allowed, NextResponse with 429 if rate limited
 */
// In-memory store for fallback (when Redis is missing)
const memoryStore = new Map<string, { count: number; reset: number }>();

/**
 * Get a consistent identifier for a user (Wallet > IP)
 */
export function getClientIdentifier(request: NextRequest, walletAddress?: string | null): string {
  // 1. Priority: Wallet Address (if valid)
  if (walletAddress && walletAddress.length > 30) {
    return walletAddress;
  }

  // 2. Secondary: Normalized IP from Next.js request.ip (reliable on Vercel)
  const reqIp = (request as any).ip;
  if (reqIp) {
    return reqIp;
  }

  // 3. Fallback: Parse x-forwarded-for (first IP in chain)
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }

  // 4. Ultimate Fallback: known proxies or unknown
  return request.headers.get('x-real-ip') || 'unknown';
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

  // Use normalized identifier (either passed in or calculated)
  const identifier = options.identifier || getClientIdentifier(request);

  const plan = options.plan || 'free';

  // --- REDIS PATH ---
  if (rateLimiters && rateLimiters[plan]) {
    try {
      const ratelimiter = rateLimiters[plan];

      // SPECIAL CASE: Evaluation plans check the daily completion quota first
      if (plan === 'idea_eval_ip' || plan === 'idea_eval_wallet') {
        const used = await getEvalCount(identifier, plan);
        const limit = plan === 'idea_eval_ip' ? 3 : 5;

        if (used >= limit) {
          // Check for bonus quota before blocking
          if (redis) {
            const bonusCount = (await redis.get<number>(`bonus_quota:${identifier}`)) || 0;
            if (bonusCount > 0) {
              // Allow through, incrementEvalCount will naturally consume bonus logic in higher layers or we de-increment it here?
              // Actually, incrementEvalCount is called AFTER success.
              // To be safe, we allow the request if bonus > 0.
              return null;
            }
          }

          return NextResponse.json(
            {
              error: 'Rate limit exceeded',
              message: `Daily limit of ${limit} reached.`,
              retryAfter: 3600
            },
            { status: 429 }
          );
        }
      }

      const { success, limit, remaining, reset } = await ratelimiter.limit(identifier);

      // Bonus Check logic (only for Redis path for now)
      if (!success && redis) {
        const bonusKey = `bonus_quota:${identifier}`;
        const bonusCount = (await redis.get<number>(bonusKey)) || 0;
        if (bonusCount > 0) {
          await redis.decr(bonusKey);
          return null;
        }
      }

      const headers = {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      };

      if (!success) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: `Too many requests. Limit: ${limit}.`,
            retryAfter: Math.round((reset - Date.now()) / 1000)
          },
          { status: 429, headers }
        );
      }
      return null;
    } catch (error) {
      console.error('Redis Rate limiting failed, falling back to memory:', error);
      // Fall through to memory
    }
  }

  // --- MEMORY FALLBACK PATH (No Redis) ---

  // 1. Check Daily Quota first for evaluation plans
  if (plan === 'idea_eval_ip' || plan === 'idea_eval_wallet') {
    const used = await getEvalCount(identifier, plan);
    const limit = plan === 'idea_eval_ip' ? 3 : 5;

    if (used >= limit) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Daily limit of ${limit} reached.`,
          retryAfter: 3600
        },
        { status: 429 }
      );
    }
  }

  // 2. Check Burst/Spam Limit (Attempt-based)
  const attemptKey = `${plan}:${identifier}`;
  const attemptRecord = memoryStore.get(attemptKey);
  const now = Date.now();
  const burstLimit = (plan === 'idea_eval_ip' ? 3 : (plan === 'idea_eval_wallet' ? 5 : 20));

  if (attemptRecord && now < attemptRecord.reset && attemptRecord.count >= burstLimit) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${burstLimit}.`,
        retryAfter: Math.round((attemptRecord.reset - now) / 1000)
      },
      { status: 429 }
    );
  }

  // 3. Record attempt and return OK
  const record = attemptRecord || { count: 0, reset: now + 60000 };
  record.count += 1;
  memoryStore.set(attemptKey, record);

  return null;
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

/**
 * Increment evaluation count for tracking (separate from rate limiter)
 * This allows us to display accurate remaining quota in the UI
 */
export async function incrementEvalCount(identifier: string, plan: 'idea_eval_ip' | 'idea_eval_wallet'): Promise<number> {
  const key = `eval_count:${plan}:${identifier}`;

  if (!redis) {
    // Memory fallback
    const existing = memoryStore.get(key);
    const count = (existing?.count || 0) + 1;
    memoryStore.set(key, { count, reset: Date.now() + 24 * 60 * 60 * 1000 });
    return count;
  }

  const newCount = await redis.incr(key);

  // Set TTL to 24 hours on first increment
  if (newCount === 1) {
    await redis.expire(key, 86400);
  }

  return newCount;
}

/**
 * Get current evaluation count for an identifier
 */
export async function getEvalCount(identifier: string, plan: 'idea_eval_ip' | 'idea_eval_wallet'): Promise<number> {
  const key = `eval_count:${plan}:${identifier}`;

  if (!redis) {
    // Memory fallback
    const existing = memoryStore.get(key);
    return existing?.count || 0;
  }

  return (await redis.get<number>(key)) || 0;
}

export async function getRateLimitInfo(
  identifier: string,
  plan: RateLimitPlan = 'free'
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
      idea_eval_ip: 3, // Burst limit
      idea_eval_wallet: 5, // Burst limit
      bonus_claim: 2,
      copilot: 40,
      image_gen: 3
    };
    const limit = defaultLimits[plan] || 20;

    const windows: Record<string, number> = {
      image_gen: 10 * 60 * 1000,
      idea_eval_ip: 24 * 60 * 60 * 1000,
      idea_eval_wallet: 24 * 60 * 60 * 1000,
      default: 60 * 1000
    };
    const windowMs = windows[plan] || windows.default;

    // Check memory store for usage
    // We check both the daily eval_count (completions) and the attempt counter (spam protection)
    const dailyKey = `eval_count:${plan}:${identifier}`;
    const attemptKey = `${plan}:${identifier}`;

    const dailyRecord = memoryStore.get(dailyKey);
    const attemptRecord = memoryStore.get(attemptKey);
    const now = Date.now();

    let used = 0;
    let currentReset = now + windowMs;

    if (dailyRecord && now < dailyRecord.reset) {
      used = dailyRecord.count;
      currentReset = dailyRecord.reset;
    }

    // For evaluation plans, the UI primarily cares about the daily quota
    const isEvalPlan = plan === 'idea_eval_ip' || plan === 'idea_eval_wallet';

    if (isEvalPlan) {
      return {
        limit,
        remaining: Math.max(0, limit - used),
        reset: currentReset
      };
    }

    // Generic plans
    if (attemptRecord && now < attemptRecord.reset) {
      return {
        limit,
        remaining: Math.max(0, limit - attemptRecord.count),
        reset: attemptRecord.reset
      };
    }

    return {
      limit,
      remaining: limit,
      reset: now + windowMs
    };
  }

  // Redis path: peek eval_count for accurate UI
  if (plan === 'idea_eval_ip' || plan === 'idea_eval_wallet') {
    const limit = plan === 'idea_eval_ip' ? 3 : 5;
    const used = await getEvalCount(identifier, plan);
    const bonus = await getBonusQuota(identifier);

    return {
      limit,
      remaining: Math.max(0, (limit + bonus) - used),
      reset: Date.now() + 3600 // Approximated
    };
  }

  // @ts-ignore
  const ratelimiter = rateLimiters[plan];
  if (!ratelimiter) return { limit: 0, remaining: 0, reset: Date.now() };

  const defaultLimits: Record<string, number> = {
    pro: 100,
    free: 20,
    idea_eval_ip: 3,
    idea_eval_wallet: 5,
    bonus_claim: 2,
    copilot: 40
  };

  return {
    limit: defaultLimits[plan] || 0,
    remaining: -1, // -1 Indicates "Unknown / Hidden until used" for generic sliding windows
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
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('walletAddress');
    const identifier = getClientIdentifier(request, walletAddress);

    const isWallet = !!walletAddress && walletAddress.length > 30;
    const plan = isWallet ? 'idea_eval_wallet' : 'idea_eval_ip';
    const info = await getRateLimitInfo(identifier, options.plan || plan); // Use the determined plan if options.plan is not set

    response.headers.set('X-RateLimit-Limit', info.limit.toString());
    response.headers.set('X-RateLimit-Remaining', info.remaining.toString());
    response.headers.set('X-RateLimit-Reset', info.reset.toString());
  } catch (error) {
    // Don't fail if we can't add headers
    console.error('Failed to add rate limit headers:', error);
  }

  return response;
}
