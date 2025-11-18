import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runPipeline } from '../../app/api/insights/_pipeline';

// Mock the dependencies
vi.mock('../../app/api/insights/_sources', () => ({
  fetchMultipleMarketData: vi.fn().mockResolvedValue({
    data: [{
      symbol: 'BTC',
      prices: [50000, 51000, 50500, 52000, 53000],
      volumes: [1000, 1100, 900, 1200, 1300],
      timestamps: [1, 2, 3, 4, 5],
    }],
    dataQuality: 0.8,
  }),
  getNewsData: vi.fn().mockResolvedValue([
    { title: 'Bitcoin surges to new highs', score: 0.7, url: 'https://example.com' },
    { title: 'Crypto market shows strength', score: 0.5, url: 'https://example.com' },
  ]),
}));

vi.mock('../../lib/analytics', () => ({
  trackServer: vi.fn(),
}));

describe('Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('runPipeline', () => {
    const sampleRequest = {
      question: 'Will Bitcoin reach $60,000 by end of month?',
      category: 'crypto',
      horizon: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    it('should process a complete insight request', async () => {
      const result = await runPipeline(sampleRequest);

      // Verify response structure
      expect(result).toHaveProperty('probability');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('interval');
      expect(result).toHaveProperty('rationale');
      expect(result).toHaveProperty('scenarios');
      expect(result).toHaveProperty('sources');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('tookMs');

      // Verify value ranges
      expect(result.probability).toBeGreaterThanOrEqual(0);
      expect(result.probability).toBeLessThanOrEqual(1);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      
      // Verify interval
      expect(result.interval.lower).toBeLessThanOrEqual(result.interval.upper);
      expect(result.interval.lower).toBeGreaterThanOrEqual(0);
      expect(result.interval.upper).toBeLessThanOrEqual(1);

      // Verify scenarios
      expect(result.scenarios).toHaveLength(3);
      expect(result.scenarios[0]).toHaveProperty('label');
      expect(result.scenarios[0]).toHaveProperty('probability');
      expect(result.scenarios[0]).toHaveProperty('drivers');

      // Verify scenario probabilities sum to ~1
      const totalProb = result.scenarios.reduce((sum, s) => sum + s.probability, 0);
      expect(totalProb).toBeCloseTo(1, 2);

      // Verify metrics
      expect(result.metrics).toHaveProperty('trend');
      expect(result.metrics).toHaveProperty('sentiment');
      expect(['up', 'down', 'neutral']).toContain(result.metrics.trend);
      expect(result.metrics.sentiment).toBeGreaterThanOrEqual(-1);
      expect(result.metrics.sentiment).toBeLessThanOrEqual(1);

      // Verify processing time
      expect(result.tookMs).toBeGreaterThan(0);
      expect(result.tookMs).toBeLessThan(10000); // Should be under 10 seconds
    });

    it('should handle crypto-related questions', async () => {
      const cryptoRequest = {
        ...sampleRequest,
        question: 'Will Solana outperform Bitcoin this quarter?',
        category: 'cryptocurrency',
      };

      const result = await runPipeline(cryptoRequest);
      expect(result.probability).toBeDefined();
      expect(result.rationale.length).toBeGreaterThan(0);
    });

    it('should generate meaningful rationale', async () => {
      const result = await runPipeline(sampleRequest);
      expect(result.rationale).toContain('%');
      expect(result.rationale.length).toBeGreaterThan(50);
    });

    it('should include data sources', async () => {
      const result = await runPipeline(sampleRequest);
      expect(result.sources).toBeInstanceOf(Array);
      expect(result.sources.length).toBeGreaterThan(0);
      
      result.sources.forEach(source => {
        expect(source).toHaveProperty('name');
        expect(source).toHaveProperty('url');
      });
    });

    it('should handle edge cases gracefully', async () => {
      const edgeRequest = {
        question: 'a',
        category: 'unknown',
        horizon: new Date().toISOString(),
      };

      const result = await runPipeline(edgeRequest);
      expect(result.probability).toBeGreaterThanOrEqual(0);
      expect(result.probability).toBeLessThanOrEqual(1);
      expect(result.confidence).toBeGreaterThan(0);
    });
  });
});
