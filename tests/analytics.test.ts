import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/analytics/route';

describe('/api/analytics', () => {
  it('returns 204 for valid analytics event', async () => {
    const payload = {
      name: 'pricing_viewed',
      props: { where: 'test' },
      ts: Date.now()
    };

    const req = new NextRequest('http://localhost:3000/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const response = await POST(req);

    expect(response.status).toBe(204);
  });

  it('returns 204 even for malformed requests', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json'
    });

    const response = await POST(req);

    expect(response.status).toBe(204);
  });
});
