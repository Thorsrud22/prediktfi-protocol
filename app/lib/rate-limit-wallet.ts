/**
 * Wallet-based rate limiting utilities
 * Provides rate limiting per wallet in addition to IP-based limiting
 */

import { NextRequest, NextResponse } from 'next/server';

interface WalletRateLimit {
  count: number;
  resetTime: number;
  dailyCount: number;
  dailyResetTime: number;
}

interface WalletRateLimitConfig {
  perWalletMinWindow: number; // seconds
  perWalletDailyCap: number;
  perWalletBurstLimit: number;
}

// In-memory store for wallet rate limits (use Redis in production)
const walletRateLimitStore = new Map<string, WalletRateLimit>();

const DEFAULT_CONFIG: WalletRateLimitConfig = {
  perWalletMinWindow: 60, // 1 minute
  perWalletDailyCap: 100, // 100 requests per day per wallet
  perWalletBurstLimit: 10 // 10 requests per minute per wallet
};

/**
 * Get wallet identifier from request
 */
export function getWalletIdentifier(request: NextRequest): string | null {
  // Try to get wallet ID from various sources
  const walletId = request.headers.get('x-wallet-id') ||
                   request.headers.get('wallet-id') ||
                   request.nextUrl.searchParams.get('walletId');
  
  return walletId || null;
}

/**
 * Check wallet-based rate limit
 */
export function checkWalletRateLimit(
  walletId: string,
  config: WalletRateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; error?: string; retryAfter?: number } {
  const now = Date.now();
  const windowMs = config.perWalletMinWindow * 1000;
  const dayMs = 24 * 60 * 60 * 1000;
  
  // Get or create rate limit entry
  let limit = walletRateLimitStore.get(walletId);
  if (!limit) {
    limit = {
      count: 0,
      resetTime: now + windowMs,
      dailyCount: 0,
      dailyResetTime: now + dayMs,
    };
    walletRateLimitStore.set(walletId, limit);
  }
  
  // Reset counters if expired
  if (now >= limit.resetTime) {
    limit.count = 0;
    limit.resetTime = now + windowMs;
  }
  
  if (now >= limit.dailyResetTime) {
    limit.dailyCount = 0;
    limit.dailyResetTime = now + dayMs;
  }
  
  // Check daily limit first
  if (limit.dailyCount >= config.perWalletDailyCap) {
    return {
      allowed: false,
      error: `Daily limit of ${config.perWalletDailyCap} requests exceeded for wallet ${walletId}`,
      retryAfter: Math.ceil((limit.dailyResetTime - now) / 1000)
    };
  }
  
  // Check burst limit
  if (limit.count >= config.perWalletBurstLimit) {
    return {
      allowed: false,
      error: `Burst limit of ${config.perWalletBurstLimit} requests per minute exceeded for wallet ${walletId}`,
      retryAfter: Math.ceil((limit.resetTime - now) / 1000)
    };
  }
  
  // Increment counters
  limit.count++;
  limit.dailyCount++;
  walletRateLimitStore.set(walletId, limit);
  
  return { allowed: true };
}

/**
 * Combined IP + Wallet rate limiting
 */
export function checkCombinedRateLimit(
  request: NextRequest,
  walletConfig: WalletRateLimitConfig = DEFAULT_CONFIG
): NextResponse | null {
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  
  const walletId = getWalletIdentifier(request);
  
  // Check wallet rate limit if wallet ID is available
  if (walletId) {
    const walletCheck = checkWalletRateLimit(walletId, walletConfig);
    if (!walletCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Wallet rate limit exceeded',
          message: walletCheck.error,
          retryAfter: walletCheck.retryAfter,
          code: 'WALLET_RATE_LIMIT'
        },
        { status: 429 }
      );
    }
  }
  
  // Additional IP-based checks can be added here
  // For now, we'll rely on existing IP rate limiting in other parts of the system
  
  return null; // No rate limit exceeded
}

/**
 * Get wallet rate limit info
 */
export function getWalletRateLimitInfo(walletId: string): {
  count: number;
  dailyCount: number;
  resetTime: number;
  dailyResetTime: number;
} | null {
  const limit = walletRateLimitStore.get(walletId);
  if (!limit) return null;
  
  return {
    count: limit.count,
    dailyCount: limit.dailyCount,
    resetTime: limit.resetTime,
    dailyResetTime: limit.dailyResetTime
  };
}

/**
 * Clear wallet rate limit (for testing/admin)
 */
export function clearWalletRateLimit(walletId: string): void {
  walletRateLimitStore.delete(walletId);
}

/**
 * Cleanup expired entries
 */
export function cleanupWalletRateLimits(): void {
  const now = Date.now();
  
  for (const [walletId, limit] of walletRateLimitStore.entries()) {
    if (now >= limit.resetTime && now >= limit.dailyResetTime) {
      walletRateLimitStore.delete(walletId);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupWalletRateLimits, 5 * 60 * 1000);
