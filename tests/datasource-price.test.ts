// Tests for price data fetching and caching

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Price Data Source', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Clear module cache to reset cache between tests
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should fetch market chart data with correct structure and quality', async () => {
    const mockResponse = {
      prices: [
        [1640995200000, 47000],
        [1641081600000, 48000],
        [1641168000000, 47500]
      ],
      total_volumes: [
        [1640995200000, 1000000],
        [1641081600000, 1200000], 
        [1641168000000, 1100000]
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const { fetchMarketChart } = await import('../src/lib/data/price');
    const result = await fetchMarketChart('bitcoin', 'usd', 7);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );

    expect(result).toMatchObject({
      assetId: 'bitcoin',
      vsCurrency: 'usd',
      source: 'coingecko',
      quality: expect.any(Number)
    });

    expect(result.quality).toBeGreaterThanOrEqual(0);
    expect(result.quality).toBeLessThanOrEqual(1);
    expect(result.candles).toHaveLength(3);
    expect(result.candles[0]).toMatchObject({
      t: expect.any(Number),
      o: expect.any(Number),
      h: expect.any(Number),
      l: expect.any(Number),
      c: expect.any(Number),
      v: expect.any(Number)
    });
  });

  it('should return cached data on second call within TTL', async () => {
    const mockResponse = {
      prices: [[1640995200000, 47000]],
      total_volumes: [[1640995200000, 1000000]]
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const { fetchMarketChart } = await import('../src/lib/data/price');

    // First call
    const result1 = await fetchMarketChart('bitcoin', 'usd', 7, 120);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call within TTL - should use cache
    const result2 = await fetchMarketChart('bitcoin', 'usd', 7, 120);
    expect(mockFetch).toHaveBeenCalledTimes(1); // No additional fetch
    expect(result2).toEqual(result1);
  });

  it('should fetch new data after TTL expires', async () => {
    const mockResponse = {
      prices: [[1640995200000, 47000]],
      total_volumes: [[1640995200000, 1000000]]
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const { fetchMarketChart } = await import('../src/lib/data/price');

    // First call
    await fetchMarketChart('bitcoin', 'usd', 7, 120);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance time past TTL
    vi.advanceTimersByTime(121 * 1000);

    // Second call after TTL - should fetch again
    await fetchMarketChart('bitcoin', 'usd', 7, 120);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should throw error when API returns non-ok status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const { fetchMarketChart } = await import('../src/lib/data/price');

    await expect(fetchMarketChart('bitcoin', 'usd', 7))
      .rejects
      .toThrow('CoinGecko API error: 500');
  });

  it('should throw error when response is missing prices array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: 'invalid' })
    });

    const { fetchMarketChart } = await import('../src/lib/data/price');

    await expect(fetchMarketChart('bitcoin', 'usd', 7))
      .rejects
      .toThrow('Invalid response: prices array missing');
  });

  it('should assign low quality score for insufficient data', async () => {
    const mockResponse = {
      prices: [
        [1640995200000, 47000],
        [1641081600000, 48000]
      ],
      total_volumes: [
        [1640995200000, 1000000],
        [1641081600000, 1200000]
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const { fetchMarketChart } = await import('../src/lib/data/price');
    const result = await fetchMarketChart('bitcoin', 'usd', 7);
    expect(result.quality).toBe(0.2); // Low quality for < 10 candles
  });
});
