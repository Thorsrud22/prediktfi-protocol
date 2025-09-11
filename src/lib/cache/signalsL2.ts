/**
 * L2 Cache for Signals with SWR (Stale-While-Revalidate)
 * Provides in-memory caching with singleflight pattern
 */

import { MarketSignal } from '../../server/signals/feed';

export interface CacheEntry {
  etag: string;
  payload: MarketSignal[];
  ts: number;
}

interface CacheStore {
  current?: CacheEntry;
  inflight?: Promise<CacheEntry>;
}

const store: CacheStore = {};
export const TTL_MS = 180_000; // 3 minutes
export const SWR_MS = 120_000; // 2 minutes

/**
 * Get fresh cache entry (within TTL)
 */
export function getFresh(now: number): CacheEntry | undefined {
  if (!store.current) return undefined;
  
  const age = now - store.current.ts;
  return age < TTL_MS ? store.current : undefined;
}

/**
 * Get stale but serveable cache entry (within TTL + SWR)
 */
export function getStaleButServeable(now: number): CacheEntry | undefined {
  if (!store.current) return undefined;
  
  const age = now - store.current.ts;
  return age >= TTL_MS && age < (TTL_MS + SWR_MS) ? store.current : undefined;
}

/**
 * Set cache entry
 */
export function set(entry: CacheEntry): void {
  store.current = entry;
}

/**
 * Get or refresh cache entry with singleflight
 * Prevents multiple simultaneous refreshes for the same key
 */
export function getOrRefresh(
  key: string,
  refresher: () => Promise<CacheEntry>
): Promise<CacheEntry> {
  if (store.inflight) return store.inflight;
  
  store.inflight = refresher()
    .then(e => (set(e), e))
    .finally(() => { 
      store.inflight = undefined; 
    });
    
  return store.inflight;
}

/**
 * Clear cache (for testing)
 */
export function clear(): void {
  store.current = undefined;
  store.inflight = undefined;
}

/**
 * Get cache statistics
 */
export function getStats(): {
  hasCurrent: boolean;
  hasInflight: boolean;
  currentAge?: number;
} {
  const now = Date.now();
  return {
    hasCurrent: !!store.current,
    hasInflight: !!store.inflight,
    currentAge: store.current ? now - store.current.ts : undefined
  };
}
