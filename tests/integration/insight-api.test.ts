import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';

const insights = new Map<string, any>();
const creators = new Map<string, any>();
let insightCounter = 1;
let creatorCounter = 1;

const prismaMock = {
  insight: {
    deleteMany: vi.fn(async () => {
      const count = insights.size;
      insights.clear();
      return { count };
    }),
    create: vi.fn(async ({ data }: any) => {
      const id = data.id || `insight-${insightCounter++}`;
      const record = { id, ...data };
      insights.set(id, record);
      return record;
    }),
    findUnique: vi.fn(async ({ where }: any) => {
      return insights.get(where?.id) || null;
    }),
  },
  creator: {
    deleteMany: vi.fn(async () => {
      const count = creators.size;
      creators.clear();
      return { count };
    }),
    create: vi.fn(async ({ data }: any) => {
      const id = data.id || `creator-${creatorCounter++}`;
      const record = { id, ...data };
      creators.set(id, record);
      return record;
    }),
    findUnique: vi.fn(async ({ where }: any) => {
      if (where?.id) return creators.get(where.id) || null;
      if (where?.handle) {
        for (const creator of creators.values()) {
          if (creator.handle === where.handle) return creator;
        }
      }
      return null;
    }),
  },
};

vi.mock('../../app/lib/prisma', () => ({ prisma: prismaMock }));

// Mock the insights pipeline
vi.mock('../../app/api/insights/_pipeline', () => ({
  runPipeline: vi.fn().mockResolvedValue({
    probability: 0.65,
    confidence: 0.8,
    interval: { lower: 0.5, upper: 0.8 },
    rationale: 'Test analysis based on technical indicators',
    scenarios: [
      { label: 'Bull Case', probability: 0.4, drivers: ['Strong momentum'] },
      { label: 'Base Case', probability: 0.35, drivers: ['Current conditions'] },
      { label: 'Bear Case', probability: 0.25, drivers: ['Risk factors'] },
    ],
    metrics: {
      rsi: 45.5,
      sma20: 50000,
      sma50: 49000,
      ema12: 50100,
      ema26: 49800,
      atr: 1500,
      trend: 'up' as const,
      sentiment: 0.2,
      support: 48000,
      resistance: 52000,
    },
    sources: [{ name: 'CoinGecko', url: 'https://coingecko.com' }],
    tookMs: 250,
  }),
}));

// Mock auth
vi.mock('../../app/api/insights/_auth', () => ({
  checkAuthAndQuota: vi.fn().mockReturnValue({
    allowed: true,
    plan: 'free',
    remaining: 9,
  }),
}));

let POST: any;
let GET: any;
const prisma = prismaMock;

beforeAll(async () => {
  const mod = await import('../../app/api/insight/route');
  POST = mod.POST;
  GET = mod.GET;
});

describe('Insight API Integration', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.insight.deleteMany();
    await prisma.creator.deleteMany();
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.insight.deleteMany();
    await prisma.creator.deleteMany();
  });

  describe('POST /api/insight', () => {
    it('should create a new insight without creator', async () => {
      const requestBody = {
        question: 'Will Bitcoin reach $100k by end of year?',
        category: 'crypto',
        horizon: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const request = new NextRequest('http://localhost:3000/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toMatchObject({
        question: requestBody.question,
        category: requestBody.category,
        probability: 0.65,
        confidence: 0.8,
        stamped: false,
        modelVersion: 'e8.1',
      });
      expect(data.id).toBeDefined();
      expect(data.createdAt).toBeDefined();
    });

    it('should create a new insight with creator', async () => {
      const requestBody = {
        question: 'Will ETH outperform BTC this quarter?',
        category: 'crypto',
        horizon: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        creatorHandle: 'testcreator',
      };

      const request = new NextRequest('http://localhost:3000/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.creator).toMatchObject({
        handle: 'testcreator',
        score: 0.0,
        accuracy: 0.0,
      });

      // Verify creator was created in database
      const creator = await prisma.creator.findUnique({
        where: { handle: 'testcreator' },
      });
      expect(creator).toBeDefined();
      expect(creator?.insightsCount).toBe(1);
    });

    it('should return 400 for invalid request', async () => {
      const requestBody = {
        question: 'Too short',
        category: '',
        horizon: 'invalid-date',
      };

      const request = new NextRequest('http://localhost:3000/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Invalid request format');
      expect(data.details).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Invalid JSON in request body');
    });

    it('should validate question length', async () => {
      const requestBody = {
        question: 'Q?', // Too short
        category: 'crypto',
        horizon: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const request = new NextRequest('http://localhost:3000/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Invalid request format');
      expect(data.details).toContain('question');
    });
  });

  describe('GET /api/insight', () => {
    it('should retrieve an existing insight', async () => {
      // First create an insight
      const insight = await prisma.insight.create({
        data: {
          question: 'Test question?',
          category: 'test',
          horizon: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          probability: 0.7,
          confidence: 0.85,
          intervalLower: 0.6,
          intervalUpper: 0.8,
          rationale: 'Test rationale',
          scenarios: JSON.stringify([]),
          metrics: JSON.stringify({}),
          sources: JSON.stringify([]),
          dataQuality: 0.9,
          modelVersion: 'e8.1',
        },
      });

      const request = new NextRequest(`http://localhost:3000/api/insight?id=${insight.id}`);
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toMatchObject({
        id: insight.id,
        question: 'Test question?',
        category: 'test',
        probability: 0.7,
        confidence: 0.85,
        stamped: false,
      });
    });

    it('should return 404 for non-existent insight', async () => {
      const request = new NextRequest('http://localhost:3000/api/insight?id=nonexistent');
      const response = await GET(request);

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe('Insight not found');
    });

    it('should return 400 for missing ID parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/insight');
      const response = await GET(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Missing insight ID parameter');
    });

    it('should retrieve insight with creator information', async () => {
      // Create creator first
      const creator = await prisma.creator.create({
        data: {
          handle: 'testcreator',
          score: 85.5,
          accuracy: 0.75,
          insightsCount: 5,
        },
      });

      // Create insight with creator
      const insight = await prisma.insight.create({
        data: {
          question: 'Test question with creator?',
          category: 'test',
          horizon: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          probability: 0.7,
          confidence: 0.85,
          intervalLower: 0.6,
          intervalUpper: 0.8,
          rationale: 'Test rationale',
          scenarios: JSON.stringify([]),
          metrics: JSON.stringify({}),
          sources: JSON.stringify([]),
          dataQuality: 0.9,
          modelVersion: 'e8.1',
          creatorId: creator.id,
        },
      });

      const request = new NextRequest(`http://localhost:3000/api/insight?id=${insight.id}`);
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.creator).toMatchObject({
        handle: 'testcreator',
        score: 85.5,
        accuracy: 0.75,
      });
    });

    it('should handle invalid UUID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/insight?id=invalid-uuid');
      const response = await GET(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Invalid insight ID format');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock prisma to throw an error
      vi.spyOn(prisma.insight, 'create').mockRejectedValueOnce(
        new Error('Database connection failed'),
      );

      const requestBody = {
        question: 'Will this test handle database errors?',
        category: 'test',
        horizon: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const request = new NextRequest('http://localhost:3000/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Internal server error');
    });

    it('should validate horizon date is in the future', async () => {
      const requestBody = {
        question: 'Will this test validate past dates?',
        category: 'test',
        horizon: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      };

      const request = new NextRequest('http://localhost:3000/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Invalid request format');
      expect(data.details).toContain('horizon');
    });
  });
});
