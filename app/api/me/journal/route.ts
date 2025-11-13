import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { normalizePrediction } from '@/lib/normalize';
import { getPersonalMetrics } from '@/lib/score';

function toNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (value && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const creatorIdParam = searchParams.get('creatorId');
  const handleParam = searchParams.get('handle');
  const walletParam = searchParams.get('wallet');
  const headerHandle = request.headers.get('x-creator-handle');
  const headerWallet = request.headers.get('x-wallet-address');

  try {
    let creator;

    if (creatorIdParam) {
      creator = await prisma.creator.findUnique({ where: { id: creatorIdParam } });
    } else {
      const identifiers: string[] = [];
      if (handleParam) identifiers.push(handleParam);
      if (walletParam) identifiers.push(walletParam);
      if (headerHandle) identifiers.push(headerHandle);
      if (headerWallet) identifiers.push(headerWallet);

      if (identifiers.length === 0) {
        return NextResponse.json(
          { error: 'Provide a creatorId, wallet, or handle to fetch journal data.' },
          { status: 400 },
        );
      }

      creator = await prisma.creator.findFirst({
        where: {
          OR: identifiers.map((identifier) => ({
            OR: [
              { handle: identifier },
              { wallet: identifier },
            ],
          })),
        },
      });
    }

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found.' }, { status: 404 });
    }

    const insights = await prisma.insight.findMany({
      where: { creatorId: creator.id },
      include: {
        outcomes: {
          orderBy: { decidedAt: 'desc' },
          take: 1,
        },
        journalEntries: {
          where: { creatorId: creator.id },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        journalReminders: {
          where: { creatorId: creator.id },
          orderBy: { remindAt: 'asc' },
        },
      },
      orderBy: {
        deadline: 'asc',
      },
      take: 100,
    });

    const now = new Date();

    const formattedInsights = insights.map((insight) => {
      const deadline = insight.deadline ?? insight.horizon ?? null;
      const probability = insight.p != null ? toNumber(insight.p) : toNumber(insight.probability);

      let canonical = insight.canonical || insight.question;
      if (!insight.canonical) {
        try {
          const normalized = normalizePrediction(insight.question, {
            p: probability,
            deadline: deadline ?? undefined,
            resolverKind: insight.resolverKind ? insight.resolverKind.toLowerCase() as 'price' | 'url' | 'text' : undefined,
            resolverConfig: insight.resolverRef ? JSON.parse(insight.resolverRef) : undefined,
          });
          canonical = normalized.canonical;
        } catch (error) {
          console.warn('Failed to normalize insight for journal response', { id: insight.id, error });
        }
      }

      const entry = insight.journalEntries[0]
        ? {
            id: insight.journalEntries[0].id,
            title: insight.journalEntries[0].title,
            content: insight.journalEntries[0].content,
            createdAt: insight.journalEntries[0].createdAt.toISOString(),
            updatedAt: insight.journalEntries[0].updatedAt.toISOString(),
          }
        : null;

      const reminders = insight.journalReminders.map((reminder) => ({
        id: reminder.id,
        remindAt: reminder.remindAt.toISOString(),
        status: reminder.status,
        sentAt: reminder.sentAt ? reminder.sentAt.toISOString() : null,
      }));

      const nextReminder = insight.journalReminders
        .filter((reminder) => reminder.status === 'PENDING' && reminder.remindAt >= now)
        .sort((a, b) => a.remindAt.getTime() - b.remindAt.getTime())[0]?.remindAt ?? null;

      const outcome = insight.outcomes[0]
        ? {
            result: insight.outcomes[0].result,
            decidedAt: insight.outcomes[0].decidedAt ? insight.outcomes[0].decidedAt.toISOString() : null,
          }
        : null;

      const dueInDays = deadline
        ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: insight.id,
        canonical,
        question: insight.question,
        probability,
        deadline: deadline ? deadline.toISOString() : null,
        status: insight.status,
        createdAt: insight.createdAt.toISOString(),
        dueInDays,
        entry,
        outcome,
        reminders,
        nextReminder: nextReminder ? nextReminder.toISOString() : null,
      };
    });

    const pendingReminders = formattedInsights.reduce((acc, insight) => {
      const due = insight.reminders.filter((reminder) => {
        if (reminder.status !== 'PENDING') return false;
        const remindAt = new Date(reminder.remindAt);
        return remindAt <= now;
      }).length;
      return acc + due;
    }, 0);

    const personalMetrics = await getPersonalMetrics(creator.id);

    const metrics = {
      periods: {
        '7d': {
          label: '7d' as const,
          from: personalMetrics['7d'].from.toISOString(),
          to: personalMetrics['7d'].to.toISOString(),
          metrics: personalMetrics['7d'].metrics,
          calibration: personalMetrics['7d'].calibration,
        },
        '30d': {
          label: '30d' as const,
          from: personalMetrics['30d'].from.toISOString(),
          to: personalMetrics['30d'].to.toISOString(),
          metrics: personalMetrics['30d'].metrics,
          calibration: personalMetrics['30d'].calibration,
        },
        '90d': {
          label: '90d' as const,
          from: personalMetrics['90d'].from.toISOString(),
          to: personalMetrics['90d'].to.toISOString(),
          metrics: personalMetrics['90d'].metrics,
          calibration: personalMetrics['90d'].calibration,
        },
      },
    };

    return NextResponse.json({
      creator: {
        id: creator.id,
        handle: creator.handle,
        wallet: creator.wallet,
      },
      insights: formattedInsights,
      metrics,
      pendingReminders,
    });
  } catch (error) {
    console.error('Failed to fetch journal data', error);
    return NextResponse.json({ error: 'Failed to load journal data.' }, { status: 500 });
  }
}
