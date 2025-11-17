/**
 * Circuit breaker behaviour for signals feed (fear_greed + funding)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getMarketSignals, 
  getCircuitBreakerStates, 
  resetCircuitBreaker,
  clearSignalsCache 
} from '../src/server/signals/feed';

const { mockFetchFearGreed, mockFetchFunding, mockTelemetry, mockL2Cache } = vi.hoisted(() => ({
  mockFetchFearGreed: vi.fn(),
  mockFetchFunding: vi.fn(),
  mockTelemetry: {
    start: vi.fn(() => ({ startTime: Date.now() })),
    end: vi.fn(),
    getAllMetrics: vi.fn(() => ({}))
  },
  mockL2Cache: {
    getStaleButServeable: vi.fn(() => null)
  }
}));

vi.mock('../src/lib/adapters/fearGreed', () => ({
  fetchFearGreed: mockFetchFearGreed
}));

vi.mock('../src/lib/adapters/funding', () => ({
  fetchFunding: mockFetchFunding
}));

vi.mock('../src/lib/telemetry', () => ({
  telemetry: mockTelemetry
}));

vi.mock('../src/lib/cache/signalsL2', () => mockL2Cache);

describe('Circuit Breaker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSignalsCache();
    ['fear_greed', 'funding'].forEach(resetCircuitBreaker);
  });

  it('starts in closed state', () => {
    const states = getCircuitBreakerStates();
    expect(states.fear_greed.state).toBe('closed');
    expect(states.funding.state).toBe('closed');
  });

  it('opens circuit breaker after repeated failures', async () => {
    mockFetchFearGreed.mockResolvedValue({ items: [], ok: false, timedOut: false });
    mockFetchFunding.mockResolvedValue({ items: [], ok: false, timedOut: false });

    for (let i = 0; i < 15; i++) {
      await getMarketSignals();
    }

    const states = getCircuitBreakerStates();
    expect(states.fear_greed.state).toBe('open');
  });

  it('serves stale data when circuit breaker is open', async () => {
    mockL2Cache.getStaleButServeable.mockReturnValue({
      etag: 'stale-etag',
      payload: {
        items: [{ type: 'fear_greed', label: 'Stale data', ts: '2025-01-09T12:00:00Z' }],
        updatedAt: '2025-01-09T12:00:00Z'
      },
      ts: Date.now() - 200000
    });

    mockFetchFearGreed.mockResolvedValue({ items: [], ok: false, timedOut: false });
    mockFetchFunding.mockResolvedValue({ items: [], ok: false, timedOut: false });

    for (let i = 0; i < 15; i++) {
      await getMarketSignals();
    }

    const result = await getMarketSignals();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].label).toBe('Stale data');
  });

  it('can be reset to closed state', async () => {
    mockFetchFearGreed.mockResolvedValue({ items: [], ok: false, timedOut: false });
    mockFetchFunding.mockResolvedValue({ items: [], ok: false, timedOut: false });

    for (let i = 0; i < 15; i++) {
      await getMarketSignals();
    }

    resetCircuitBreaker('fear_greed');
    const states = getCircuitBreakerStates();
    expect(states.fear_greed.state).toBe('closed');
  });
});
