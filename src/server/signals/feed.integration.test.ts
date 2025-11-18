/**
 * Integration tests for signals feed (fear & greed + funding sources)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMarketSignals, clearSignalsCache } from './feed';

const { mockFetchFearGreed, mockFetchFunding, mockTelemetry, mockEtagStore } = vi.hoisted(() => ({
  mockFetchFearGreed: vi.fn(),
  mockFetchFunding: vi.fn(),
  mockTelemetry: {
    start: vi.fn(() => ({ startTime: Date.now() })),
    end: vi.fn(),
    getAllMetrics: vi.fn(() => ({}))
  },
  mockEtagStore: {
    get: vi.fn(),
    set: vi.fn()
  }
}));

vi.mock('../../lib/adapters/fearGreed', () => ({
  fetchFearGreed: mockFetchFearGreed
}));

vi.mock('../../lib/adapters/funding', () => ({
  fetchFunding: mockFetchFunding
}));

vi.mock('../../lib/telemetry', () => ({
  telemetry: mockTelemetry
}));

vi.mock('../../lib/cache/etagStore', () => ({
  etagStore: mockEtagStore
}));

describe('getMarketSignals integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSignalsCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('aggregates results from adapters', async () => {
    mockFetchFearGreed.mockResolvedValue({
      items: [{ type: 'fear_greed', label: 'Greed (72)', value: 72, ts: '2025-09-09T12:00:00Z' }],
      ok: true,
      timedOut: false
    });

    mockFetchFunding.mockResolvedValue({
      items: [{ type: 'funding', label: 'BTC funding ↑', direction: 'up', ts: '2025-09-09T12:00:00Z' }],
      ok: true,
      timedOut: false
    });

    const result = await getMarketSignals('SOL/USDC');

    expect(result.items).toHaveLength(2);
    expect(result.items[0].type).toBe('fear_greed');
    expect(result.items[1].type).toBe('funding');
    expect(result.updatedAt).toBeDefined();
  });

  it('handles mixed results (ok + timeout)', async () => {
    mockFetchFearGreed.mockResolvedValue({
      items: [{ type: 'fear_greed', label: 'Greed (72)', value: 72, ts: '2025-09-09T12:00:00Z' }],
      ok: true,
      timedOut: false
    });

    mockFetchFunding.mockImplementation(() => new Promise(() => {})); // never resolves

    const promise = getMarketSignals('SOL/USDC');
    vi.advanceTimersByTime(1000);

    const result = await promise;

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe('fear_greed');
  });

  it('handles all adapters failing', async () => {
    mockFetchFearGreed.mockResolvedValue({ items: [], ok: false, timedOut: false });
    mockFetchFunding.mockResolvedValue({ items: [], ok: false, timedOut: false });

    const result = await getMarketSignals('SOL/USDC');

    expect(result.items).toHaveLength(0);
    expect(result.updatedAt).toBeDefined();
  });

  it('respects total timeout budget', async () => {
    mockFetchFearGreed.mockImplementation(() => new Promise(() => {}));
    mockFetchFunding.mockImplementation(() => new Promise(() => {}));

    const promise = getMarketSignals('SOL/USDC');
    vi.advanceTimersByTime(1300);

    const result = await promise;

    expect(result.items).toHaveLength(0);
    expect(result.updatedAt).toBeDefined();
  });

  it('limits total items to 5', async () => {
    mockFetchFearGreed.mockResolvedValue({
      items: [{ type: 'fear_greed', label: 'Greed (72)', value: 72, ts: '2025-09-09T12:00:00Z' }],
      ok: true,
      timedOut: false
    });

    mockFetchFunding.mockResolvedValue({
      items: [
        { type: 'funding', label: 'Market 1', direction: 'up', ts: '2025-09-09T12:00:00Z' },
        { type: 'funding', label: 'Market 2', direction: 'up', ts: '2025-09-09T12:00:00Z' },
        { type: 'funding', label: 'Market 3', direction: 'up', ts: '2025-09-09T12:00:00Z' },
        { type: 'funding', label: 'Market 4', direction: 'up', ts: '2025-09-09T12:00:00Z' },
        { type: 'funding', label: 'Market 5', direction: 'up', ts: '2025-09-09T12:00:00Z' }
      ],
      ok: true,
      timedOut: false
    });

    const result = await getMarketSignals('SOL/USDC');

    expect(result.items).toHaveLength(5);
  });

  it('uses cache for subsequent calls', async () => {
    mockFetchFearGreed.mockResolvedValue({
      items: [{ type: 'fear_greed', label: 'Greed (72)', value: 72, ts: '2025-09-09T12:00:00Z' }],
      ok: true,
      timedOut: false
    });

    mockFetchFunding.mockResolvedValue({
      items: [{ type: 'funding', label: 'BTC funding ↑', direction: 'up', ts: '2025-09-09T12:00:00Z' }],
      ok: true,
      timedOut: false
    });

    const first = await getMarketSignals('SOL/USDC');
    expect(first.items).toHaveLength(2);

    vi.clearAllMocks();
    const second = await getMarketSignals('SOL/USDC');
    expect(second.items).toHaveLength(2);
    expect(mockFetchFearGreed).not.toHaveBeenCalled();
    expect(mockFetchFunding).not.toHaveBeenCalled();
  });

  it('uses separate caches for different pairs', async () => {
    mockFetchFearGreed.mockResolvedValue({
      items: [{ type: 'fear_greed', label: 'Greed (72)', value: 72, ts: '2025-09-09T12:00:00Z' }],
      ok: true,
      timedOut: false
    });
    mockFetchFunding.mockResolvedValue({
      items: [{ type: 'funding', label: 'BTC funding ↑', direction: 'up', ts: '2025-09-09T12:00:00Z' }],
      ok: true,
      timedOut: false
    });

    await getMarketSignals('SOL/USDC');

    vi.clearAllMocks();
    mockFetchFearGreed.mockResolvedValue({
      items: [{ type: 'fear_greed', label: 'Neutral (50)', value: 50, ts: '2025-09-09T12:00:00Z' }],
      ok: true,
      timedOut: false
    });
    mockFetchFunding.mockResolvedValue({
      items: [{ type: 'funding', label: 'ETH funding ↓', direction: 'down', ts: '2025-09-09T12:00:00Z' }],
      ok: true,
      timedOut: false
    });

    const result = await getMarketSignals('ETH/USDC');
    expect(result.items).toHaveLength(2);
    expect(mockFetchFearGreed).toHaveBeenCalled();
    expect(mockFetchFunding).toHaveBeenCalled();
  });
});
