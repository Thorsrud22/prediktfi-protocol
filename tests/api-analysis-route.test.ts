import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/analysis/route';

describe('Analysis API Route', () => {
  it('should return mock analysis for valid request', async () => {
    const req = new NextRequest('http://localhost:3000/api/analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assetId: 'bitcoin',
        vsCurrency: 'usd',
        horizon: '24h',
      }),
    });

    const response = await POST(req);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.input.assetId).toBe('bitcoin');
    expect(data.probability).toBeDefined();
    expect(data.interval).toBeDefined();
  });

  it('should return 422 for missing required fields', async () => {
    const req = new NextRequest('http://localhost:3000/api/analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        horizon: '24h',
      }),
    });

    const response = await POST(req);

    expect(response.status).toBe(422);

    const data = await response.json();
    expect(data.error).toContain('Missing required fields');
  });

  it('should return 400 for invalid JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid json',
    });

    const response = await POST(req);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Invalid JSON');
  });
});
