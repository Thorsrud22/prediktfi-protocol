/**
 * Unit tests for resolution engine
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveInsight, type Insight } from '../../lib/resolution/engine';
import { getPriceAtCloseUTC } from '../../lib/resolvers/price';

// Mock the price resolver
vi.mock('../../lib/resolvers/price', () => ({
  getPriceAtCloseUTC: vi.fn(),
  parsePriceConfig: vi.fn().mockReturnValue({
    asset: 'BTC',
    source: 'coingecko',
    field: 'close',
    currency: 'USD'
  })
}));

// Mock events
vi.mock('../../lib/events', () => ({
  EVENT_TYPES: {
    OUTCOME_RESOLVED: 'outcome_resolved'
  },
  createEvent: vi.fn()
}));

describe('Resolution Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Price Resolution', () => {
    const mockInsight: Insight = {
      id: 'test-insight-1',
      canonical: 'BTC close >= 100000 USD on 2025-12-31',
      p: 0.75,
      deadline: new Date('2025-12-31T23:59:59.999Z'),
      resolverKind: 'PRICE',
      resolverRef: '{"asset":"BTC","source":"coingecko","field":"close"}',
      status: 'COMMITTED'
    };

    it('should resolve YES when price meets condition', async () => {
      // Mock price result above threshold
      vi.mocked(getPriceAtCloseUTC).mockResolvedValue({
        price: 105000,
        timestamp: new Date('2025-12-31T23:59:59.999Z'),
        source: 'coingecko',
        currency: 'USD'
      });

      const result = await resolveInsight(mockInsight);

      expect(result.result).toBe('YES');
      expect(result.decidedBy).toBe('AGENT');
      expect(result.confidence).toBe(0.95);
      expect(result.evidenceMeta).toMatchObject({
        actualPrice: 105000,
        targetPrice: 100000,
        operator: '>=',
        comparison: '105000 >= 100000 = true'
      });
    });

    it('should resolve NO when price does not meet condition', async () => {
      // Mock price result below threshold
      vi.mocked(getPriceAtCloseUTC).mockResolvedValue({
        price: 95000,
        timestamp: new Date('2025-12-31T23:59:59.999Z'),
        source: 'coingecko',
        currency: 'USD'
      });

      const result = await resolveInsight(mockInsight);

      expect(result.result).toBe('NO');
      expect(result.decidedBy).toBe('AGENT');
      expect(result.evidenceMeta).toMatchObject({
        actualPrice: 95000,
        targetPrice: 100000,
        operator: '>=',
        comparison: '95000 >= 100000 = false'
      });
    });

    it('should resolve INVALID when price data is unavailable', async () => {
      // Mock no price data
      vi.mocked(getPriceAtCloseUTC).mockResolvedValue(null);

      const result = await resolveInsight(mockInsight);

      expect(result.result).toBe('INVALID');
      expect(result.decidedBy).toBe('AGENT');
      expect(result.evidenceMeta?.error).toBe('Could not fetch price data');
    });

    it('should handle different comparison operators', async () => {
      const testCases = [
        { canonical: 'BTC close > 50000 USD on 2025-12-31', price: 55000, expected: 'YES' },
        { canonical: 'BTC close > 50000 USD on 2025-12-31', price: 45000, expected: 'NO' },
        { canonical: 'BTC close < 50000 USD on 2025-12-31', price: 45000, expected: 'YES' },
        { canonical: 'BTC close < 50000 USD on 2025-12-31', price: 55000, expected: 'NO' },
        { canonical: 'BTC close <= 50000 USD on 2025-12-31', price: 50000, expected: 'YES' },
        { canonical: 'BTC close <= 50000 USD on 2025-12-31', price: 50001, expected: 'NO' },
      ];

      for (const testCase of testCases) {
        vi.mocked(getPriceAtCloseUTC).mockResolvedValue({
          price: testCase.price,
          timestamp: new Date('2025-12-31T23:59:59.999Z'),
          source: 'coingecko',
          currency: 'USD'
        });

        const insight = { ...mockInsight, canonical: testCase.canonical };
        const result = await resolveInsight(insight);

        expect(result.result).toBe(testCase.expected);
      }
    });

    it('should resolve INVALID for unparseable canonical statements', async () => {
      const insight = {
        ...mockInsight,
        canonical: 'Some unparseable statement about Bitcoin'
      };

      const result = await resolveInsight(insight);

      expect(result.result).toBe('INVALID');
      expect(result.evidenceMeta?.error).toBe('Could not parse comparison from canonical statement');
    });

    it('should handle price resolver errors gracefully', async () => {
      // Mock price resolver throwing an error
      vi.mocked(getPriceAtCloseUTC).mockRejectedValue(new Error('API unavailable'));

      const result = await resolveInsight(mockInsight);

      expect(result.result).toBe('INVALID');
      expect(result.decidedBy).toBe('AGENT');
      expect(result.evidenceMeta?.error).toBe('API unavailable');
    });
  });

  describe('URL and Text Resolution', () => {
    it('should return INVALID for URL resolution (not yet implemented)', async () => {
      const insight: Insight = {
        id: 'test-url-1',
        canonical: 'Website will show "Success" by 2025-12-31',
        p: 0.6,
        deadline: new Date('2025-12-31'),
        resolverKind: 'URL',
        resolverRef: '{"href":"https://example.com","expect":"Success"}',
        status: 'COMMITTED'
      };

      const result = await resolveInsight(insight);

      expect(result.result).toBe('INVALID');
      expect(result.evidenceMeta?.error).toBe('URL resolution not yet implemented');
    });

    it('should return INVALID for TEXT resolution (not yet implemented)', async () => {
      const insight: Insight = {
        id: 'test-text-1',
        canonical: 'Event will happen by 2025-12-31',
        p: 0.8,
        deadline: new Date('2025-12-31'),
        resolverKind: 'TEXT',
        resolverRef: '{"expect":"Event happened"}',
        status: 'COMMITTED'
      };

      const result = await resolveInsight(insight);

      expect(result.result).toBe('INVALID');
      expect(result.evidenceMeta?.error).toBe('Text resolution not yet implemented');
    });
  });
});
