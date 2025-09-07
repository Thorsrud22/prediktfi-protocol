import { NextRequest } from 'next/server';
import { trackServer } from '../../lib/analytics';
import { checkWalletRateLimit, getWalletIdentifier } from '../../lib/rate-limit-wallet';

interface RateLimit {
  count: number;
  resetTime: number;
  dailyCount: number;
  dailyResetTime: number;
}

const rateLimitStore = new Map<string, RateLimit>();

export interface AuthResult {
  allowed: boolean;
  plan: 'free' | 'pro';
  remaining?: number;
  resetTime?: number;
  error?: string;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (real) {
    return real;
  }
  
  return 'unknown';
}

function getPlanFromCookie(request: NextRequest): 'free' | 'pro' {
  const planCookie = request.cookies.get('predikt_plan')?.value;
  return planCookie === 'pro' ? 'pro' : 'free';
}

export function checkAuthAndQuota(request: NextRequest): AuthResult {
  const plan = getPlanFromCookie(request);
  const clientIP = getClientIP(request);
  
  // Pro users bypass all rate limiting
  if (plan === 'pro') {
    trackServer('quota_check', { plan: 'pro', result: 'allowed' });
    return { allowed: true, plan: 'pro' };
  }
  
  // Check wallet-based rate limiting first
  const walletId = getWalletIdentifier(request);
  if (walletId) {
    const walletCheck = checkWalletRateLimit(walletId, {
      perWalletMinWindow: 60, // 1 minute
      perWalletDailyCap: 200, // 200 insights per day per wallet
      perWalletBurstLimit: 20 // 20 insights per minute per wallet
    });
    
    if (!walletCheck.allowed) {
      trackServer('quota_exhausted', { plan: 'free', type: 'wallet', walletId });
      return {
        allowed: false,
        plan: 'free',
        error: walletCheck.error,
        resetTime: walletCheck.retryAfter
      };
    }
  }

  // Development mode - unlimited quota
  if (process.env.NODE_ENV === 'development') {
    trackServer('quota_check', { plan: 'free', result: 'allowed', mode: 'development' });
    return { allowed: true, plan: 'free', remaining: 999999 };
  }

  // Free plan rate limiting - INCREASED FOR TESTING
  const freePerDay = parseInt(process.env.RATE_LIMIT_FREE_PER_DAY || '100');
  const burstPerMin = parseInt(process.env.RATE_LIMIT_BURST_PER_MIN || '10');
  
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const minMs = 60 * 1000;

  // Get or create rate limit entry
  let limit = rateLimitStore.get(clientIP);
  if (!limit) {
    limit = {
      count: 0,
      resetTime: now + minMs,
      dailyCount: 0,
      dailyResetTime: now + dayMs,
    };
    rateLimitStore.set(clientIP, limit);
  }

  // Reset counters if expired
  if (now >= limit.resetTime) {
    limit.count = 0;
    limit.resetTime = now + minMs;
  }
  
  if (now >= limit.dailyResetTime) {
    limit.dailyCount = 0;
    limit.dailyResetTime = now + dayMs;
  }

  // Check daily limit first
  if (limit.dailyCount >= freePerDay) {
    trackServer('quota_exhausted', { plan: 'free', type: 'daily', ip: clientIP });
    return {
      allowed: false,
      plan: 'free',
      error: `Daily limit of ${freePerDay} insights reached. Upgrade to Pro for unlimited access.`,
      resetTime: limit.dailyResetTime,
    };
  }

  // Check burst limit
  if (limit.count >= burstPerMin) {
    trackServer('quota_exhausted', { plan: 'free', type: 'burst', ip: clientIP });
    return {
      allowed: false,
      plan: 'free',
      error: `Too many requests. Please wait ${Math.ceil((limit.resetTime - now) / 1000)} seconds.`,
      resetTime: limit.resetTime,
    };
  }

  // Increment counters
  limit.count++;
  limit.dailyCount++;
  rateLimitStore.set(clientIP, limit);

  trackServer('quota_check', { 
    plan: 'free', 
    result: 'allowed',
    dailyUsed: limit.dailyCount,
    dailyLimit: freePerDay 
  });

  return {
    allowed: true,
    plan: 'free',
    remaining: freePerDay - limit.dailyCount,
  };
}

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, limit] of rateLimitStore.entries()) {
    // Remove entries that are expired for more than 1 day
    if (now > limit.dailyResetTime + 24 * 60 * 60 * 1000) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour
