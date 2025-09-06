/**
 * Price Resolution System
 * Fetches price data for automatic outcome resolution
 */

export interface PriceSource {
  name: string;
  getPriceAtClose(asset: string, date: Date): Promise<PriceResult | null>;
}

export interface PriceResult {
  price: number;
  timestamp: Date;
  source: string;
  currency: string;
}

export interface PriceConfig {
  asset: string;
  source?: string;
  field?: string;
  currency?: string;
}

// Circuit breaker for external API calls
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold = 3;
  private readonly timeout = 30000; // 30 seconds

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isOpen(): boolean {
    return this.failures >= this.threshold && 
           (Date.now() - this.lastFailureTime) < this.timeout;
  }

  private onSuccess(): void {
    this.failures = 0;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
  }
}

// CoinGecko adapter (Primary source)
class CoinGeckoSource implements PriceSource {
  name = 'coingecko';
  private circuitBreaker = new CircuitBreaker();
  private cache = new Map<string, { data: PriceResult; expires: number }>();

  async getPriceAtClose(asset: string, date: Date): Promise<PriceResult | null> {
    const cacheKey = `${asset}-${date.toISOString().split('T')[0]}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    return this.circuitBreaker.execute(async () => {
      const coinId = this.mapAssetToCoinId(asset);
      if (!coinId) return null;

      // Format date as DD-MM-YYYY for CoinGecko API
      const dateStr = date.toLocaleDateString('en-GB');
      
      const url = `https://api.coingecko.com/api/v3/coins/${coinId}/history?date=${dateStr}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'PrediktFi/1.0',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.market_data?.current_price?.usd) {
        return null;
      }

      const result: PriceResult = {
        price: this.roundPrice(data.market_data.current_price.usd, asset),
        timestamp: date,
        source: this.name,
        currency: 'USD'
      };

      // Cache for 1 hour
      this.cache.set(cacheKey, {
        data: result,
        expires: Date.now() + 3600000
      });

      return result;
    });
  }

  private mapAssetToCoinId(asset: string): string | null {
    const mapping: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'ADA': 'cardano',
      'DOT': 'polkadot',
      'AVAX': 'avalanche-2',
      'MATIC': 'matic-network',
      'LINK': 'chainlink',
      'UNI': 'uniswap'
    };
    
    return mapping[asset.toUpperCase()] || null;
  }

  private roundPrice(price: number, asset: string): number {
    // Crypto: 8 decimals, Fiat: 2 decimals
    const decimals = this.isFiat(asset) ? 2 : 8;
    return Math.round(price * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  private isFiat(asset: string): boolean {
    const fiatAssets = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
    return fiatAssets.includes(asset.toUpperCase());
  }
}

// CoinCap adapter (Secondary source)
class CoinCapSource implements PriceSource {
  name = 'coincap';
  private circuitBreaker = new CircuitBreaker();

  async getPriceAtClose(asset: string, date: Date): Promise<PriceResult | null> {
    return this.circuitBreaker.execute(async () => {
      const assetId = asset.toLowerCase();
      
      // CoinCap historical data endpoint
      const startTime = date.getTime();
      const endTime = startTime + 24 * 60 * 60 * 1000; // Next day
      
      const url = `https://api.coincap.io/v2/assets/${assetId}/history?interval=h1&start=${startTime}&end=${endTime}`;
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`CoinCap API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        return null;
      }

      // Get the last price of the day (closest to 23:59:59 UTC)
      const lastPrice = data.data[data.data.length - 1];
      
      return {
        price: this.roundPrice(parseFloat(lastPrice.priceUsd), asset),
        timestamp: new Date(lastPrice.time),
        source: this.name,
        currency: 'USD'
      };
    });
  }

  private roundPrice(price: number, asset: string): number {
    const decimals = this.isFiat(asset) ? 2 : 8;
    return Math.round(price * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  private isFiat(asset: string): boolean {
    const fiatAssets = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
    return fiatAssets.includes(asset.toUpperCase());
  }
}

// Main price resolution function
export async function getPriceAtCloseUTC(
  asset: string, 
  date: Date,
  config?: PriceConfig
): Promise<PriceResult | null> {
  // Ensure we're working with UTC date at end of day
  const utcDate = new Date(date.toISOString().split('T')[0] + 'T23:59:59.999Z');
  
  // Initialize sources based on config
  const primarySource = process.env.PRICE_PRIMARY === 'coincap' ? 
    new CoinCapSource() : new CoinGeckoSource();
  const secondarySource = process.env.PRICE_SECONDARY === 'coingecko' ? 
    new CoinGeckoSource() : new CoinCapSource();

  // Try primary source first
  try {
    console.log(`Fetching ${asset} price for ${utcDate.toISOString()} from ${primarySource.name}`);
    const result = await retryWithBackoff(() => primarySource.getPriceAtClose(asset, utcDate));
    if (result) {
      console.log(`✅ Got price from ${primarySource.name}: $${result.price}`);
      return result;
    }
  } catch (error) {
    console.warn(`❌ Primary source ${primarySource.name} failed:`, error);
  }

  // Fallback to secondary source
  try {
    console.log(`Trying secondary source ${secondarySource.name}`);
    const result = await retryWithBackoff(() => secondarySource.getPriceAtClose(asset, utcDate));
    if (result) {
      console.log(`✅ Got price from ${secondarySource.name}: $${result.price}`);
      return result;
    }
  } catch (error) {
    console.warn(`❌ Secondary source ${secondarySource.name} failed:`, error);
  }

  console.error(`❌ All price sources failed for ${asset} on ${utcDate.toISOString()}`);
  return null;
}

// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

// Parse resolver reference for price predictions
export function parsePriceConfig(resolverRef: string): PriceConfig {
  try {
    const config = JSON.parse(resolverRef);
    return {
      asset: config.asset || 'BTC',
      source: config.source || 'coingecko',
      field: config.field || 'close',
      currency: config.currency || 'USD'
    };
  } catch (error) {
    // Fallback to default config
    return {
      asset: 'BTC',
      source: 'coingecko',
      field: 'close',
      currency: 'USD'
    };
  }
}
