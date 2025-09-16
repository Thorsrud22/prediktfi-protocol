'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Optimized fetch hook with smart caching and performance optimizations
 * Inspired by SWR and modern data fetching patterns
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface FetchOptions {
  cacheTime?: number; // How long to cache data (ms)
  staleTime?: number; // When to consider data stale (ms)
  enabled?: boolean; // Whether to fetch data
  retries?: number; // Number of retries on failure
  retryDelay?: number; // Delay between retries (ms)
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isStale: boolean;
  lastFetched: number | null;
}

// Global cache shared across all hook instances
const globalCache = new Map<string, CacheEntry<any>>();

// Cleanup interval for cache
let cleanupInterval: NodeJS.Timeout | null = null;

function startCacheCleanup() {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of globalCache.entries()) {
      if (now > entry.expiry) {
        globalCache.delete(key);
      }
    }
  }, 60000); // Cleanup every minute
}

function stopCacheCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

export function useOptimizedFetch<T>(
  url: string | null,
  options: FetchOptions = {},
): FetchState<T> & { refetch: () => Promise<T | null>; clearCache: () => void } {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes default cache
    staleTime = 30 * 1000, // 30 seconds stale time
    enabled = true,
    retries = 3,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: enabled,
    error: null,
    isStale: false,
    lastFetched: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  const updateState = useCallback((updates: Partial<FetchState<T>>) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  const fetchWithRetry = useCallback(
    async (attempt = 0): Promise<T | null> => {
      if (!enabled || !url) return null;

      // Check cache first
      const cached = globalCache.get(url);
      const now = Date.now();

      if (cached && now < cached.expiry) {
        const isStale = now > cached.timestamp + staleTime;
        updateState({
          data: cached.data,
          loading: false,
          error: null,
          isStale,
          lastFetched: cached.timestamp,
        });

        // Return cached data but potentially fetch fresh data in background if stale
        if (!isStale) {
          return cached.data;
        }
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      updateState({ loading: true, error: null });

      try {
        const response = await fetch(url, {
          signal: abortControllerRef.current.signal,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = (await response.json()) as T;

        // Cache the result
        const timestamp = Date.now();
        globalCache.set(url, {
          data: result,
          timestamp,
          expiry: timestamp + cacheTime,
        });

        updateState({
          data: result,
          loading: false,
          error: null,
          isStale: false,
          lastFetched: timestamp,
        });

        retryCountRef.current = 0;
        return result;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return null; // Request was cancelled
        }

        const errorMessage = error instanceof Error ? error.message : 'Fetch failed';

        // Retry logic
        if (attempt < retries) {
          console.warn(`Fetch attempt ${attempt + 1} failed for ${url}, retrying...`);

          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
          return fetchWithRetry(attempt + 1);
        }

        // Final failure
        console.error(`Fetch failed after ${retries + 1} attempts for ${url}:`, error);

        updateState({
          loading: false,
          error: errorMessage,
        });

        return null;
      }
    },
    [url, enabled, cacheTime, staleTime, retries, retryDelay, updateState],
  );

  const refetch = useCallback(async (): Promise<T | null> => {
    // Clear cache for this URL
    if (url) globalCache.delete(url);
    retryCountRef.current = 0;
    return fetchWithRetry(0);
  }, [url, fetchWithRetry]);

  const clearCache = useCallback(() => {
    if (url) globalCache.delete(url);
  }, [url]);

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;

    startCacheCleanup();
    fetchWithRetry(0);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchWithRetry, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Stop cleanup if no active hooks
      const hasActiveFetches = Array.from(globalCache.values()).some(
        entry => Date.now() < entry.expiry,
      );
      if (!hasActiveFetches) {
        stopCacheCleanup();
      }
    };
  }, []);

  return {
    ...state,
    refetch,
    clearCache,
  };
}

// Utility functions for cache management
export function clearAllCache() {
  globalCache.clear();
}

export function getCacheStats() {
  const now = Date.now();
  let active = 0;
  let expired = 0;

  for (const entry of globalCache.values()) {
    if (now < entry.expiry) {
      active++;
    } else {
      expired++;
    }
  }

  return {
    total: globalCache.size,
    active,
    expired,
  };
}

export function preloadData<T>(url: string, data: T, cacheTime = 5 * 60 * 1000) {
  const timestamp = Date.now();
  globalCache.set(url, {
    data,
    timestamp,
    expiry: timestamp + cacheTime,
  });
}

// Helper hook for API endpoints with consistent base URL
export function useApiEndpoint<T>(endpoint: string | null, options?: FetchOptions) {
  const url = endpoint ? `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}` : null;
  return useOptimizedFetch<T>(url, options);
}
