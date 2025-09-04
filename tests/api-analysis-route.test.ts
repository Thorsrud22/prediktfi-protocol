import { describe, it, expect } from 'vitest';

describe('Analysis API Route', () => {
  const API_BASE = process.env.NODE_ENV === 'test' ? 'http://localhost:3000' : '';

  it('should return 501 not implemented for valid request', async () => {
    const response = await fetch(`${API_BASE}/api/analysis`, {
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

    expect(response.status).toBe(501);

    const data = await response.json();
    expect(data.error).toBe('not implemented');
    expect(data.input).toBeDefined();
    expect(data.input.assetId).toBe('bitcoin');
  });

  it('should return 422 for missing required fields', async () => {
    const response = await fetch(`${API_BASE}/api/analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        horizon: '24h',
      }),
    });

    expect(response.status).toBe(422);

    const data = await response.json();
    expect(data.error).toContain('Missing required fields');
  });

  it('should return 400 for invalid JSON', async () => {
    const response = await fetch(`${API_BASE}/api/analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid json',
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Invalid JSON');
  });
});
