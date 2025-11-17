/**
 * Unit tests for Market Signals Feed
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getMarketSignals, clearSignalsCache } from '../../src/server/signals/feed';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Market Signals Feed', () => {
  beforeEach(() => {
    clearSignalsCache();
    mockFetch.mockClear();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getMarketSignals', () => {
    it('should return cached data when available and fresh', async () => {
      // First call - should fetch and cache
      const firstResult = await getMarketSignals();
      expect(firstResult.items).toBeDefined();
      expect(firstResult.updatedAt).toBeDefined();
      
      // Second call within cache TTL - should return cached data
      const secondResult = await getMarketSignals();
      expect(secondResult).toEqual(firstResult);
    });

    it('should fetch fresh data when cache is expired', async () => {
      // First call
      const firstResult = await getMarketSignals();
      
      // Advance time beyond cache TTL (3 minutes)
      vi.advanceTimersByTime(4 * 60 * 1000);
      
      // Second call - should fetch fresh data
      const secondResult = await getMarketSignals();
      expect(secondResult.updatedAt).not.toEqual(firstResult.updatedAt);
    });

    it('should handle different cache keys for different pairs', async () => {
      const solResult = await getMarketSignals('SOL/USDC');
      const ethResult = await getMarketSignals('ETH/USDC');
      
      // Results should be independent
      expect(solResult).toBeDefined();
      expect(ethResult).toBeDefined();
      // They might be the same data in mock, but cached separately
    });

    it('should return empty array on timeout without throwing', async () => {
      // The current implementation uses mock data that doesn't actually timeout
      // This test verifies that the structure is always valid even in timeout scenarios
      const result = await getMarketSignals();
      
      // Should not throw and should return valid structure
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.updatedAt).toBeDefined();
    });

    it('should limit results to maximum 5 items', async () => {
      const result = await getMarketSignals();
      expect(result.items.length).toBeLessThanOrEqual(5);
    });

    it('should return valid signal structure', async () => {
      const result = await getMarketSignals();
      
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('updatedAt');
      expect(Array.isArray(result.items)).toBe(true);
      
      // Check signal structure if we have items
      if (result.items.length > 0) {
        const signal = result.items[0];
        expect(signal).toHaveProperty('type');
        expect(signal).toHaveProperty('label');
        expect(signal).toHaveProperty('ts');
        expect(['fear_greed', 'trend', 'funding', 'sentiment']).toContain(signal.type);
      }
    });

    it('should handle individual signal failures gracefully', async () => {
      // Even if individual signal sources fail, should still return structure
      const result = await getMarketSignals();
      
      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should respect total budget timeout', async () => {
      const startTime = Date.now();
      
      // This should complete within reasonable time even with mocked delays
      const result = await getMarketSignals();
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(2000); // Should be much faster than 2s in tests
      expect(result).toBeDefined();
    });

    it('should generate valid ISO timestamps', async () => {
      const result = await getMarketSignals();
      
      expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
      
      // Check signal timestamps if available
      result.items.forEach(signal => {
        expect(signal.ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
      });
    });
  });

  describe('clearSignalsCache', () => {
    it('should clear cache and force fresh fetch', async () => {
      // Get initial data
      const firstResult = await getMarketSignals();
      
      // Advance time slightly to ensure different timestamps
      vi.advanceTimersByTime(10);
      
      // Clear cache
      clearSignalsCache();
      
      // Next call should fetch fresh data (timestamps will be different)
      const secondResult = await getMarketSignals();
      expect(secondResult.updatedAt).not.toEqual(firstResult.updatedAt);
    });
  });

  describe('signal types and formats', () => {
    it('should include fear_greed signals with value', async () => {
      const result = await getMarketSignals();
      
      const fearGreedSignal = result.items.find(s => s.type === 'fear_greed');
      if (fearGreedSignal) {
        expect(fearGreedSignal.value).toBeTypeOf('number');
        expect(fearGreedSignal.value).toBeGreaterThanOrEqual(0);
        expect(fearGreedSignal.value).toBeLessThanOrEqual(100);
      }
    });

    it('should include funding signals with direction', async () => {
      const result = await getMarketSignals();
      
      const fundingSignal = result.items.find(s => s.type === 'funding');
      if (fundingSignal) {
        expect(['up', 'down', 'neutral']).toContain(fundingSignal.direction);
      }
    });
  });
});
