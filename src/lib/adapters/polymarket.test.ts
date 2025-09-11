/**
 * Unit tests for Polymarket adapter
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchPolymarket } from './polymarket';

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

describe('fetchPolymarket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return markets on 200 OK', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Map([['ETag', '"test-etag-123"']]),
      json: () => Promise.resolve({
        data: [
          {
            question: 'Will ETH reach $4000 by Q4?',
            outcomeTokens: [{ price: 0.62 }]
          },
          {
            question: 'Will SOL reach $300 by EOY?',
            outcomeTokens: [{ price: 0.45 }]
          }
        ]
      })
    };
    mockFetch.mockResolvedValue(mockResponse);

    const ctx = createCtx();
    const result = await fetchPolymarket(ctx);

    expect(result).toEqual({
      items: [
        {
          type: 'polymarket',
          label: 'Will ETH reach $4000 by Q4?',
          prob: 0.62,
          ts: '2025-09-09T12:00:00.000Z'
        },
        {
          type: 'polymarket',
          label: 'Will SOL reach $300 by EOY?',
          prob: 0.45,
          ts: '2025-09-09T12:00:00.000Z'
        }
      ],
      ok: true,
      timedOut: false,
      etag: '"test-etag-123"'
    });

    expect(mockEtagStore.set).toHaveBeenCalledWith('polymarket', '"test-etag-123"');
    expect(mockTelemetry.end).toHaveBeenCalledWith('polymarket', {
      ok: true,
      timedOut: false,
      elapsedMs: expect.any(Number)
    });
  });

  it('should handle 304 Not Modified', async () => {
    mockEtagStore.get.mockReturnValue('"cached-etag"');
    const mockResponse = {
      ok: true,
      status: 304,
      headers: new Map()
    };
    mockFetch.mockResolvedValue(mockResponse);

    const ctx = createCtx();
    const result = await fetchPolymarket(ctx);

    expect(result).toEqual({
      items: [],
      ok: true,
      timedOut: false,
      etag: '"cached-etag"'
    });

    expect(mockTelemetry.end).toHaveBeenCalledWith('polymarket', {
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
    const result = await fetchPolymarket(ctx);

    expect(result).toEqual({
      items: [],
      ok: false,
      timedOut: false
    });

    expect(mockTelemetry.end).toHaveBeenCalledWith('polymarket', {
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
    const result = await fetchPolymarket(ctx);

    expect(result).toEqual({
      items: [],
      ok: false,
      timedOut: true
    });

    expect(mockTelemetry.end).toHaveBeenCalledWith('polymarket', {
      ok: false,
      timedOut: true,
      elapsedMs: expect.any(Number)
    });
  });

  it('should handle bad JSON', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Map(),
      json: () => Promise.reject(new Error('Invalid JSON'))
    };
    mockFetch.mockResolvedValue(mockResponse);

    const ctx = createCtx();
    const result = await fetchPolymarket(ctx);

    expect(result).toEqual({
      items: [],
      ok: false,
      timedOut: false
    });
  });

  it('should clamp probability to [0,1]', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Map(),
      json: () => Promise.resolve({
        data: [
          { question: 'Test 1', outcomeTokens: [{ price: -0.1 }] },
          { question: 'Test 2', outcomeTokens: [{ price: 1.5 }] },
          { question: 'Test 3', outcomeTokens: [{ price: 0.5 }] }
        ]
      })
    };
    mockFetch.mockResolvedValue(mockResponse);

    const ctx = createCtx();
    const result = await fetchPolymarket(ctx);

    expect(result.items).toHaveLength(3);
    expect(result.items[0].prob).toBe(0); // Clamped from -0.1
    expect(result.items[1].prob).toBe(1); // Clamped from 1.5
    expect(result.items[2].prob).toBe(0.5); // Unchanged
  });

  it('should send If-None-Match header when cached ETag exists', async () => {
    mockEtagStore.get.mockReturnValue('"cached-etag"');
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Map(),
      json: () => Promise.resolve({ data: [] })
    };
    mockFetch.mockResolvedValue(mockResponse);

    const ctx = createCtx();
    await fetchPolymarket(ctx);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('api.polymarket.com'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'If-None-Match': '"cached-etag"'
        })
      })
    );
  });
});
