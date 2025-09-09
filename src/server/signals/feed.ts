/**
 * Market Signals Feed
 * Provides lightweight market context data with caching and timeouts
 */

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
 * Get Fear & Greed Index (mock implementation)
 */
async function getFearGreedSignal(): Promise<MarketSignal | null> {
  try {
    // Mock implementation - replace with real API
    const mockValue = 45 + Math.floor(Math.random() * 30); // 45-75 range
    const label = mockValue > 60 ? 'Greed' : mockValue < 40 ? 'Fear' : 'Neutral';
    
    return {
      type: 'fear_greed',
      label: `${label} (${mockValue})`,
      value: mockValue,
      ts: new Date().toISOString()
    };
  } catch (error) {
    console.warn('Fear & Greed signal failed:', error);
    return null;
  }
}

/**
 * Get funding rate trend (mock implementation)
 */
async function getFundingSignal(): Promise<MarketSignal | null> {
  try {
    // Mock implementation - replace with real funding rate API
    const directions = ['up', 'down', 'neutral'] as const;
    const direction = directions[Math.floor(Math.random() * directions.length)];
    const symbols = ['SOL', 'ETH', 'BTC'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    
    const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
    
    return {
      type: 'funding',
      label: `${symbol} funding ${arrow}`,
      direction,
      ts: new Date().toISOString()
    };
  } catch (error) {
    console.warn('Funding signal failed:', error);
    return null;
  }
}

/**
 * Get Polymarket prediction (mock implementation)
 */
async function getPolymarketSignal(): Promise<MarketSignal | null> {
  try {
    // Mock implementation - replace with real Polymarket API
    const predictions = [
      { label: 'ETH > $4000 by Q4', prob: 0.62 },
      { label: 'SOL > $300 by EOY', prob: 0.45 },
      { label: 'BTC new ATH Q1', prob: 0.38 }
    ];
    
    const prediction = predictions[Math.floor(Math.random() * predictions.length)];
    
    return {
      type: 'polymarket',
      label: prediction.label,
      prob: prediction.prob,
      ts: new Date().toISOString()
    };
  } catch (error) {
    console.warn('Polymarket signal failed:', error);
    return null;
  }
}

/**
 * Fetch all signals with timeout and error handling
 */
async function fetchSignals(): Promise<MarketSignal[]> {
  const startTime = Date.now();
  const signals: MarketSignal[] = [];
  
  // Fetch signals in parallel with individual timeouts
  const signalPromises = [
    getFearGreedSignal(),
    getFundingSignal(),
    getPolymarketSignal()
  ].map(promise => 
    Promise.race([
      promise,
      createTimeout(REQUEST_TIMEOUT_MS)
    ]).catch(() => null) // Convert errors to null
  );
  
  try {
    // Wait for all signals with total budget timeout
    const results = await Promise.race([
      Promise.all(signalPromises),
      createTimeout(TOTAL_BUDGET_MS)
    ]);
    
    // Filter out null results and limit to 5 items
    for (const signal of results) {
      if (signal && signals.length < 5) {
        signals.push(signal);
      }
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`Signals fetch completed in ${elapsed}ms, got ${signals.length} signals`);
    
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
