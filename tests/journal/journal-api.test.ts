import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../../app/api/me/journal/route';
import { prisma } from '../../app/lib/prisma';

describe('Journal API', () => {
  beforeEach(async () => {
    await prisma.journalReminder.deleteMany();
    await prisma.personalJournalEntry.deleteMany();
    await prisma.outcome.deleteMany();
    await prisma.insight.deleteMany();
    await prisma.creator.deleteMany();
  });

  afterAll(async () => {
    await prisma.journalReminder.deleteMany();
    await prisma.personalJournalEntry.deleteMany();
    await prisma.outcome.deleteMany();
    await prisma.insight.deleteMany();
    await prisma.creator.deleteMany();
    await prisma.$disconnect();
  });

  it('requires a creator identifier', async () => {
    const request = new NextRequest('http://localhost:3000/api/me/journal');
    const response = await GET(request);
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toContain('creatorId');
  });

  it('returns insights, reminders, and metrics for a creator', async () => {
    const creator = await prisma.creator.create({
      data: {
        handle: 'journal-user',
      },
    });

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 5);

    const insight = await prisma.insight.create({
      data: {
        creatorId: creator.id,
        question: 'Will BTC close above $80k on 2025-01-01?',
        category: 'crypto',
        horizon: new Date(deadline.getTime() - 24 * 60 * 60 * 1000),
        probability: 0.6,
        confidence: 0.8,
        intervalLower: 0.4,
        intervalUpper: 0.8,
        rationale: 'Testing personal journal API',
        scenarios: '[]',
        metrics: '{}',
        sources: '[]',
        dataQuality: 0.9,
        canonical: 'BTC close >= 80000 USD on 2025-01-01',
        status: 'RESOLVED',
        deadline,
        p: 0.6,
      },
    });

    await prisma.outcome.create({
      data: {
        insightId: insight.id,
        result: 'YES',
        decidedBy: 'AGENT',
      },
    });

    await prisma.personalJournalEntry.create({
      data: {
        creatorId: creator.id,
        insightId: insight.id,
        title: 'First reflection',
        content: 'Learned a lot from this forecast.',
      },
    });

    const pastReminder = new Date();
    pastReminder.setHours(pastReminder.getHours() - 2);

    await prisma.journalReminder.create({
      data: {
        creatorId: creator.id,
        insightId: insight.id,
        remindAt: pastReminder,
        status: 'PENDING',
      },
    });

    const request = new NextRequest(`http://localhost:3000/api/me/journal?creatorId=${creator.id}`);
    const response = await GET(request);

    expect(response.status).toBe(200);
    const payload = await response.json();

    expect(payload.creator.id).toBe(creator.id);
    expect(payload.insights).toHaveLength(1);
    expect(payload.pendingReminders).toBe(1);

    const [returnedInsight] = payload.insights;
    expect(returnedInsight.entry).not.toBeNull();
    expect(returnedInsight.reminders).toHaveLength(1);
    expect(returnedInsight.outcome?.result).toBe('YES');

    expect(payload.metrics.periods['7d'].metrics.count).toBeGreaterThanOrEqual(1);
    expect(payload.metrics.periods['30d'].metrics.count).toBeGreaterThanOrEqual(1);
    expect(payload.metrics.periods['90d'].metrics.count).toBeGreaterThanOrEqual(1);
  });
});
