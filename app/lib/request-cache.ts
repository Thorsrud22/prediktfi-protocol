/**
 * Client-side request deduplication and caching system
 * Prevents multiple identical API calls from running simultaneously
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
  subscribers: number;
}

interface CachedData<T> {
  data: T;
  timestamp: number;
  staleTime: number;
}

class RequestCache {
  private pending = new Map<string, PendingRequest<any>>();
  private cache = new Map<string, CachedData<any>>();
  private maxCacheSize = 50;

  /**
   * Get cached data if fresh, or return null
   */
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > cached.staleTime) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set cached data
   */
  private setCache<T>(key: string, data: T, staleTime: number): void {
    // Evict old entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      staleTime,
    });
  }

  /**
   * Deduplicate and cache fetch requests
   * Multiple calls with same key will share the same promise
   */
  async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      staleTime?: number; // How long cached data stays fresh (ms)
      dedupe?: boolean; // Whether to deduplicate concurrent requests
    } = {},
  ): Promise<T> {
    const { staleTime = 60000, dedupe = true } = options;

    // Check cache first
    const cached = this.getCached<T>(key);
    if (cached !== null) {
      console.log(`[RequestCache] Cache hit: ${key.substring(0, 50)}...`);
      return cached;
    }

    // Check if request is already in flight
    const pending = this.pending.get(key);
    if (pending && dedupe) {
      console.log(`[RequestCache] Deduping request: ${key.substring(0, 50)}...`);
      pending.subscribers++;
      try {
        return await pending.promise;
      } finally {
        pending.subscribers--;
        if (pending.subscribers === 0) {
          this.pending.delete(key);
        }
      }
    }

    // Start new request
    console.log(`[RequestCache] Starting new request: ${key.substring(0, 50)}...`);
    const promise = fetcher()
      .then(data => {
        this.setCache(key, data, staleTime);
        return data;
      })
      .catch(error => {
        this.pending.delete(key);
        throw error;
      });

    this.pending.set(key, {
      promise,
      timestamp: Date.now(),
      subscribers: 1,
    });

    try {
      const result = await promise;
      this.pending.delete(key);
      return result;
    } catch (error) {
      this.pending.delete(key);
      throw error;
    }
  }

  /**
   * Invalidate cache entries by key or pattern
   */
  invalidate(keyOrPattern: string | RegExp): void {
    if (typeof keyOrPattern === 'string') {
      this.cache.delete(keyOrPattern);
      this.pending.delete(keyOrPattern);
    } else {
      // Pattern matching
      for (const key of this.cache.keys()) {
        if (keyOrPattern.test(key)) {
          this.cache.delete(key);
        }
      }
      for (const key of this.pending.keys()) {
        if (keyOrPattern.test(key)) {
          this.pending.delete(key);
        }
      }
    }
  }

  /**
   * Clear all cache and pending requests
   */
  clear(): void {
    this.cache.clear();
    this.pending.clear();
  }

  /**
   * Get cache stats for monitoring
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pending.size,
      cacheKeys: Array.from(this.cache.keys()).map(k => k.substring(0, 50)),
    };
  }
}

// Global singleton instance
export const requestCache = new RequestCache();

// Helper function for common use case
export async function cachedFetch<T>(
  url: string,
  init?: RequestInit,
  cacheOptions?: {
    staleTime?: number;
    dedupe?: boolean;
  },
): Promise<T> {
  const key = `${url}:${JSON.stringify(init || {})}`;
  
  return requestCache.fetch(
    key,
    async () => {
      const response = await fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json() as Promise<T>;
    },
    cacheOptions,
  );
}
