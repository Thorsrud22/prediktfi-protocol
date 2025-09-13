import { getQuote } from './jupiter';
import { latencyMonitor } from '../monitoring/latency';

interface CachedQuote {
  quote: any;
  timestamp: number;
  ttl: number;
}

interface QuoteCacheKey {
  pair: string;
  size: number;
  route?: string;
}

class QuoteCache {
  private cache = new Map<string, CachedQuote>();
  private readonly defaultTTL = 4000; // 4 seconds
  private readonly maxTTL = 5000; // 5 seconds

  private generateKey(key: QuoteCacheKey): string {
    const { pair, size, route } = key;
    return `${pair}:${size}:${route || 'default'}`;
  }

  private isExpired(cached: CachedQuote): boolean {
    return Date.now() - cached.timestamp > cached.ttl;
  }

  async getQuote(
    inputMint: string,
    outputMint: string,
    inputAmount: number,
    slippageBps: number = 50,
    ttl?: number
  ): Promise<any> {
    const pair = `${inputMint}/${outputMint}`;
    const key = this.generateKey({
      pair,
      size: inputAmount,
      route: undefined // Could be enhanced with route info
    });

    // Check cache first
    const cached = this.cache.get(key);
    if (cached && !this.isExpired(cached)) {
      console.log(`📦 Quote cache hit for ${pair}`);
      return cached.quote;
    }

    // Fetch fresh quote
    console.log(`🌐 Fetching fresh quote for ${pair}`);
    const quoteStartTime = Date.now();
    const quote = await getQuote(inputMint, outputMint, inputAmount.toString(), slippageBps);
    const quoteDuration = Date.now() - quoteStartTime;
    latencyMonitor.recordMetric('quote', quoteDuration, true);
    
    // Cache the quote
    this.cache.set(key, {
      quote,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });

    // Clean up expired entries
    this.cleanup();

    return quote;
  }

  async prefetchQuote(
    inputMint: string,
    outputMint: string,
    inputAmount: number,
    slippageBps: number = 50
  ): Promise<void> {
    try {
      await this.getQuote(inputMint, outputMint, inputAmount, slippageBps);
      console.log(`🚀 Prefetched quote for ${inputMint}/${outputMint}`);
    } catch (error) {
      console.warn(`⚠️ Failed to prefetch quote for ${inputMint}/${outputMint}:`, error);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (this.isExpired(cached)) {
        this.cache.delete(key);
      }
    }
  }

  // Check if price has changed significantly
  async checkPriceChange(
    inputMint: string,
    outputMint: string,
    inputAmount: number,
    thresholdBps: number = 10 // 0.1% threshold
  ): Promise<{ changed: boolean; oldPrice?: number; newPrice?: number }> {
    const pair = `${inputMint}/${outputMint}`;
    const key = this.generateKey({
      pair,
      size: inputAmount,
      route: undefined
    });

    const cached = this.cache.get(key);
    if (!cached || this.isExpired(cached)) {
      return { changed: true }; // No cached data, consider it changed
    }

    try {
      const newQuote = await getQuote(inputMint, outputMint, inputAmount.toString(), 50);
      const oldPrice = parseFloat(cached.quote.outAmount) / parseFloat(cached.quote.inAmount);
      const newPrice = parseFloat(newQuote.outAmount) / parseFloat(newQuote.inAmount);
      
      const priceChangeBps = Math.abs(newPrice - oldPrice) / oldPrice * 10000;
      const changed = priceChangeBps > thresholdBps;

      if (changed) {
        // Update cache with new quote
        this.cache.set(key, {
          quote: newQuote,
          timestamp: Date.now(),
          ttl: this.defaultTTL
        });
      }

      return { changed, oldPrice, newPrice };
    } catch (error) {
      console.warn(`⚠️ Failed to check price change for ${pair}:`, error);
      return { changed: false };
    }
  }

  // Get cache stats for monitoring
  getStats(): { size: number; hitRate: number; oldestEntry?: number } {
    const now = Date.now();
    let oldestEntry: number | undefined;
    
    for (const cached of this.cache.values()) {
      if (!oldestEntry || cached.timestamp < oldestEntry) {
        oldestEntry = cached.timestamp;
      }
    }

    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses for real hit rate
      oldestEntry: oldestEntry ? now - oldestEntry : undefined
    };
  }

  // Clear cache (useful for testing)
  clear(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const quoteCache = new QuoteCache();

// Export types
export type { QuoteCacheKey, CachedQuote };
