#!/usr/bin/env tsx
/*
 * Weekly personal digest job
 * Summarises recent prediction performance and shares AI coaching tips.
 */

import { PrismaClient, InsightStatus, OutcomeResult } from '@prisma/client';
import { EmailChannel } from '../app/lib/advisor/channels/email';
import { getReflectionWithCache } from '../lib/cache/reflection-cache';
import { PredictionReflectionInput } from '../lib/ai/prediction-analyzer';

const prisma = new PrismaClient();
const emailChannel = new EmailChannel();

interface CreatorDigestContext {
  creatorId: string;
  handle: string;
  targetEmail?: string;
}

interface DigestInsight {
  id: string;
  question: string;
  predictedOutcome: string;
  predictedProbability?: number;
  actualOutcome: OutcomeResult;
  actualProbability?: number;
  resolvedAt: string;
  timeframe?: string;
  category?: string;
  notes?: string;
}

function resolveProbability(probability?: number | null): number | undefined {
  if (probability === undefined || probability === null) return undefined;
  return Number(probability);
}

function resolveDecimalProbability(value: any): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  if (typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return undefined;
}

function resolveTimeframe(createdAt?: Date | null, horizon?: Date | null): string | undefined {
  if (!createdAt || !horizon) return undefined;
  const diffMs = horizon.getTime() - createdAt.getTime();
  if (!Number.isFinite(diffMs)) return undefined;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'same day';
  if (diffDays === 1) return '24h';
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.round(diffDays / 7)}w`;
  if (diffDays < 365) return `${Math.round(diffDays / 30)}m`;
  return `${Math.round(diffDays / 365)}y`;
}

function resolveActualProbability(outcome: OutcomeResult): number | undefined {
  if (outcome === OutcomeResult.YES) return 1;
  if (outcome === OutcomeResult.NO) return 0;
  if (outcome === OutcomeResult.INVALID) return 0.5;
  return undefined;
}

function determineEmailTarget(handle: string): string | undefined {
  if (process.env.DIGEST_TARGET_EMAIL) {
    return process.env.DIGEST_TARGET_EMAIL;
  }
  if (process.env.DIGEST_FALLBACK_EMAIL) {
    return process.env.DIGEST_FALLBACK_EMAIL;
  }
  if (!handle) return undefined;
  return `${handle}@predikt.email`;
}

async function loadCreatorsWithActivity(): Promise<CreatorDigestContext[]> {
  const creators = await prisma.creator.findMany({
    select: {
      id: true,
      handle: true,
    },
  });

  return creators.map(creator => ({
    creatorId: creator.id,
    handle: creator.handle,
    targetEmail: determineEmailTarget(creator.handle),
  }));
}

async function loadResolvedInsights(creatorId: string, since: Date): Promise<DigestInsight[]> {
  const insights = await prisma.insight.findMany({
    where: {
      creatorId,
      status: InsightStatus.RESOLVED,
      outcomes: {
        some: {
          decidedAt: {
            gte: since,
          },
        },
      },
    },
    include: {
      outcomes: {
        orderBy: { decidedAt: 'desc' },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return insights
    .map(insight => {
      const outcome = insight.outcomes[0];
      if (!outcome) return null;

      const predictedProbability =
        resolveDecimalProbability(insight.p) ?? resolveProbability(insight.probability);

      return {
        id: insight.id,
        question: insight.question,
        predictedOutcome: insight.canonical || insight.question,
        predictedProbability,
        actualOutcome: outcome.result,
        actualProbability: resolveActualProbability(outcome.result),
        resolvedAt: outcome.decidedAt.toISOString(),
        timeframe: resolveTimeframe(insight.createdAt, insight.horizon),
        category: insight.category,
        notes: insight.rationale?.slice(0, 280) || undefined,
      } satisfies DigestInsight;
    })
    .filter((entry): entry is DigestInsight => Boolean(entry));
}

async function buildReflection(input: DigestInsight) {
  const reflectionInput: PredictionReflectionInput = {
    insightId: input.id,
    question: input.question,
    predictedOutcome: input.predictedOutcome,
    actualOutcome: input.actualOutcome,
    predictedProbability: input.predictedProbability,
    actualProbability: input.actualProbability,
    resolutionDate: input.resolvedAt,
    timeframe: input.timeframe,
    category: input.category,
    notes: input.notes,
  };

  return getReflectionWithCache(reflectionInput, { tag: input.id });
}

function tallyPerformance(insights: DigestInsight[]) {
  let wins = 0;
  let losses = 0;
  let inconclusive = 0;

  for (const insight of insights) {
    if (insight.actualOutcome === OutcomeResult.INVALID) {
      inconclusive += 1;
      continue;
    }

    const probability = insight.predictedProbability ?? 0.5;
    const predictedDirection = probability >= 0.5 ? OutcomeResult.YES : OutcomeResult.NO;

    if (predictedDirection === insight.actualOutcome) {
      wins += 1;
    } else {
      losses += 1;
    }
  }

  const considered = wins + losses;
  const winRate = considered === 0 ? 0 : (wins / considered) * 100;

  return { wins, losses, inconclusive, winRate: Math.round(winRate) };
}

function buildEmailPayload(
  context: CreatorDigestContext,
  performance: ReturnType<typeof tallyPerformance>,
  reflections: Awaited<ReturnType<typeof buildReflection>>[],
) {
  const topTips = Array.from(
    new Set(reflections.flatMap(reflection => reflection.improvementSuggestions)),
  ).slice(0, 3);

  const highlight = reflections.slice(0, 3).map(reflection => ({
    insightId: reflection.insightId,
    summary: reflection.summary,
    verdict: reflection.verdict,
    nextActions: reflection.nextActions,
  }));

  return {
    creator: context.handle,
    performance,
    tips: topTips,
    highlights: highlight,
    generatedAt: new Date().toISOString(),
  };
}

async function sendDigestForCreator(context: CreatorDigestContext, since: Date) {
  const resolved = await loadResolvedInsights(context.creatorId, since);
  if (!resolved.length) {
    console.log(`ℹ️  No resolved insights for @${context.handle} this period.`);
    return;
  }

  const performance = tallyPerformance(resolved);
  const reflections = await Promise.all(resolved.map(buildReflection));
  const payload = buildEmailPayload(context, performance, reflections);

  if (!context.targetEmail) {
    console.warn(`⚠️  Skipping digest for @${context.handle} - no email target available.`);
    return;
  }

  await emailChannel.send({
    target: context.targetEmail,
    ruleName: 'weekly_digest',
    payload,
  });

  console.log(`📬 Sent digest to ${context.targetEmail} (wins: ${performance.wins}, losses: ${performance.losses}).`);
}

async function main() {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  try {
    console.log('🗞️  Generating weekly personal digests...');
    const creators = await loadCreatorsWithActivity();
    for (const context of creators) {
      await sendDigestForCreator(context, weekAgo);
    }
    console.log('✅ Personal digest job completed.');
  } catch (error) {
    console.error('❌ Failed to generate personal digests:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
