import crypto from 'crypto';
import { InsightRequest, InsightResponse } from './_schemas';

interface CacheEntry {
  data: InsightResponse;
  timestamp: number;
  ttl: number;
}

class LRUCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 1000; // Maximum number of entries
  private defaultTTL = parseInt(process.env.CACHE_TTL_SECONDS || '900') * 1000; // 15 minutes default

  private generateKey(request: InsightRequest): string {
    const normalized = {
      question: request.question.toLowerCase().trim(),
      category: request.category.toLowerCase(),
      horizon: request.horizon,
    };
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(normalized));
    return hash.digest('hex');
  }

  get(request: InsightRequest): InsightResponse | null {
    const key = this.generateKey(request);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.timestamp + entry.ttl) {
      // Entry expired
      this.cache.delete(key);
      return null;
    }

    // Move to end (LRU behavior)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.data;
  }

  set(request: InsightRequest, response: InsightResponse, ttl?: number): void {
    const key = this.generateKey(request);
    const entry: CacheEntry = {
      data: response,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    // Remove oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, entry);
  }

  stats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [, entry] of this.cache) {
      if (now <= entry.timestamp + entry.ttl) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      maxSize: this.maxSize,
    };
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global cache instance
export const insightsCache = new LRUCache();
