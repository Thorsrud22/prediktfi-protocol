/**
 * Tests for Rollout API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/ops/rollout/route';
import { createHmac } from 'crypto';

// Mock environment
const originalEnv = process.env;

describe('Rollout API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.OPS_HMAC_SECRET = 'test-secret-key-32-characters-long';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should reject requests without signature', async () => {
    const request = new Request('http://localhost:3000/api/ops/rollout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ percent: 10 })
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Missing x-ops-signature header');
  });

  it('should reject requests with invalid signature', async () => {
    const request = new Request('http://localhost:3000/api/ops/rollout', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-ops-signature': 'invalid-signature'
      },
      body: JSON.stringify({ percent: 10 })
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Invalid signature');
  });

  it('should accept valid HMAC signature', async () => {
    const body = JSON.stringify({ percent: 10 });
    const signature = createHmac('sha256', 'test-secret-key-32-characters-long')
      .update(body)
      .digest('hex');

    const request = new Request('http://localhost:3000/api/ops/rollout', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-ops-signature': signature
      },
      body
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.rollout.percent).toBe(10);
  });

  it('should validate percent values', async () => {
    const body = JSON.stringify({ percent: 25 });
    const signature = createHmac('sha256', 'test-secret-key-32-characters-long')
      .update(body)
      .digest('hex');

    const request = new Request('http://localhost:3000/api/ops/rollout', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-ops-signature': signature
      },
      body
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('Invalid percent value');
  });

  it('should accept valid percent values', async () => {
    const validValues = [0, 10, 50, 100];
    
    for (const percent of validValues) {
      const body = JSON.stringify({ percent });
      const signature = createHmac('sha256', 'test-secret-key-32-characters-long')
        .update(body)
        .digest('hex');

      const request = new Request('http://localhost:3000/api/ops/rollout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-ops-signature': signature
        },
        body
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.rollout.percent).toBe(percent);
    }
  });

  it('should track audit log', async () => {
    const body = JSON.stringify({ percent: 50 });
    const signature = createHmac('sha256', 'test-secret-key-32-characters-long')
      .update(body)
      .digest('hex');

    const request = new Request('http://localhost:3000/api/ops/rollout', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-ops-signature': signature,
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'test-agent'
      },
      body
    });

    // First request
    await POST(request);

    // Second request
    const body2 = JSON.stringify({ percent: 100 });
    const signature2 = createHmac('sha256', 'test-secret-key-32-characters-long')
      .update(body2)
      .digest('hex');

    const request2 = new Request('http://localhost:3000/api/ops/rollout', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-ops-signature': signature2,
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'test-agent'
      },
      body: body2
    });

    await POST(request2);

    // Check audit log
    const getRequest = new Request('http://localhost:3000/api/ops/rollout');
    const getResponse = await GET(getRequest);
    const getData = await getResponse.json();

    expect(getData.audit).toHaveLength(2);
    expect(getData.audit[0].before).toBe(0); // Initial value
    expect(getData.audit[0].after).toBe(50);
    expect(getData.audit[1].before).toBe(50);
    expect(getData.audit[1].after).toBe(100);
  });

  it('should return current rollout status', async () => {
    const request = new Request('http://localhost:3000/api/ops/rollout');
    const response = await GET(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('rollout');
    expect(data.rollout).toHaveProperty('percent');
    expect(data.rollout).toHaveProperty('updatedAt');
    expect(data.rollout).toHaveProperty('updatedBy');
    expect(data).toHaveProperty('audit');
    expect(Array.isArray(data.audit)).toBe(true);
  });

  it('should handle missing HMAC secret', async () => {
    delete process.env.OPS_HMAC_SECRET;

    const request = new Request('http://localhost:3000/api/ops/rollout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ percent: 10 })
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe('OPS_HMAC_SECRET not configured');
  });
});
