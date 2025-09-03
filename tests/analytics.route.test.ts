import { describe, it, expect } from 'vitest';

const API_URL = process.env.VITEST_API_URL || 'http://localhost:3000';

describe('/api/analytics', () => {
  it('returns 204 for valid analytics event', async () => {
    const response = await fetch(`${API_URL}/api/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'pricing_viewed',
        props: { where: 'pricing' }
      }),
    });

    expect(response.status).toBe(204);
  });

  it('returns 204 even for malformed requests', async () => {
    const response = await fetch(`${API_URL}/api/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invalid: 'data'
      }),
    });

    expect(response.status).toBe(204);
  });

  it('returns 204 for GET requests (graceful handling)', async () => {
    const response = await fetch(`${API_URL}/api/analytics`, {
      method: 'GET',
    });

    expect(response.status).toBe(204);
  });
});
