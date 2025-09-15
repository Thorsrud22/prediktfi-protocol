'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface FetchOptions {
  revalidate?: number; // Cache duration in seconds
  staleWhileRevalidate?: boolean; // Return cached data immediately, then fetch fresh
  dedupe?: boolean; // Deduplicate identical requests
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Optimized fetch hook with smart caching and performance optimizations
 * Inspired by SWR and modern data fetching patterns
 */
export function useOptimizedFetch<T>(url: string | null, options: FetchOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global caches shared across hook instances
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(
    typeof window !== 'undefined'
      ? ((window as any).__optimizedFetchCache ||= new Map())
      : new Map(),
  );

  const pendingRequests = useRef<Map<string, Promise<T>>>(
    typeof window !== 'undefined'
      ? ((window as any).__optimizedFetchPending ||= new Map())
      : new Map(),
  );

  const { revalidate = 60, staleWhileRevalidate = false, dedupe = true } = options;

  const fetchFresh = useCallback(
    async (fetchUrl: string): Promise<T> => {
      const request = fetch(fetchUrl).then(async response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          throw new Error('Expected JSON response');
        }

        const data = await response.json();

        // Cache the response
        const now = Date.now();
        cacheRef.current.set(fetchUrl, { data, timestamp: now });

        return data;
      });

      if (dedupe) {
        pendingRequests.current.set(fetchUrl, request);
        request.finally(() => pendingRequests.current.delete(fetchUrl));
      }

      return request;
    },
    [dedupe],
  );

  const fetchData = useCallback(
    async (fetchUrl: string): Promise<T> => {
      // Dedupe identical requests
      if (dedupe && pendingRequests.current.has(fetchUrl)) {
        return pendingRequests.current.get(fetchUrl)!;
      }

      // Check cache first
      const cached = cacheRef.current.get(fetchUrl);
      const now = Date.now();
      const revalidateTime = revalidate * 1000;

      if (cached && now - cached.timestamp < revalidateTime) {
        if (staleWhileRevalidate) {
          // Return cached data immediately, fetch fresh data in background
          setTimeout(() => {
            fetchFresh(fetchUrl).catch(console.warn);
          }, 0);
        }
        return cached.data;
      }

      return fetchFresh(fetchUrl);
    },
    [dedupe, revalidate, staleWhileRevalidate, fetchFresh],
  );

  // Main effect to fetch data
  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    let mounted = true;

    setLoading(true);
    setError(null);

    fetchData(url)
      .then(result => {
        if (mounted) {
          setData(result);
          setError(null);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          console.error('Fetch error:', err);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [url, fetchData]);

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    if (!url) return Promise.resolve();

    setLoading(true);
    setError(null);

    // Clear cache for this URL
    cacheRef.current.delete(url);

    return fetchData(url)
      .then(result => {
        setData(result);
        return result;
      })
      .catch(err => {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      })
      .finally(() => {
        setLoading(false);
      });
  }, [url, fetchData]);

  // Mutate function for optimistic updates
  const mutate = useCallback(
    (newData: T | ((prevData: T | null) => T)) => {
      if (!url) return;

      const updatedData =
        typeof newData === 'function' ? (newData as (prevData: T | null) => T)(data) : newData;

      setData(updatedData);

      // Update cache
      cacheRef.current.set(url, {
        data: updatedData,
        timestamp: Date.now(),
      });
    },
    [url, data],
  );

  return {
    data,
    loading,
    error,
    refetch,
    mutate,
  };
}

// Helper hook for API endpoints with consistent base URL
export function useApiEndpoint<T>(endpoint: string | null, options?: FetchOptions) {
  const url = endpoint ? `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}` : null;
  return useOptimizedFetch<T>(url, options);
}
