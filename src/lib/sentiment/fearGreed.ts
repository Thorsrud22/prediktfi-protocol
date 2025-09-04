// Fear & Greed Index data fetching with caching and regime mapping
// Provides market sentiment analysis for crypto markets

// Cache storage for FNG data
const fngCache = new Map<string, { data: FngData; expires: number }>();

export interface FngData {
  fngNow: number;
  fngPrev: number | null;
  regime: 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';
  quality: number;
}

/**
 * Maps FNG value to sentiment regime
 * @param value - Fear & Greed Index value (0-100)
 * @returns Sentiment regime classification
 */
function mapToRegime(value: number): FngData['regime'] {
  if (value >= 80) return 'extreme_greed';
  if (value >= 60) return 'greed';
  if (value >= 41) return 'neutral';
  if (value >= 21) return 'fear';
  return 'extreme_fear';
}

/**
 * Fetches Fear & Greed Index data with caching
 * @param ttlSec - Time to live in seconds for cache (default: 300)
 * @returns FngData with current, previous values, regime and quality
 */
export async function fetchFng(ttlSec: number = 300): Promise<FngData> {
  const startTime = Date.now();
  const cacheKey = 'fng-data';
  const now = Date.now();
  
  // Check cache first
  const cached = fngCache.get(cacheKey);
  if (cached && now < cached.expires) {
    if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
      console.debug('FNG data cache hit', { duration: Date.now() - startTime });
    }
    return cached.data;
  }

  // Setup request with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const url = 'https://api.alternative.me/fng';
    const res = await fetch(url, { signal: controller.signal });
    
    if (!res.ok) {
      throw new Error(`Fear & Greed API error: ${res.status}`);
    }

    const response = await res.json();
    
    // Validate response structure
    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      throw new Error('Invalid response: data array missing or empty');
    }

    // Parse current and previous values
    const current = response.data[0];
    const previous = response.data[1] || null;
    
    const fngNow = parseInt(current.value);
    const fngPrev = previous ? parseInt(previous.value) : null;
    
    // Calculate quality
    const quality = (!isNaN(fngNow) && (fngPrev === null || !isNaN(fngPrev))) ? 1.0 : 0.2;
    
    const result: FngData = {
      fngNow,
      fngPrev,
      regime: mapToRegime(fngNow),
      quality
    };

    // Cache the result
    fngCache.set(cacheKey, {
      data: result,
      expires: now + (ttlSec * 1000)
    });

    if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
      console.debug('FNG data fetched', { 
        duration: Date.now() - startTime,
        fngNow,
        regime: result.regime,
        quality 
      });
    }

    return result;

  } finally {
    clearTimeout(timeoutId);
  }
}
