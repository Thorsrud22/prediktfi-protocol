import { NextRequest, NextResponse } from 'next/server';
import { isProRequest } from './plan';
import { trackServer } from './analytics';

interface RateLimit {
  count: number;
  resetTime: number;
  dailyCount: number;
  dailyResetTime: number;
}

const rateLimitStore = new Map<string, RateLimit>();

export interface RateLimitConfig {
  perIpMinWindow?: number; // seconds between requests
  perIpDailyCap?: number;  // max requests per day
}

export function getClientIP(request: NextRequest): string {
  // Try various headers for IP detection
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const remote = request.headers.get('x-remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (real) {
    return real;
  }
  if (remote) {
    return remote;
  }
  
  return 'unknown';
}

/**
 * Rate limit checker with Pro bypass
 * Throws NextResponse (429) if rate limited, otherwise returns void
 */
export function rateLimitOrThrow(request: NextRequest, config: RateLimitConfig = {}) {
  const { perIpMinWindow = 6, perIpDailyCap = 50 } = config;
  
  // Pro users bypass rate limiting entirely
  if (isProRequest(request)) {
    trackServer('pro_bypass_hit', { feature: 'rate_limit' });
    return; // No rate limiting for Pro
  }
  
  const clientIP = getClientIP(request);
  const now = Date.now();
  const windowMs = perIpMinWindow * 1000;
  
  // Get or create rate limit entry
  let limit = rateLimitStore.get(clientIP);
  if (!limit) {
    limit = {
      count: 0,
      resetTime: now + windowMs,
      dailyCount: 0,
      dailyResetTime: now + 24 * 60 * 60 * 1000, // 24 hours
    };
    rateLimitStore.set(clientIP, limit);
  }
  
  // Reset window if expired
  if (now >= limit.resetTime) {
    limit.count = 0;
    limit.resetTime = now + windowMs;
  }
  
  // Reset daily if expired
  if (now >= limit.dailyResetTime) {
    limit.dailyCount = 0;
    limit.dailyResetTime = now + 24 * 60 * 60 * 1000;
  }
  
  // Check daily limit first
  if (limit.dailyCount >= perIpDailyCap) {
    throw NextResponse.json(
      { 
        error: 'Rate limit exceeded', 
        code: 'FREE_DAILY_LIMIT',
        message: `Daily limit of ${perIpDailyCap} requests exceeded. Upgrade to Pro for unlimited access.`,
        retryAfter: Math.ceil((limit.dailyResetTime - now) / 1000)
      },
      { status: 429 }
    );
  }
  
  // Check window rate limit
  if (limit.count > 0) {
    const timeToWait = Math.ceil((limit.resetTime - now) / 1000);
    throw NextResponse.json(
      { 
        error: 'Rate limit exceeded', 
        code: 'RATE_LIMIT',
        message: `Please wait ${timeToWait} seconds between requests. Upgrade to Pro for priority processing.`,
        retryAfter: timeToWait
      },
      { status: 429 }
    );
  }
  
  // Increment counters
  limit.count++;
  limit.dailyCount++;
  rateLimitStore.set(clientIP, limit);
}
