'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { trackApiCall } from '../utils/performance';

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
  timeoutMs?: number; // Abort the request after this many ms
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isStale: boolean;
  lastFetched: number | null;
}

// Global cache shared across all hook instances with improved memory management
const globalCache = new Map<string, CacheEntry<any>>();
const MAX_CACHE_SIZE = 50; // Limit cache size to prevent memory leaks

// Cache management only

// Cleanup interval for cache
let cleanupInterval: NodeJS.Timeout | null = null;

function startCacheCleanup() {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    const now = Date.now();
    const entriesToRemove: string[] = [];

    for (const [key, entry] of globalCache.entries()) {
      if (now > entry.expiry) {
        entriesToRemove.push(key);
      }
    }

    // Remove expired entries
    entriesToRemove.forEach(key => globalCache.delete(key));

    // If cache is too large, remove oldest entries
    if (globalCache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(globalCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, globalCache.size - MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => globalCache.delete(key));
    }
  }, 30000); // More frequent cleanup every 30 seconds
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
    cacheTime = 10 * 60 * 1000, // Increased to 10 minutes default cache
    staleTime = 60 * 1000, // Increased to 60 seconds stale time
    enabled = true,
    retries = 2, // Reduced retries for faster failure detection
    retryDelay = 500, // Faster retry delay
    timeoutMs = 3000, // More aggressive timeout for faster feedback
  } = options;

  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: enabled,
    error: null,
    isStale: false,
    lastFetched: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
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

      // Check cache first with more sophisticated cache logic
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

        // If stale but still valid, start background refresh without showing loading
        if (attempt === 0) {
          // Background refresh - don't block UI
          setTimeout(() => fetchWithRetry(0), 0);
        }
      }

      // Cancel previous request if it's still in-flight
      if (abortControllerRef.current && inFlightRef.current && !abortControllerRef.current.signal.aborted) {
        try { abortControllerRef.current.abort(); } catch {}
      }

      abortControllerRef.current = new AbortController();
      inFlightRef.current = true;

      updateState({ loading: true, error: null });

      try {
        // Setup a timeout to prevent hanging requests
        const controller = abortControllerRef.current;
        const timeoutId = setTimeout(() => {
          try {
            controller?.abort();
          } catch {}
        }, timeoutMs);

        // Track API call performance
        const fetchPromise = fetch(url, {
          signal: controller?.signal,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          // Add performance optimizations
          keepalive: true,
          priority: 'high',
        } as RequestInit);

        const response = await trackApiCall(url, fetchPromise, {
          attempt: attempt + 1,
          retries,
          cacheHit: !!cached,
        }).catch(fetchError => {
          // Swallow aborts (expected during rapid filter changes or unmounts)
          if (fetchError && (fetchError.name === 'AbortError' || fetchError.message?.includes('aborted'))) {
            throw fetchError; // handled in outer catch as AbortError
          }
          // If trackApiCall fails for other reasons, propagate a clear error
          throw new Error(`Failed to fetch: ${fetchError?.message || 'unknown error'}`);
        });

  clearTimeout(timeoutId);

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
        inFlightRef.current = false;
        return result;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // If aborted (likely due to timeout), try keep cached data and mark stale
          const cached = url ? globalCache.get(url) : null;
          if (cached) {
            updateState({ loading: false, isStale: true, error: 'Request timed out' });
            inFlightRef.current = false;
            return cached.data as T;
          }
          updateState({ loading: false, error: 'Request timed out' });
          inFlightRef.current = false;
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

        inFlightRef.current = false;
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

    // Force loading to false after a reasonable timeout as safety net
    const safetyTimeout = setTimeout(() => {
      console.warn('[useOptimizedFetch] Safety timeout reached, forcing loading to false');
      updateState({ loading: false, error: 'Request timed out' });
    }, (timeoutMs || 3000) + 1000); // Reduced buffer time

    return () => {
      clearTimeout(safetyTimeout);
      // Only abort if in-flight and not already aborted
      if (abortControllerRef.current && inFlightRef.current && !abortControllerRef.current.signal.aborted) {
        try { abortControllerRef.current.abort(); } catch {}
      }
    };
  }, [fetchWithRetry, enabled, timeoutMs, updateState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current && inFlightRef.current && !abortControllerRef.current.signal.aborted) {
        try { abortControllerRef.current.abort(); } catch {}
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
