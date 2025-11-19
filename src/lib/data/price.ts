// Price data fetching and caching for analysis engine
// Provides market data from external sources with quality scoring

import { PriceSeries, Candle } from '../analysis/types';
import { clamp01 } from '../analysis/utils';

// Cache storage for market data
const marketDataCache = new Map<string, { data: PriceSeries; expires: number }>();

/**
 * Fetches market chart data from CoinGecko with caching and quality scoring
 * @param assetId - Asset identifier (e.g., 'bitcoin')
 * @param vsCurrency - Currency to compare against (e.g., 'usd')
 * @param days - Number of days of historical data
 * @param ttlSec - Time to live in seconds for cache (default: 120)
 * @returns PriceSeries with candles and quality score (0-1)
 */
export async function fetchMarketChart(
  assetId: string,
  vsCurrency: string,
  days: number,
  ttlSec: number = 120
): Promise<PriceSeries> {
  const startTime = Date.now();
  const cacheKey = `${assetId}-${vsCurrency}-${days}`;
  const now = Date.now();
  
  // Check cache first
  const cached = marketDataCache.get(cacheKey);
  if (cached && now < cached.expires) {
    if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
      console.debug('Price data cache hit', { assetId, duration: Date.now() - startTime });
    }
    return cached.data;
  }

  // Setup request with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${assetId}/market_chart?vs_currency=${vsCurrency}&days=${days}`;
    const res = await fetch(url, { signal: controller.signal });
    
    if (!res.ok) {
      throw new Error(`CoinGecko API error: ${res.status}`);
    }

    const data = await res.json();
    
    // Validate response structure
    if (!Array.isArray(data.prices)) {
      throw new Error('Invalid response: prices array missing');
    }

    // Transform to Candle format
    const candles: Candle[] = [];
    let prevClose = 0;

    for (let i = 0; i < data.prices.length; i++) {
      const [timestamp, price] = data.prices[i];
      const volume = data.total_volumes?.[i]?.[1] || 0;
      
      const close = price;
      const open = i === 0 ? close : prevClose;
      const high = Math.max(open, close);
      const low = Math.min(open, close);

      candles.push({
        t: timestamp,
        o: open,
        h: high,
        l: low,
        c: close,
        v: volume
      });

      prevClose = close;
    }

    // Calculate quality score
    let quality = 1.0;
    
    // Penalize time gaps larger than 6 hours
    for (let i = 1; i < candles.length; i++) {
      const timeDiff = candles[i].t - candles[i - 1].t;
      const sixHours = 6 * 60 * 60 * 1000;
      if (timeDiff > sixHours) {
        quality -= 0.05;
      }
    }
    
    // Low data count penalty
    if (candles.length < 10) {
      quality = 0.2;
    }
    
    // Clamp quality to 0-1 range
    quality = clamp01(quality);

    const result: PriceSeries = {
      assetId,
      vsCurrency,
      candles,
      source: 'coingecko',
      quality,
      fetchedAt: Date.now()
    };

    // Cache the result
    marketDataCache.set(cacheKey, {
      data: result,
      expires: now + (ttlSec * 1000)
    });

    if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
      console.debug('Price data fetched', { 
        assetId, 
        duration: Date.now() - startTime,
        quality,
        candleCount: candles.length 
      });
    }

    return result;

  } finally {
    clearTimeout(timeoutId);
  }
}

export interface PriceDataSource {
  source: string;
  fetchedAt: Date;
}
