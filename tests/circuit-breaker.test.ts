/**
 * Tests for Circuit Breaker Implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getMarketSignals, 
  getCircuitBreakerStates, 
  resetCircuitBreaker,
  clearSignalsCache 
} from '@/src/server/signals/feed';

// Mock adapters
const mockFetchPolymarket = vi.fn();
const mockFetchFearGreed = vi.fn();
const mockFetchFunding = vi.fn();

vi.mock('@/lib/adapters/polymarket', () => ({
  fetchPolymarket: mockFetchPolymarket
}));

vi.mock('@/lib/adapters/fearGreed', () => ({
  fetchFearGreed: mockFetchFearGreed
}));

vi.mock('@/lib/adapters/funding', () => ({
  fetchFunding: mockFetchFunding
}));

// Mock telemetry
const mockTelemetry = {
  start: vi.fn(() => ({ startTime: Date.now() })),
  end: vi.fn(),
  getAllMetrics: vi.fn(() => ({}))
};

vi.mock('@/lib/telemetry', () => ({
  telemetry: mockTelemetry
}));

// Mock L2 cache
const mockL2Cache = {
  getStaleButServeable: vi.fn(() => null)
};

vi.mock('@/lib/cache/signalsL2', () => mockL2Cache);

describe('Circuit Breaker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSignalsCache();
    
    // Reset all circuit breakers
    ['polymarket', 'fear_greed', 'funding'].forEach(resetCircuitBreaker);
  });

  it('should start in closed state', () => {
    const states = getCircuitBreakerStates();
    
    expect(states.polymarket.state).toBe('closed');
    expect(states.fear_greed.state).toBe('closed');
    expect(states.funding.state).toBe('closed');
  });

  it('should open circuit breaker after failures', async () => {
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

    // Simulate multiple failures to trigger circuit breaker
    for (let i = 0; i < 15; i++) {
      await getMarketSignals();
    }

    const states = getCircuitBreakerStates();
    expect(states.polymarket.state).toBe('open');
  });

  it('should serve stale data when circuit breaker is open', async () => {
    // Mock stale data available
    mockL2Cache.getStaleButServeable.mockReturnValue({
      etag: 'stale-etag',
      payload: {
        items: [{ type: 'polymarket', label: 'Stale data', ts: '2025-01-09T12:00:00Z' }],
        updatedAt: '2025-01-09T12:00:00Z'
      },
      ts: Date.now() - 200000 // 200 seconds ago (stale)
    });

    // Mock all adapters failing to open circuit breaker
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

    // Trigger circuit breaker
    for (let i = 0; i < 15; i++) {
      await getMarketSignals();
    }

    // Now circuit breaker should be open and serve stale data
    const result = await getMarketSignals();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].label).toBe('Stale data');
  });

  it('should transition to half-open after timeout', async () => {
    // Open circuit breaker first
    mockFetchPolymarket.mockResolvedValue({
      items: [],
      ok: false,
      timedOut: false
    });

    for (let i = 0; i < 15; i++) {
      await getMarketSignals();
    }

    let states = getCircuitBreakerStates();
    expect(states.polymarket.state).toBe('open');

    // Simulate time passing (60+ seconds)
    const originalDateNow = Date.now;
    vi.spyOn(Date, 'now').mockImplementation(() => originalDateNow() + 65000);

    // Try one more request
    await getMarketSignals();

    states = getCircuitBreakerStates();
    expect(states.polymarket.state).toBe('half-open');

    // Restore Date.now
    vi.restoreAllMocks();
  });

  it('should close circuit breaker after successful request', async () => {
    // Open circuit breaker first
    mockFetchPolymarket.mockResolvedValue({
      items: [],
      ok: false,
      timedOut: false
    });

    for (let i = 0; i < 15; i++) {
      await getMarketSignals();
    }

    let states = getCircuitBreakerStates();
    expect(states.polymarket.state).toBe('open');

    // Simulate time passing and successful request
    const originalDateNow = Date.now;
    vi.spyOn(Date, 'now').mockImplementation(() => originalDateNow() + 65000);

    mockFetchPolymarket.mockResolvedValue({
      items: [{ type: 'polymarket', label: 'Success', ts: '2025-01-09T12:00:00Z' }],
      ok: true,
      timedOut: false
    });

    await getMarketSignals();

    states = getCircuitBreakerStates();
    expect(states.polymarket.state).toBe('closed');

    // Restore Date.now
    vi.restoreAllMocks();
  });

  it('should implement exponential backoff', async () => {
    // Open circuit breaker
    mockFetchPolymarket.mockResolvedValue({
      items: [],
      ok: false,
      timedOut: false
    });

    for (let i = 0; i < 15; i++) {
      await getMarketSignals();
    }

    let states = getCircuitBreakerStates();
    expect(states.polymarket.state).toBe('open');
    expect(states.polymarket.backoffMs).toBe(500);

    // Simulate time passing and failed half-open attempt
    const originalDateNow = Date.now;
    vi.spyOn(Date, 'now').mockImplementation(() => originalDateNow() + 65000);

    mockFetchPolymarket.mockResolvedValue({
      items: [],
      ok: false,
      timedOut: false
    });

    await getMarketSignals();

    states = getCircuitBreakerStates();
    expect(states.polymarket.state).toBe('open');
    expect(states.polymarket.backoffMs).toBe(1000); // Doubled

    // Restore Date.now
    vi.restoreAllMocks();
  });
});
