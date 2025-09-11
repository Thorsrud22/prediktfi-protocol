/**
 * Unit tests for Fear & Greed adapter
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchFearGreed } from './fearGreed';

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

describe('fetchFearGreed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return fear & greed data on 200 OK', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Map([['ETag', '"fgi-etag-123"']]),
      json: () => Promise.resolve({
        data: [
          {
            value: '72',
            value_classification: 'Greed'
          }
        ]
      })
    };
    mockFetch.mockResolvedValue(mockResponse);

    const ctx = createCtx();
    const result = await fetchFearGreed(ctx);

    expect(result).toEqual({
      items: [
        {
          type: 'fear_greed',
          label: 'Greed (72)',
          value: 72,
          ts: '2025-09-09T12:00:00.000Z'
        }
      ],
      ok: true,
      timedOut: false,
      etag: '"fgi-etag-123"'
    });

    expect(mockEtagStore.set).toHaveBeenCalledWith('fear_greed', '"fgi-etag-123"');
    expect(mockTelemetry.end).toHaveBeenCalledWith('fear_greed', {
      ok: true,
      timedOut: false,
      elapsedMs: expect.any(Number)
    });
  });

  it('should handle extreme fear value', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Map(),
      json: () => Promise.resolve({
        data: [
          {
            value: '0',
            value_classification: 'Extreme Fear'
          }
        ]
      })
    };
    mockFetch.mockResolvedValue(mockResponse);

    const ctx = createCtx();
    const result = await fetchFearGreed(ctx);

    expect(result.items[0].value).toBe(0);
    expect(result.items[0].label).toContain('Extreme Fear');
  });

  it('should handle neutral value', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Map(),
      json: () => Promise.resolve({
        data: [
          {
            value: '50',
            value_classification: 'Neutral'
          }
        ]
      })
    };
    mockFetch.mockResolvedValue(mockResponse);

    const ctx = createCtx();
    const result = await fetchFearGreed(ctx);

    expect(result.items[0].value).toBe(50);
    expect(result.items[0].label).toContain('Neutral');
  });

  it('should handle extreme greed value', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Map(),
      json: () => Promise.resolve({
        data: [
          {
            value: '100',
            value_classification: 'Extreme Greed'
          }
        ]
      })
    };
    mockFetch.mockResolvedValue(mockResponse);

    const ctx = createCtx();
    const result = await fetchFearGreed(ctx);

    expect(result.items[0].value).toBe(100);
    expect(result.items[0].label).toContain('Extreme Greed');
  });

  it('should handle 304 Not Modified', async () => {
    mockEtagStore.get.mockReturnValue('"cached-fgi-etag"');
    const mockResponse = {
      ok: true,
      status: 304,
      headers: new Map()
    };
    mockFetch.mockResolvedValue(mockResponse);

    const ctx = createCtx();
    const result = await fetchFearGreed(ctx);

    expect(result).toEqual({
      items: [],
      ok: true,
      timedOut: false,
      etag: '"cached-fgi-etag"'
    });

    expect(mockTelemetry.end).toHaveBeenCalledWith('fear_greed', {
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
    const result = await fetchFearGreed(ctx);

    expect(result).toEqual({
      items: [],
      ok: false,
      timedOut: false
    });

    expect(mockTelemetry.end).toHaveBeenCalledWith('fear_greed', {
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
    const result = await fetchFearGreed(ctx);

    expect(result).toEqual({
      items: [],
      ok: false,
      timedOut: true
    });

    expect(mockTelemetry.end).toHaveBeenCalledWith('fear_greed', {
      ok: false,
      timedOut: true,
      elapsedMs: expect.any(Number)
    });
  });

  it('should handle missing data', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Map(),
      json: () => Promise.resolve({ data: [] })
    };
    mockFetch.mockResolvedValue(mockResponse);

    const ctx = createCtx();
    const result = await fetchFearGreed(ctx);

    expect(result).toEqual({
      items: [],
      ok: false,
      timedOut: false
    });
  });

  it('should handle invalid value', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Map(),
      json: () => Promise.resolve({
        data: [
          {
            value: 'invalid',
            value_classification: 'Unknown'
          }
        ]
      })
    };
    mockFetch.mockResolvedValue(mockResponse);

    const ctx = createCtx();
    const result = await fetchFearGreed(ctx);

    expect(result.items[0].value).toBe(50); // Default fallback
  });

  it('should send If-None-Match header when cached ETag exists', async () => {
    mockEtagStore.get.mockReturnValue('"cached-fgi-etag"');
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Map(),
      json: () => Promise.resolve({ data: [{ value: '50', value_classification: 'Neutral' }] })
    };
    mockFetch.mockResolvedValue(mockResponse);

    const ctx = createCtx();
    await fetchFearGreed(ctx);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('api.alternative.me'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'If-None-Match': '"cached-fgi-etag"'
        })
      })
    );
  });
});
