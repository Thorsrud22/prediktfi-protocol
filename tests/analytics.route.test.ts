import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../app/api/analytics/route';

describe('/api/analytics', () => {
  it('returns 204 for valid analytics event', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'pricing_viewed',
        props: { where: 'pricing' }
      }),
    });

    const response = await POST(req);

    expect(response.status).toBe(204);
  });

  it('returns 204 even for malformed requests', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invalid: 'data'
      }),
    });

    const response = await POST(req);

    expect(response.status).toBe(204);
  });

  it('returns 204 for GET requests (graceful handling)', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics', { method: 'GET' });
    const response = await GET(req);

    expect(response.status).toBe(204);
  });
});
