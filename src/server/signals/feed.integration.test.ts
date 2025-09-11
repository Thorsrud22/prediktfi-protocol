/**
 * Integration tests for signals feed
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMarketSignals } from './feed';

// Mock adapters
const mockFetchPolymarket = vi.fn();
const mockFetchFearGreed = vi.fn();
const mockFetchFunding = vi.fn();

vi.mock('../../lib/adapters/polymarket', () => ({
  fetchPolymarket: mockFetchPolymarket
}));

vi.mock('../../lib/adapters/fearGreed', () => ({
  fetchFearGreed: mockFetchFearGreed
}));

vi.mock('../../lib/adapters/funding', () => ({
  fetchFunding: mockFetchFunding
}));

// Mock telemetry
const mockTelemetry = {
  start: vi.fn(() => ({ startTime: Date.now() })),
  end: vi.fn(),
  getAllMetrics: vi.fn(() => ({}))
};

vi.mock('../../lib/telemetry', () => ({
  telemetry: mockTelemetry
}));

// Mock etag store
const mockEtagStore = {
  get: vi.fn(),
  set: vi.fn()
};

vi.mock('../../lib/cache/etagStore', () => ({
  etagStore: mockEtagStore
}));

describe('getMarketSignals integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should aggregate results from all adapters successfully', async () => {
    // Mock all adapters returning data
    mockFetchPolymarket.mockResolvedValue({
      items: [
        { type: 'polymarket', label: 'ETH > $4000', prob: 0.62, ts: '2025-09-09T12:00:00Z' }
      ],
      ok: true,
      timedOut: false
    });

    mockFetchFearGreed.mockResolvedValue({
      items: [
        { type: 'fear_greed', label: 'Greed (72)', value: 72, ts: '2025-09-09T12:00:00Z' }
      ],
      ok: true,
      timedOut: false
    });

    mockFetchFunding.mockResolvedValue({
      items: [
        { type: 'funding', label: 'BTC funding ↑', direction: 'up', ts: '2025-09-09T12:00:00Z' }
      ],
      ok: true,
      timedOut: false
    });

    const result = await getMarketSignals('SOL/USDC');

    expect(result.items).toHaveLength(3);
    expect(result.items[0].type).toBe('polymarket');
    expect(result.items[1].type).toBe('fear_greed');
    expect(result.items[2].type).toBe('funding');
    expect(result.updatedAt).toBeDefined();
  });

  it('should handle mixed results (200, 304, timeout)', async () => {
    // Mock 200 OK
    mockFetchPolymarket.mockResolvedValue({
      items: [
        { type: 'polymarket', label: 'ETH > $4000', prob: 0.62, ts: '2025-09-09T12:00:00Z' }
      ],
      ok: true,
      timedOut: false
    });

    // Mock 304 Not Modified
    mockFetchFearGreed.mockResolvedValue({
      items: [],
      ok: true,
      timedOut: false,
      etag: 'cached-etag'
    });

    // Mock timeout
    mockFetchFunding.mockImplementation(() => new Promise(resolve => {
      // Never resolves, will timeout
    }));

    const promise = getMarketSignals('SOL/USDC');
    
    // Advance timers to trigger timeout
    vi.advanceTimersByTime(1000);
    
    const result = await promise;

    expect(result.items).toHaveLength(1); // Only polymarket data
    expect(result.items[0].type).toBe('polymarket');
    expect(result.updatedAt).toBeDefined();
  });

  it('should handle all adapters failing', async () => {
    // Mock all adapters failing
    mockFetchPolymarket.mockResolvedValue({
      items: [],
      ok: false,
      timedOut: false
    });

    mockFetchFearGreed.mockResolvedValue({
      items: [],
      ok: false,
      timedOut: false
    });

    mockFetchFunding.mockResolvedValue({
      items: [],
      ok: false,
      timedOut: false
    });

    const result = await getMarketSignals('SOL/USDC');

    expect(result.items).toHaveLength(0);
    expect(result.updatedAt).toBeDefined();
  });

  it('should respect total timeout budget', async () => {
    // Mock all adapters timing out
    mockFetchPolymarket.mockImplementation(() => new Promise(resolve => {
      // Never resolves
    }));
    mockFetchFearGreed.mockImplementation(() => new Promise(resolve => {
      // Never resolves
    }));
    mockFetchFunding.mockImplementation(() => new Promise(resolve => {
      // Never resolves
    }));

    const promise = getMarketSignals('SOL/USDC');
    
    // Advance timers to trigger total timeout (1200ms)
    vi.advanceTimersByTime(1300);
    
    const result = await promise;

    expect(result.items).toHaveLength(0);
    expect(result.updatedAt).toBeDefined();
  });

  it('should limit total items to 5', async () => {
    // Mock adapters returning more than 5 items total
    mockFetchPolymarket.mockResolvedValue({
      items: [
        { type: 'polymarket', label: 'Market 1', prob: 0.5, ts: '2025-09-09T12:00:00Z' },
        { type: 'polymarket', label: 'Market 2', prob: 0.6, ts: '2025-09-09T12:00:00Z' },
        { type: 'polymarket', label: 'Market 3', prob: 0.7, ts: '2025-09-09T12:00:00Z' }
      ],
      ok: true,
      timedOut: false
    });

    mockFetchFearGreed.mockResolvedValue({
      items: [
        { type: 'fear_greed', label: 'Greed (72)', value: 72, ts: '2025-09-09T12:00:00Z' }
      ],
      ok: true,
      timedOut: false
    });

    mockFetchFunding.mockResolvedValue({
      items: [
        { type: 'funding', label: 'BTC funding ↑', direction: 'up', ts: '2025-09-09T12:00:00Z' },
        { type: 'funding', label: 'ETH funding ↓', direction: 'down', ts: '2025-09-09T12:00:00Z' }
      ],
      ok: true,
      timedOut: false
    });

    const result = await getMarketSignals('SOL/USDC');

    expect(result.items).toHaveLength(5); // Limited to 5
    expect(result.updatedAt).toBeDefined();
  });

  it('should use cache for subsequent calls', async () => {
    // First call
    mockFetchPolymarket.mockResolvedValue({
      items: [
        { type: 'polymarket', label: 'ETH > $4000', prob: 0.62, ts: '2025-09-09T12:00:00Z' }
      ],
      ok: true,
      timedOut: false
    });

    const result1 = await getMarketSignals('SOL/USDC');
    expect(result1.items).toHaveLength(1);

    // Second call should use cache (no new adapter calls)
    vi.clearAllMocks();
    const result2 = await getMarketSignals('SOL/USDC');
    expect(result2.items).toHaveLength(1);
    expect(mockFetchPolymarket).not.toHaveBeenCalled();
  });

  it('should handle different trading pairs', async () => {
    mockFetchPolymarket.mockResolvedValue({
      items: [
        { type: 'polymarket', label: 'ETH > $4000', prob: 0.62, ts: '2025-09-09T12:00:00Z' }
      ],
      ok: true,
      timedOut: false
    });

    // First call with SOL/USDC
    await getMarketSignals('SOL/USDC');
    
    // Second call with ETH/USDC should trigger fresh fetch
    vi.clearAllMocks();
    mockFetchPolymarket.mockResolvedValue({
      items: [
        { type: 'polymarket', label: 'SOL > $300', prob: 0.45, ts: '2025-09-09T12:00:00Z' }
      ],
      ok: true,
      timedOut: false
    });

    const result = await getMarketSignals('ETH/USDC');
    expect(result.items).toHaveLength(1);
    expect(mockFetchPolymarket).toHaveBeenCalled();
  });
});
