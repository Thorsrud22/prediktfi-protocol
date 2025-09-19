import { describe, it, expect, vi } from 'vitest';
import { normalizePrediction } from '../../lib/normalize';
import { generateSolanaMemo } from '../../lib/memo';

// Mock external dependencies if needed
vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Normalization API Integration', () => {
  describe('Prediction Normalization and Memo Generation', () => {
    it('should normalize prediction and generate memo for API usage', async () => {
      // Step 1: Normalize a natural language prediction
      const question = 'Will Bitcoin reach $100k by end of year?';
      const normalized = normalizePrediction(question, {
        deadline: new Date('2025-12-31T00:00:00.000Z'),
        p: 0.75,
      });

      // Verify normalization
      expect(normalized.canonical).toBe('BTC close >= 100000 USD on 2025-12-31');
      expect(normalized.p).toBe(0.75);
      expect(normalized.resolverKind).toBe('price');

      // Step 2: Generate memo for blockchain stamping
      const memo = generateSolanaMemo(
        'clx123456789', // prediction ID from API
        normalized.canonical,
        normalized.deadline,
        normalized.resolverRef,
      );

      // Verify memo structure
      expect(memo.payload.t).toBe('predikt.v1');
      expect(memo.payload.pid).toBe('clx123456789');
      expect(memo.payload.d).toBe('2025-12-31');
      expect(memo.size).toBeLessThanOrEqual(180);

      // Verify hash consistency
      expect(memo.hash).toHaveLength(64);
      expect(memo.payload.h).toBe(memo.hash); // Full hash in payload
    });

    it('should handle different asset types consistently', async () => {
      const testCases = [
        {
          question: 'Will Ethereum hit $5000 by Q2 2025?',
          expected: 'ETH close >= 5000 USD on 2025-06-30',
        },
        {
          question: 'Solana will be hitting 400USD this year',
          expected: 'SOL close >= 400 USD on 2025-12-31',
        },
        {
          question: 'AAPL will reach $200',
          expected: 'AAPL close >= 200 USD on 2025-12-31',
        },
      ];

      const deadline = new Date('2025-12-31T00:00:00.000Z');

      testCases.forEach(({ question, expected }) => {
        const normalized = normalizePrediction(question, { deadline });
        expect(normalized.canonical).toContain(expected.split(' on ')[0]);
      });
    });

    it('should generate unique hashes for different predictions', async () => {
      const predictions = [
        'Will Bitcoin reach $100k by end of year?',
        'Will Bitcoin reach $80k by end of year?',
        'Will Ethereum reach $5000 by end of year?',
      ];

      const deadline = new Date('2025-12-31T00:00:00.000Z');
      const hashes: string[] = [];

      predictions.forEach(question => {
        const normalized = normalizePrediction(question, { deadline });
        const memo = generateSolanaMemo(
          'test-id',
          normalized.canonical,
          normalized.deadline,
          normalized.resolverRef,
        );
        hashes.push(memo.hash);
      });

      // All hashes should be unique
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(predictions.length);
    });

    it('should maintain hash stability across multiple generations', async () => {
      const question = 'Will Bitcoin reach $100k by end of year?';
      const deadline = new Date('2025-12-31T00:00:00.000Z');

      // Generate the same prediction multiple times
      const hashes = [];
      for (let i = 0; i < 5; i++) {
        const normalized = normalizePrediction(question, { deadline, p: 0.6 });
        const memo = generateSolanaMemo(
          'stable-test',
          normalized.canonical,
          normalized.deadline,
          normalized.resolverRef,
        );
        hashes.push(memo.hash);
      }

      // All hashes should be identical
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(1);
    });

    it('should handle concurrent normalization requests', async () => {
      const questions = [
        'Will Bitcoin reach $100k by 2025?',
        'Will Ethereum reach $5k by 2025?',
        'Will Solana reach $500 by 2025?',
      ];

      const deadline = new Date('2025-12-31T00:00:00.000Z');

      // Process all questions concurrently
      const normalizedPromises = questions.map(question =>
        Promise.resolve(normalizePrediction(question, { deadline })),
      );

      const results = await Promise.all(normalizedPromises);

      // Verify all results are valid
      results.forEach((normalized, index) => {
        expect(normalized.canonical).toBeDefined();
        expect(normalized.deadline).toEqual(deadline);
        expect(normalized.resolverKind).toBe('price');
      });

      // Verify unique canonicals
      const canonicals = results.map(r => r.canonical);
      const uniqueCanonicals = new Set(canonicals);
      expect(uniqueCanonicals.size).toBe(questions.length);
    });
  });

  describe('Resolver Configuration', () => {
    it('should generate correct resolver refs for price predictions', async () => {
      const normalized = normalizePrediction('BTC will hit $100k', {
        resolverKind: 'price',
      });

      const resolverConfig = JSON.parse(normalized.resolverRef);
      expect(resolverConfig).toEqual({
        asset: 'BTC',
        source: 'coingecko',
        field: 'close',
      });
    });

    it('should generate correct resolver refs for URL predictions', async () => {
      const normalized = normalizePrediction('Will there be a recession?', {
        resolverKind: 'url',
        resolverConfig: {
          url: { href: 'https://example.com/recession-check' },
        },
      });

      const resolverConfig = JSON.parse(normalized.resolverRef);
      expect(resolverConfig).toEqual({
        href: 'https://example.com/recession-check',
      });
    });

    it('should generate correct resolver refs for text predictions', async () => {
      const normalized = normalizePrediction('Will AI be sentient by 2030?', {
        resolverKind: 'text',
        resolverConfig: {
          text: { expect: 'AI achieves sentience' },
        },
      });

      const resolverConfig = JSON.parse(normalized.resolverRef);
      expect(resolverConfig).toEqual({
        expect: 'AI achieves sentience',
      });
    });

    it('should handle custom resolver configurations', async () => {
      const customConfig = {
        asset: 'CUSTOM',
        source: 'custom-api',
        field: 'price',
        endpoint: 'https://api.custom.com/v1/price',
      };

      const normalized = normalizePrediction('Will CUSTOM reach $10?', {
        resolverKind: 'price',
        resolverConfig: { price: customConfig },
      });

      const resolverConfig = JSON.parse(normalized.resolverRef);
      expect(resolverConfig).toEqual(customConfig);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very long questions gracefully', async () => {
      const longQuestion =
        'Will Bitcoin reach $100k by end of year and maintain that level for at least 30 days while also having a market cap that exceeds $2 trillion and showing sustained institutional adoption?'.repeat(
          2,
        );

      const normalized = normalizePrediction(longQuestion);

      // Should still produce valid canonical form
      expect(normalized.canonical).toContain('BTC close >= 100000 USD on');

      // Should be able to generate memo
      const memo = generateSolanaMemo(
        'long-test',
        normalized.canonical,
        normalized.deadline,
        normalized.resolverRef,
      );

      expect(memo.size).toBeLessThanOrEqual(180);
    });

    it('should handle special characters in questions', async () => {
      const question = 'Will BTC reach $100,000.00 (one hundred thousand USD) by 2025?';

      const normalized = normalizePrediction(question, {
        deadline: new Date('2025-12-31T00:00:00.000Z'),
      });

      expect(normalized.canonical).toBe('BTC close >= 100000 USD on 2025-12-31');
    });

    it('should handle different date formats consistently', async () => {
      const question = 'Will Bitcoin reach $100k by end of year?';

      const dates = [
        new Date('2025-12-31T00:00:00.000Z'),
        new Date('2025-12-31T23:59:59.999Z'),
        new Date('2025-12-31T12:00:00.000Z'),
      ];

      const canonicals = dates.map(deadline => {
        const normalized = normalizePrediction(question, { deadline });
        return normalized.canonical;
      });

      // All should normalize to the same canonical form (date only)
      const uniqueCanonicals = new Set(canonicals);
      expect(uniqueCanonicals.size).toBe(1);
      expect(canonicals[0]).toBe('BTC close >= 100000 USD on 2025-12-31');
    });

    it('should handle malformed input gracefully', async () => {
      const malformedInputs = [
        '', // Empty string
        '   ', // Whitespace only
        null, // Null input
        undefined, // Undefined input
      ];

      malformedInputs.forEach(input => {
        expect(() => {
          // @ts-ignore - Testing malformed input
          normalizePrediction(input);
        }).not.toThrow();
      });
    });

    it('should handle invalid dates', async () => {
      const question = 'Will Bitcoin reach $100k?';

      const invalidDates = [
        new Date('invalid'),
        new Date(NaN),
        new Date('2025-13-32'), // Invalid month/day
      ];

      invalidDates.forEach(invalidDate => {
        expect(() => {
          normalizePrediction(question, { deadline: invalidDate });
        }).not.toThrow();
      });
    });

    it('should validate memo size constraints', async () => {
      // Test with very long prediction ID and canonical form
      const longId = 'very-long-prediction-id-that-might-exceed-limits'.repeat(3);
      const longCanonical =
        'BTC close >= 100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000 USD on 2025-12-31';

      const memo = generateSolanaMemo(
        longId,
        longCanonical,
        new Date('2025-12-31'),
        '{"asset":"BTC","source":"coingecko","field":"close"}',
      );

      // Even with long inputs, memo should respect size constraints
      expect(memo.size).toBeLessThanOrEqual(180);
      expect(memo.payload).toBeDefined();
      expect(memo.hash).toHaveLength(64);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle batch normalization efficiently', async () => {
      const startTime = Date.now();
      const batchSize = 100;

      const questions = Array.from(
        { length: batchSize },
        (_, i) => `Will Bitcoin reach $${100000 + i * 1000} by 2025?`,
      );

      const results = questions.map(question =>
        normalizePrediction(question, {
          deadline: new Date('2025-12-31T00:00:00.000Z'),
        }),
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete batch normalization quickly (under 1 second)
      expect(duration).toBeLessThan(1000);
      expect(results).toHaveLength(batchSize);

      // All results should be valid
      results.forEach(result => {
        expect(result.canonical).toBeDefined();
        expect(result.deadline).toBeDefined();
      });
    });
  });
});
