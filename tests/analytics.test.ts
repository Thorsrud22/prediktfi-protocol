import { describe, it, expect } from 'vitest';

describe('/api/analytics', () => {
  it('returns 204 for valid analytics event', async () => {
    const payload = {
      name: 'pricing_viewed',
      props: { where: 'test' },
      ts: Date.now()
    };

    const response = await fetch('http://localhost:3000/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(204);
  });

  it('returns 204 even for malformed requests', async () => {
    const response = await fetch('http://localhost:3000/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json'
    });

    expect(response.status).toBe(204);
  });
});
