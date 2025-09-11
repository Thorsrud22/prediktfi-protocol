/**
 * Unit tests for Funding adapter
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchFunding } from './funding';

// Mock fetch implementation
const mockFetch = vi.fn();
const mockEtagStore = {
  get: vi.fn(),
  set: vi.fn()
};
const mockTelemetry = {
  start: vi.fn(() => ({ startTime: Date.now() })),
  end: vi.fn()
};

const createCtx = (timeoutMs = 800) => ({
  now: new Date('2025-09-09T12:00:00Z'),
  timeoutMs,
  etagStore: mockEtagStore,
  fetchImpl: mockFetch,
  telemetry: mockTelemetry
});

describe('fetchFunding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return funding data on 200 OK', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Map([['ETag', '"funding-etag-123"']]),
      json: () => Promise.resolve([
        {
          symbol: 'BTCUSDT',
          lastFundingRate: '0.0002' // Above 0.0001 threshold
        },
        {
          symbol: 'ETHUSDT',
          lastFundingRate: '-0.0002' // Below -0.0001 threshold
        }
      ])
    };
    mockFetch.mockResolvedValue(mockResponse);

    const ctx = createCtx();
    const result = await fetchFunding(ctx);

    expect(result).toEqual({
      items: [
        {
          type: 'funding',
          label: 'BTC funding ↑',
          direction: 'up',
          ts: '2025-09-09T12:00:00.000Z'
        },
        {
          type: 'funding',
          label: 'ETH funding ↓',
          direction: 'down',
          ts: '2025-09-09T12:00:00.000Z'
        }
      ],
      ok: true,
      timedOut: false,
      etag: '"funding-etag-123"'
    });

    expect(mockEtagStore.set).toHaveBeenCalledWith('funding', '"funding-etag-123"');
    expect(mockTelemetry.end).toHaveBeenCalledWith('funding', {
      ok: true,
      timedOut: false,
      elapsedMs: expect.any(Number)
    });
  });

  it('should handle different funding rates', async () => {
    const testCases = [
      { rate: '0.0002', expected: 'up' }, // Above 0.0001 threshold
      { rate: '-0.0002', expected: 'down' }, // Below -0.0001 threshold
      { rate: '0.00005', expected: 'neutral' } // Between thresholds
    ];

    for (const testCase of testCases) {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map(),
        json: () => Promise.resolve([
          {
            symbol: 'BTCUSDT',
            lastFundingRate: testCase.rate
          }
        ])
      };
      mockFetch.mockResolvedValue(mockResponse);

      const ctx = createCtx();
      const result = await fetchFunding(ctx);

      expect(result.items[0].direction).toBe(testCase.expected);
      
      // Clear mocks for next iteration
      vi.clearAllMocks();
    }
  });

  it('should handle 304 Not Modified', async () => {
    mockEtagStore.get.mockReturnValue('"cached-funding-etag"');
    const mockResponse = {
      ok: true,
      status: 304,
      headers: new Map()
    };
    mockFetch.mockResolvedValue(mockResponse);

    const ctx = createCtx();
    const result = await fetchFunding(ctx);

    expect(result).toEqual({
      items: [],
      ok: true,
      timedOut: false,
      etag: '"cached-funding-etag"'
    });

    expect(mockTelemetry.end).toHaveBeenCalledWith('funding', {
      ok: true,
      timedOut: false,
      elapsedMs: expect.any(Number)
    });
  });

  it('should handle 5xx errors', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      headers: new Map()
    };
    mockFetch.mockResolvedValue(mockResponse);

    const ctx = createCtx();
    const result = await fetchFunding(ctx);

    expect(result).toEqual({
      items: [],
      ok: false,
      timedOut: false
    });

    expect(mockTelemetry.end).toHaveBeenCalledWith('funding', {
      ok: false,
      timedOut: false,
      elapsedMs: expect.any(Number)
    });
  });

  it('should handle timeout', async () => {
    // Mock AbortError to simulate timeout
    const abortError = new Error('AbortError');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValue(abortError);

    const ctx = createCtx(100);
    const result = await fetchFunding(ctx);

    expect(result).toEqual({
      items: [],
      ok: false,
      timedOut: true
    });

    expect(mockTelemetry.end).toHaveBeenCalledWith('funding', {
      ok: false,
      timedOut: true,
      elapsedMs: expect.any(Number)
    });
  });

  it('should handle partial data', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Map(),
      json: () => Promise.resolve([
        {
          symbol: 'BTCUSDT',
          lastFundingRate: '0.0001'
        },
        {
          symbol: 'INVALID',
          lastFundingRate: 'invalid'
        }
      ])
    };
    mockFetch.mockResolvedValue(mockResponse);

    const ctx = createCtx();
    const result = await fetchFunding(ctx);

    expect(result.items).toHaveLength(2); // Both items are processed, invalid becomes 0
    expect(result.items[0].label).toContain('BTC');
    expect(result.items[1].label).toContain('INVALID');
  });

  it('should limit to 3 items', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Map(),
      json: () => Promise.resolve([
        { symbol: 'BTCUSDT', lastFundingRate: '0.0001' },
        { symbol: 'ETHUSDT', lastFundingRate: '0.0002' },
        { symbol: 'SOLUSDT', lastFundingRate: '0.0003' },
        { symbol: 'ADAUSDT', lastFundingRate: '0.0004' }
      ])
    };
    mockFetch.mockResolvedValue(mockResponse);

    const ctx = createCtx();
    const result = await fetchFunding(ctx);

    expect(result.items).toHaveLength(3);
  });

  it('should handle single object response', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Map(),
      json: () => Promise.resolve({
        symbol: 'BTCUSDT',
        lastFundingRate: '0.0001'
      })
    };
    mockFetch.mockResolvedValue(mockResponse);

    const ctx = createCtx();
    const result = await fetchFunding(ctx);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].label).toContain('BTC');
  });

  it('should send If-None-Match header when cached ETag exists', async () => {
    mockEtagStore.get.mockReturnValue('"cached-funding-etag"');
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Map(),
      json: () => Promise.resolve([{ symbol: 'BTCUSDT', lastFundingRate: '0.0001' }])
    };
    mockFetch.mockResolvedValue(mockResponse);

    const ctx = createCtx();
    await fetchFunding(ctx);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('api.binance.com'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'If-None-Match': '"cached-funding-etag"'
        })
      })
    );
  });
});
