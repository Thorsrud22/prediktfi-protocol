/**
 * Tests for Signals Health API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/ops/signals-health/route';

const { mockTelemetry, mockL2Cache } = vi.hoisted(() => ({
  mockTelemetry: {
    getAllMetrics: vi.fn(() => ({
      fear_greed: {
        success_rate: 0.98,
        timeout_rate: 0.01,
        p95_ms: 120,
        last_ok_ts: '2025-01-09T12:00:00Z',
        total_calls: 100,
        success_calls: 98,
        timeout_calls: 1,
        response_times: [80, 100, 120, 140, 160]
      },
      funding: {
        success_rate: 0.92,
        timeout_rate: 0.05,
        p95_ms: 180,
        last_ok_ts: '2025-01-09T12:00:00Z',
        total_calls: 90,
        success_calls: 83,
        timeout_calls: 4,
        response_times: [120, 160, 180, 190, 200]
      }
    }))
  },
  mockL2Cache: {
    getFresh: vi.fn(() => ({ etag: 'test-etag', payload: [], ts: Date.now() })),
    getStaleButServeable: vi.fn(() => null)
  }
}));

vi.mock('@/lib/telemetry', () => ({
  telemetry: mockTelemetry
}));

vi.mock('@/lib/cache/signalsL2', () => mockL2Cache);

describe('Signals Health API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return health metrics', async () => {
    const request = new Request('http://localhost:3000/api/ops/signals-health');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('nowIso');
    expect(data).toHaveProperty('p95_ms');
    expect(data).toHaveProperty('rate_5xx');
    expect(data).toHaveProperty('rate_304_or_cdn');
    expect(data).toHaveProperty('mttr_minutes');
    expect(data).toHaveProperty('health_status');
    expect(data).toHaveProperty('per_source');
    expect(Array.isArray(data.per_source)).toBe(true);
  });

  it('should calculate P95 latency correctly', async () => {
    const request = new Request('http://localhost:3000/api/ops/signals-health');
    const response = await GET(request);
    
    const data = await response.json();
    expect(typeof data.p95_ms).toBe('number');
    expect(data.p95_ms).toBeGreaterThanOrEqual(0);
  });

  it('should calculate error rates correctly', async () => {
    const request = new Request('http://localhost:3000/api/ops/signals-health');
    const response = await GET(request);
    
    const data = await response.json();
    expect(typeof data.rate_5xx).toBe('number');
    expect(data.rate_5xx).toBeGreaterThanOrEqual(0);
    expect(data.rate_5xx).toBeLessThanOrEqual(1);
    
    expect(typeof data.rate_304_or_cdn).toBe('number');
    expect(data.rate_304_or_cdn).toBeGreaterThanOrEqual(0);
    expect(data.rate_304_or_cdn).toBeLessThanOrEqual(1);
  });

  it('should include per-source metrics', async () => {
    const request = new Request('http://localhost:3000/api/ops/signals-health');
    const response = await GET(request);
    
    const data = await response.json();
    expect(data.per_source).toHaveLength(2); // fear_greed and funding
    
    const fearGreedSource = data.per_source.find((s: any) => s.name === 'fear_greed');
    expect(fearGreedSource).toBeDefined();
    expect(fearGreedSource).toHaveProperty('success_rate');
    expect(fearGreedSource).toHaveProperty('timeout_rate');
    expect(fearGreedSource).toHaveProperty('p95_ms');
    expect(fearGreedSource).toHaveProperty('breaker_state');
  });

  it('should handle telemetry errors gracefully', async () => {
    mockTelemetry.getAllMetrics.mockImplementation(() => {
      throw new Error('Telemetry error');
    });
    
    const request = new Request('http://localhost:3000/api/ops/signals-health');
    const response = await GET(request);
    
    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.health_status).toBe('red');
  });
});
