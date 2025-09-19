// Cache utilities for API optimization
import { createHash } from 'crypto';

export interface CacheEntry<T> {
  data: T;
  etag: string;
  timestamp: number;
  expiresAt: number;
}

// In-memory cache with TTL
const cache = new Map<string, CacheEntry<any>>();

// Cache cleanup interval (5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < now) {
      cache.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function getCached<T>(key: string): CacheEntry<T> | null {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry as CacheEntry<T>;
}

export function setCached<T>(
  key: string,
  data: T,
  ttlMs: number = 5 * 60 * 1000, // 5 minutes default
): CacheEntry<T> {
  const now = Date.now();
  const etag = createHash('sha256')
    .update(JSON.stringify(data) + now)
    .digest('hex')
    .substring(0, 16);

  const entry: CacheEntry<T> = {
    data,
    etag,
    timestamp: now,
    expiresAt: now + ttlMs,
  };

  cache.set(key, entry);
  return entry;
}

export function generateCacheKey(base: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${base}:${createHash('md5').update(sortedParams).digest('hex')}`;
}
