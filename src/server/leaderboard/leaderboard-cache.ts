import { Prisma, PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { redis } from '../../../app/lib/redis';
import { calculateTrend } from '../../../app/lib/creatorScore';

export type LeaderboardPeriod = '7d' | '30d' | '90d' | 'all';

export interface LeaderboardItem {
  creatorIdHashed: string;
  score: number;
  accuracy: number;
  consistency: number;
  volumeScore: number;
  recencyScore: number;
  maturedN: number;
  topBadge?: 'top1' | 'top2' | 'top3';
  trend?: 'up' | 'down' | 'flat';
  isProvisional: boolean;
}

export interface CachedPeriodPayload {
  period: LeaderboardPeriod;
  generatedAt: string;
  total: number;
  items: LeaderboardItem[];
  etag: string;
}

export const DEFAULT_PERIODS: LeaderboardPeriod[] = ['7d', '30d', '90d', 'all'];
export const MAX_CACHE_LIMIT = 100;
const CACHE_TTL_SECONDS = 900; // 15 minutes

function getItemsKey(period: LeaderboardPeriod) {
  return `leaderboard:${period}:z`;
}

function getDataKey(period: LeaderboardPeriod) {
  return `leaderboard:${period}:data`;
}

function getMetaKey(period: LeaderboardPeriod) {
  return `leaderboard:${period}:meta`;
}

function periodSince(period: LeaderboardPeriod): Date | undefined {
  if (period === 'all') return undefined;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - days);
  return since;
}

function hashCreatorId(creatorId: string): string {
  return createHash('sha256').update(creatorId).digest('hex').substring(0, 16);
}

function decorateBadges(items: LeaderboardItem[]): LeaderboardItem[] {
  return items.map((item, index) => {
    let topBadge: LeaderboardItem['topBadge'];
    if (index === 0) topBadge = 'top1';
    else if (index === 1) topBadge = 'top2';
    else if (index === 2) topBadge = 'top3';

    return { ...item, topBadge };
  });
}

function buildEtag(payload: Omit<CachedPeriodPayload, 'etag'>): string {
  const content = JSON.stringify({
    period: payload.period,
    generatedAt: payload.generatedAt,
    items: payload.items,
    total: payload.total
  });
  return `"${createHash('sha256').update(content).digest('hex')}"`;
}

async function writeCache(period: LeaderboardPeriod, payload: CachedPeriodPayload) {
  if (!redis) return;

  const itemsKey = getItemsKey(period);
  const dataKey = getDataKey(period);
  const metaKey = getMetaKey(period);

  try {
    await redis.del(itemsKey, dataKey, metaKey);

    if (payload.items.length > 0) {
      const members = payload.items.map((item) => ({
        score: Number(item.score.toFixed(6)),
        member: item.creatorIdHashed,
      }));

      for (const entry of members) {
        await redis.zadd(itemsKey, entry);
      }

      const dataEntries: Record<string, string> = {};
      for (const item of payload.items) {
        dataEntries[item.creatorIdHashed] = JSON.stringify(item);
      }
      await redis.hset(dataKey, dataEntries);
    }

    await redis.set(
      metaKey,
      JSON.stringify({
        generatedAt: payload.generatedAt,
        total: payload.total,
        etag: payload.etag,
        max: payload.items.length,
      })
    );

    await redis.expire(itemsKey, CACHE_TTL_SECONDS);
    await redis.expire(dataKey, CACHE_TTL_SECONDS);
    await redis.expire(metaKey, CACHE_TTL_SECONDS);
  } catch (error) {
    console.error('[leaderboard-cache] Failed to write cache', { period, error });
  }
}

export function buildResponseFromPayload(payload: CachedPeriodPayload, limit: number, offset: number) {
  const slice = payload.items.slice(offset, offset + limit);
  const hasMore = offset + slice.length < payload.total;

  return {
    etag: payload.etag,
    generatedAt: payload.generatedAt,
    period: payload.period,
    items: slice,
    meta: {
      total: payload.total,
      limit,
      offset,
      hasMore,
    },
  };
}

export type LeaderboardResponse = ReturnType<typeof buildResponseFromPayload>;

export async function getCachedLeaderboardSlice(
  period: LeaderboardPeriod,
  limit: number,
  offset: number
): Promise<CachedPeriodPayload | null> {
  if (!redis) return null;
  if (offset + limit > MAX_CACHE_LIMIT) return null;

  try {
    const metaRaw = await redis.get(getMetaKey(period));
    if (!metaRaw) return null;
    const meta = JSON.parse(metaRaw as string) as {
      generatedAt: string;
      total: number;
      etag: string;
      max: number;
    };

    if (meta.max <= 0) return null;
    if (offset >= meta.max) return null;

    const maxIndex = meta.max - 1;

    const idsRaw = await redis.zrange(getItemsKey(period), 0, maxIndex, {
      rev: true,
    });

    const ids = Array.isArray(idsRaw) ? (idsRaw as string[]) : [];

    if (!ids || ids.length === 0) return null;

    const valuesRaw = await redis.hmget(getDataKey(period), ...ids);
    const values = Array.isArray(valuesRaw) ? (valuesRaw as Array<string | null>) : [];
    const items: LeaderboardItem[] = [];

    ids.forEach((id, index) => {
      const raw = values[index];
      if (typeof raw !== 'string') return;
      try {
        const parsed = JSON.parse(raw) as LeaderboardItem;
        items.push(parsed);
      } catch (error) {
        console.error('[leaderboard-cache] Failed to parse cached item', { period, id, error });
      }
    });

    const payload: CachedPeriodPayload = {
      period,
      generatedAt: meta.generatedAt,
      total: meta.total,
      items,
      etag: meta.etag,
    };

    return payload;
  } catch (error) {
    console.error('[leaderboard-cache] Failed to read cache', { period, error });
    return null;
  }
}

export async function refreshLeaderboardPeriod(
  prisma: PrismaClient,
  period: LeaderboardPeriod,
  max: number = MAX_CACHE_LIMIT
): Promise<CachedPeriodPayload | null> {
  try {
    const since = periodSince(period);
    const where = since
      ? ({
          day: {
            gte: since,
          },
        } as Prisma.CreatorDailyWhereInput)
      : undefined;

    const grouped = await prisma.creatorDaily.groupBy({
      by: ['creatorId'],
      where,
      _sum: { maturedN: true },
      _avg: {
        accuracy: true,
        consistency: true,
        volumeScore: true,
        recencyScore: true,
        score: true,
      },
      orderBy: {
        _avg: {
          score: 'desc',
        },
      },
      take: max,
    });

    const distinctCreators = await prisma.creatorDaily.findMany({
      where,
      select: { creatorId: true },
      distinct: ['creatorId'],
    });
    const total = distinctCreators.length;

    const items: LeaderboardItem[] = [];

    for (let index = 0; index < grouped.length; index++) {
      const row = grouped[index];
      const maturedN = Number(row._sum.maturedN ?? 0);
      const accuracy = Number(row._avg.accuracy ?? 0);
      const consistency = Number(row._avg.consistency ?? 0);
      const volumeScore = Number(row._avg.volumeScore ?? 0);
      const recencyScore = Number(row._avg.recencyScore ?? 0);
      const score = Number(row._avg.score ?? 0);

      let trend: LeaderboardItem['trend'];
      if (period === '7d' && since) {
        const prevSince = new Date(since);
        prevSince.setDate(prevSince.getDate() - 7);
        const prevUntil = new Date(since);

        const previous = await prisma.creatorDaily.aggregate({
          where: {
            creatorId: row.creatorId,
            day: {
              gte: prevSince,
              lt: prevUntil,
            },
          },
          _avg: { score: true },
        });

        const prevScore = previous._avg.score;
        if (prevScore !== null && prevScore !== undefined) {
          trend = calculateTrend(score, Number(prevScore));
        }
      }

      items.push({
        creatorIdHashed: hashCreatorId(row.creatorId),
        score,
        accuracy,
        consistency,
        volumeScore,
        recencyScore,
        maturedN,
        trend,
        isProvisional: maturedN < 50,
      });
    }

    const decorated = decorateBadges(items);
    const generatedAt = new Date().toISOString();
    const payloadWithoutEtag = {
      period,
      generatedAt,
      total,
      items: decorated,
    };
    const etag = buildEtag(payloadWithoutEtag);
    const payload: CachedPeriodPayload = {
      ...payloadWithoutEtag,
      etag,
    };

    await writeCache(period, payload);
    return payload;
  } catch (error) {
    console.error('[leaderboard-cache] Failed to refresh period', { period, error });
    return null;
  }
}

export async function refreshLeaderboardCache(
  prisma: PrismaClient,
  periods: LeaderboardPeriod[] = DEFAULT_PERIODS
) {
  for (const period of periods) {
    await refreshLeaderboardPeriod(prisma, period);
  }
}

export async function invalidateLeaderboardCache(period?: LeaderboardPeriod) {
  if (!redis) return;

  const periods = period ? [period] : DEFAULT_PERIODS;
  for (const p of periods) {
    try {
      await redis.del(getItemsKey(p), getDataKey(p), getMetaKey(p));
    } catch (error) {
      console.error('[leaderboard-cache] Failed to invalidate cache', { period: p, error });
    }
  }
}
