/**
 * Market Signals Feed
 * Provides lightweight market context data with caching and timeouts
 */

import { setGlobalDispatcher, Agent } from 'undici';
import { fetchPolymarket } from '../../lib/adapters/polymarket';
import { fetchFearGreed } from '../../lib/adapters/fearGreed';
import { fetchFunding } from '../../lib/adapters/funding';
import { etagStore } from '../../lib/cache/etagStore';
import { telemetry } from '../../lib/telemetry';
import { getStaleButServeable } from '../../lib/cache/signalsL2';

// Set up undici keep-alive agent for better performance
setGlobalDispatcher(new Agent({
  keepAliveTimeout: 10_000,
  connections: 100
}));

export interface MarketSignal {
  type: 'polymarket' | 'fear_greed' | 'trend' | 'funding' | 'sentiment';
  label: string;
  value?: number;
  prob?: number;
  direction?: 'up' | 'down' | 'neutral';
  ts: string; // ISO timestamp
}

export interface SignalsFeedData {
  items: MarketSignal[];
  updatedAt: string;
}

// In-memory cache
interface CacheEntry {
  data: SignalsFeedData;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 180 * 1000; // 3 minutes
const REQUEST_TIMEOUT_MS = 800; // Per source timeout
const TOTAL_BUDGET_MS = 1200; // Total budget

// Circuit breaker states per source
interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failEma: number;
  windowN: number;
  openedAt?: number;
  backoffMs?: number;
  lastOkTs?: string;
}

const circuitBreakers = new Map<string, CircuitBreakerState>();

// Initialize circuit breakers for known sources
const SOURCES = ['polymarket', 'fear_greed', 'funding'];

SOURCES.forEach(source => {
  if (!circuitBreakers.has(source)) {
    circuitBreakers.set(source, {
      state: 'closed',
      failEma: 0,
      windowN: 0
    });
  }
});

/**
 * Creates a timeout promise that rejects after specified ms
 */
function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
}

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  return Promise.race([
    fetch(url, { 
      headers: { 'User-Agent': 'PrediktFi/1.0' },
      signal: AbortSignal.timeout(timeoutMs)
    }),
    createTimeout(timeoutMs)
  ]);
}

/**
 * Update circuit breaker state for a source
 */
function updateCircuitBreaker(source: string, success: boolean, elapsedMs: number): void {
  const breaker = circuitBreakers.get(source);
  if (!breaker) return;

  const now = Date.now();
  const windowSize = 120000; // 2 minutes
  const failureThreshold = 0.5;
  const minWindowSize = 10;

  // Update failure EMA (exponential moving average)
  const alpha = 0.1; // Smoothing factor
  const failure = success ? 0 : 1;
  breaker.failEma = alpha * failure + (1 - alpha) * breaker.failEma;

  // Update window count
  breaker.windowN++;

  // Reset window if too old
  if (breaker.openedAt && (now - breaker.openedAt) > windowSize) {
    breaker.windowN = 1;
    breaker.openedAt = now;
  }

  // State transitions
  switch (breaker.state) {
    case 'closed':
      if (breaker.failEma > failureThreshold && breaker.windowN >= minWindowSize) {
        breaker.state = 'open';
        breaker.openedAt = now;
        breaker.backoffMs = 500; // Start with 500ms backoff
        console.log(`Circuit breaker OPENED for ${source} (failEma: ${breaker.failEma.toFixed(3)}, windowN: ${breaker.windowN})`);
      }
      break;

    case 'open':
      // Check if we should move to half-open
      if (breaker.openedAt && (now - breaker.openedAt) > 60000) { // 60s cooldown
        breaker.state = 'half-open';
        breaker.windowN = 0;
        console.log(`Circuit breaker HALF-OPEN for ${source}`);
      }
      break;

    case 'half-open':
      if (success) {
        breaker.state = 'closed';
        breaker.failEma = 0;
        breaker.windowN = 0;
        breaker.lastOkTs = new Date().toISOString();
        console.log(`Circuit breaker CLOSED for ${source}`);
      } else {
        // Exponential backoff: 0.5s -> 1s -> 2s -> 4s -> 8s (max)
        breaker.state = 'open';
        breaker.backoffMs = Math.min((breaker.backoffMs || 500) * 2, 8000);
        breaker.openedAt = now;
        console.log(`Circuit breaker RE-OPENED for ${source} (backoff: ${breaker.backoffMs}ms)`);
      }
      break;
  }
}

/**
 * Check if circuit breaker allows request for source
 */
function isCircuitBreakerOpen(source: string): boolean {
  const breaker = circuitBreakers.get(source);
  return breaker?.state === 'open';
}

/**
 * Get circuit breaker state for monitoring
 */
function getCircuitBreakerState(source: string): CircuitBreakerState | undefined {
  return circuitBreakers.get(source);
}

/**
 * Create adapter context for external API calls
 */
function createAdapterCtx(now: Date, timeoutMs: number) {
  return {
    now,
    timeoutMs,
    etagStore,
    fetchImpl: fetch,
    telemetry
  };
}

/**
 * Fetch all signals with timeout and error handling
 */
async function fetchSignals(): Promise<MarketSignal[]> {
  const startTime = Date.now();
  const now = new Date();
  const signals: MarketSignal[] = [];
  
  // Create adapter context
  const ctx = createAdapterCtx(now, REQUEST_TIMEOUT_MS);
  
  // Map sources to their fetch functions
  const sourceMap = [
    { name: 'fear_greed', fetch: () => fetchFearGreed(ctx) },
    { name: 'funding', fetch: () => fetchFunding(ctx) },
    { name: 'polymarket', fetch: () => fetchPolymarket(ctx) }
  ];
  
  // Check circuit breakers and prepare promises
  const adapterPromises = sourceMap.map(async ({ name, fetch }) => {
    // Check if circuit breaker is open
    if (isCircuitBreakerOpen(name)) {
      console.log(`Circuit breaker OPEN for ${name}, skipping request`);
      return { items: [], ok: false, timedOut: false, source: name, circuitBreakerOpen: true };
    }
    
    const sourceStartTime = Date.now();
    try {
      const result = await Promise.race([
        fetch(),
        createTimeout(REQUEST_TIMEOUT_MS)
      ]);
      
      const elapsed = Date.now() - sourceStartTime;
      const success = result.ok && !result.timedOut;
      
      // Update circuit breaker
      updateCircuitBreaker(name, success, elapsed);
      
      return { ...result, source: name, elapsed };
    } catch (error) {
      const elapsed = Date.now() - sourceStartTime;
      updateCircuitBreaker(name, false, elapsed);
      return { items: [], ok: false, timedOut: true, source: name, error };
    }
  });
  
  try {
    // Wait for all signals with total budget timeout
    const results = await Promise.race([
      Promise.allSettled(adapterPromises),
      createTimeout(TOTAL_BUDGET_MS)
    ]);
    
    // Process results and collect signals
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.ok) {
        for (const signal of result.value.items) {
          if (signals.length < 5) {
            signals.push(signal);
          }
        }
      }
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`Signals fetch completed in ${elapsed}ms, got ${signals.length} signals`);
    
    // Log telemetry for monitoring
    const metrics = telemetry.getAllMetrics();
    for (const [source, data] of Object.entries(metrics)) {
      const breaker = getCircuitBreakerState(source);
      console.log(`${source}: success_rate=${data.success_rate.toFixed(2)}, p95_ms=${data.p95_ms}ms, breaker=${breaker?.state || 'unknown'}`);
    }
    
  } catch (error) {
    console.warn('Signals fetch timeout or error:', error);
  }
  
  return signals;
}

/**
 * Get cached signals or fetch fresh data
 */
export async function getMarketSignals(pair?: string): Promise<SignalsFeedData> {
  const cacheKey = pair || 'default';
  const now = Date.now();
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }
  
  // Check if any circuit breakers are open
  const hasOpenBreakers = SOURCES.some(source => isCircuitBreakerOpen(source));
  
  if (hasOpenBreakers) {
    console.log('Circuit breakers open, attempting to serve stale data');
    
    // Try to get stale data from L2 cache
    const stale = getStaleButServeable(now);
    if (stale) {
      console.log('Serving stale data due to circuit breaker');
      return {
        items: stale.payload,
        updatedAt: new Date(stale.ts).toISOString()
      };
    }
    
    // If no stale data available, return empty but don't cache it
    console.log('No stale data available, returning empty signals');
    return {
      items: [],
      updatedAt: new Date().toISOString()
    };
  }
  
  // Fetch fresh data
  const signals = await fetchSignals();
  const data: SignalsFeedData = {
    items: signals,
    updatedAt: new Date().toISOString()
  };
  
  // Update cache
  cache.set(cacheKey, {
    data,
    expiresAt: now + CACHE_TTL_MS
  });
  
  return data;
}

/**
 * Clear cache (useful for testing)
 */
export function clearSignalsCache(): void {
  cache.clear();
}

/**
 * Get circuit breaker state for monitoring
 */
export function getCircuitBreakerStates(): Record<string, CircuitBreakerState> {
  const states: Record<string, CircuitBreakerState> = {};
  for (const [source, state] of circuitBreakers) {
    states[source] = { ...state };
  }
  return states;
}

/**
 * Reset circuit breaker for a source (useful for testing)
 */
export function resetCircuitBreaker(source: string): void {
  const breaker = circuitBreakers.get(source);
  if (breaker) {
    breaker.state = 'closed';
    breaker.failEma = 0;
    breaker.windowN = 0;
    breaker.openedAt = undefined;
    breaker.backoffMs = undefined;
  }
}
