// Tests for Fear & Greed Index data fetching and caching

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Fear & Greed Index Data Source', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Clear module cache to reset cache between tests
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should fetch FNG data with correct regime mapping', async () => {
    const mockResponse = {
      data: [
        { value: '25', timestamp: '1640995200' },
        { value: '30', timestamp: '1640908800' }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const { fetchFng } = await import('../src/lib/sentiment/fearGreed');
    const result = await fetchFng();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.alternative.me/fng',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );

    expect(result).toMatchObject({
      fngNow: 25,
      fngPrev: 30,
      regime: 'fear', // 25 maps to fear (21-40)
      quality: 1.0
    });
  });

  it('should map FNG values to correct regimes', async () => {
    const testCases = [
      { value: 15, expected: 'extreme_fear' },
      { value: 25, expected: 'fear' },
      { value: 45, expected: 'neutral' },
      { value: 65, expected: 'greed' },
      { value: 85, expected: 'extreme_greed' }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const mockResponse = {
        data: [{ value: testCase.value.toString(), timestamp: '1640995200' }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // Reset modules to clear cache for each test case
      vi.resetModules();
      const { fetchFng } = await import('../src/lib/sentiment/fearGreed');
      const result = await fetchFng();
      expect(result.regime).toBe(testCase.expected);
    }
  });

  it('should return cached data on second call within TTL', async () => {
    const mockResponse = {
      data: [{ value: '50', timestamp: '1640995200' }]
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const { fetchFng } = await import('../src/lib/sentiment/fearGreed');

    // First call
    const result1 = await fetchFng(300);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call within TTL - should use cache
    const result2 = await fetchFng(300);
    expect(mockFetch).toHaveBeenCalledTimes(1); // No additional fetch
    expect(result2).toEqual(result1);
  });

  it('should fetch new data after TTL expires', async () => {
    const mockResponse = {
      data: [{ value: '50', timestamp: '1640995200' }]
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const { fetchFng } = await import('../src/lib/sentiment/fearGreed');

    // First call
    await fetchFng(300);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance time past TTL
    vi.advanceTimersByTime(301 * 1000);

    // Second call after TTL - should fetch again
    await fetchFng(300);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should throw error when API returns non-ok status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const { fetchFng } = await import('../src/lib/sentiment/fearGreed');

    await expect(fetchFng())
      .rejects
      .toThrow('Fear & Greed API error: 500');
  });

  it('should throw error when response data is missing or empty', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] })
    });

    const { fetchFng } = await import('../src/lib/sentiment/fearGreed');

    await expect(fetchFng())
      .rejects
      .toThrow('Invalid response: data array missing or empty');
  });

  it('should handle missing previous value gracefully', async () => {
    const mockResponse = {
      data: [{ value: '50', timestamp: '1640995200' }] // Only current value
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const { fetchFng } = await import('../src/lib/sentiment/fearGreed');
    const result = await fetchFng();
    expect(result.fngNow).toBe(50);
    expect(result.fngPrev).toBeNull();
    expect(result.quality).toBe(1.0);
  });

  it('should assign low quality for invalid values', async () => {
    const mockResponse = {
      data: [{ value: 'invalid', timestamp: '1640995200' }]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const { fetchFng } = await import('../src/lib/sentiment/fearGreed');
    const result = await fetchFng();
    expect(result.quality).toBe(0.2);
  });
});
