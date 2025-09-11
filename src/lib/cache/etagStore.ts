/**
 * ETag Store for Signal Adapters
 * Manages ETags for external API responses to enable 304 Not Modified
 */

interface ETagEntry {
  etag: string;
  timestamp: number;
}

class ETagStore {
  private store = new Map<string, ETagEntry>();

  get(source: string): string | null {
    const entry = this.store.get(source);
    if (!entry) return null;
    
    // Check if ETag is still valid (24 hours TTL)
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (now - entry.timestamp > maxAge) {
      this.store.delete(source);
      return null;
    }
    
    return entry.etag;
  }

  set(source: string, etag: string): void {
    this.store.set(source, {
      etag,
      timestamp: Date.now()
    });
  }

  clear(source?: string): void {
    if (source) {
      this.store.delete(source);
    } else {
      this.store.clear();
    }
  }

  getAll(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, entry] of this.store) {
      result[key] = entry.etag;
    }
    return result;
  }
}

export const etagStore = new ETagStore();
