'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cachedFetch } from '@/app/lib/request-cache';

export function useOptimizedFetch<T>(
  url: string | null,
  options: {
    cacheTime?: number;
    staleTime?: number;
    enabled?: boolean;
    retries?: number;
    retryDelay?: number;
    timeoutMs?: number;
  } = {},
) {
  const {
    cacheTime = 10 * 60 * 1000,
    staleTime = 60 * 1000,
    enabled = true,
    retries = 1, // Reduced from 2 for faster failures
    retryDelay = 500,
    timeoutMs = 5000, // Increased from 3000 to reduce timeouts
  } = options;

  const [state, setState] = useState({
    data: null as T | null,
    loading: enabled,
    error: null as string | null,
    isStale: false,
    lastFetched: null as number | null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const latestFetchRef = useRef<(() => Promise<T | null>) | null>(null);

  const updateState = useCallback((updates: Partial<typeof state>) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  const fetchWithRetry = useCallback(async (attempt = 0): Promise<T | null> => {
    if (!enabled || !url) return null;

    try {
      // Use the new cachedFetch with deduplication
      const result = await cachedFetch<T>(url, {
        signal: abortControllerRef.current?.signal,
      }, {
        staleTime,
        dedupe: true, // Enable request deduplication
      });

      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      
      // Don't retry on 404 or other client errors (400-499)
      const isClientError = error instanceof Error && 
        error.message.includes('HTTP 4');
      
      if (attempt < retries && !isClientError) {
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(attempt + 1);
      }
      
      throw error;
    }
  }, [url, enabled, staleTime, retries, retryDelay]);

  const fetchData = useCallback(async (): Promise<T | null> => {
    if (!enabled || !url) return null;

    // Cancel previous request
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch {}
    }

    updateState({ loading: true, error: null });

    try {
      const result = await fetchWithRetry();

      updateState({
        data: result,
        loading: false,
        error: null,
        isStale: false,
        lastFetched: Date.now(),
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fetch failed';
      
      // Only log non-404 errors to console
      if (!errorMessage.includes('404')) {
        console.error('Fetch error:', errorMessage);
      }
      
      updateState({
        loading: false,
        error: errorMessage,
      });

      return null;
    }
  }, [enabled, url, fetchWithRetry, updateState]);

  // Keep latest fetch function in ref
  latestFetchRef.current = fetchData;

  const refetch = useCallback(async (): Promise<T | null> => {
    if (latestFetchRef.current) {
      return latestFetchRef.current();
    }
    return null;
  }, []);

  const clearCache = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      isStale: false,
      lastFetched: null,
    });
  }, []);

  // Combined effect - prevents race condition
  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true;

    // Initial fetch - call fetchData directly to ensure it's available
    if (enabled && url) {
      fetchData();
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled]); // Only depend on url and enabled, fetchData is accessed via closure

  return {
    ...state,
    refetch,
    clearCache,
  };
}
