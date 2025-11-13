import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, validateReflectInput } from '@/app/api/ai/reflect/route';

describe('AI Reflection API', () => {
  const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: false });
  });

  it('validates reflection payloads and normalizes fields', () => {
    const result = validateReflectInput({
      insightId: 'abc123',
      question: 'Will BTC close above $45k?',
      predictedOutcome: 'BTC closes above $45k',
      actualOutcome: 'YES',
      predictedProbability: 72,
      actualProbability: 1,
      resolutionDate: '2024-01-01T00:00:00.000Z',
      timeframe: '1w',
      category: 'crypto',
      notes: 'Strong breakout momentum',
    });

    expect(result.ok).toBe(true);
    expect(result.input).toBeDefined();
    expect(result.input?.predictedProbability).toBeCloseTo(0.72, 2);
    expect(result.input?.actualProbability).toBe(1);
    expect(result.input?.resolutionDate).toBe('2024-01-01T00:00:00.000Z');
  });

  it('rejects invalid payloads', () => {
    const result = validateReflectInput({
      question: '',
      predictedOutcome: '',
      actualOutcome: '',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns a reflection response for valid requests', async () => {
    const requestBody = {
      insightId: 'test-1',
      question: 'Will inflation fall below 3%?',
      predictedOutcome: 'Inflation prints below 3%',
      actualOutcome: 'NO',
      predictedProbability: 0.4,
      actualProbability: 0,
      resolutionDate: new Date().toISOString(),
      category: 'macro',
    };

    const request = new NextRequest('http://localhost:3000/api/ai/reflect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.0.1',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.reflection).toBeDefined();
    expect(payload.reflection.summary).toContain('Will inflation fall below 3%');
    expect(payload.reflection.improvementSuggestions.length).toBeGreaterThan(0);
  });

  it('returns 400 for invalid requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/reflect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.0.2',
      },
      body: JSON.stringify({ question: 'Missing fields' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBeDefined();
  });

  it('enforces rate limits per IP', async () => {
    const requestBody = {
      question: 'Will Solana flip ETH?',
      predictedOutcome: 'SOL market cap exceeds ETH',
      actualOutcome: 'NO',
    };

    const createRequest = () =>
      new NextRequest('http://localhost:3000/api/ai/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.10',
        },
        body: JSON.stringify(requestBody),
      });

    const firstResponse = await POST(createRequest());
    expect(firstResponse.status).toBe(200);

    const secondResponse = await POST(createRequest());
    expect(secondResponse.status).toBe(429);
    const payload = await secondResponse.json();
    expect(payload.error).toBeDefined();
  });
});
