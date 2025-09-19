/**
 * Live Markets API
 * GET /api/markets/live - Return only active (live) markets
 */

import { NextRequest, NextResponse } from 'next/server';
import { markets as allMarkets } from '@/app/lib/markets';

export const runtime = 'nodejs';

type LiveMarket = {
  id: string;
  title: string;
  category: string;
  closesAt: string; // ISO date string
  yesPrice: number;
  noPrice: number;
  totalVolume: number;
  participants: number;
  status: 'open' | 'closed';
  // Optional creator metadata for UI attribution
  creator?: {
    id?: string;
    name?: string;
    avatar?: string;
    type?: 'KOL' | 'EXPERT' | 'COMMUNITY' | 'PREDIKT';
  };
};

function isLive(m: any, now = new Date()): boolean {
  try {
    const end = new Date(m.endDate);
    return Boolean(m.isActive) && end.getTime() > now.getTime();
  } catch {
    return false;
  }
}

function toLiveMarket(m: any): LiveMarket {
  return {
    id: m.id,
    title: m.title,
    category: m.category,
    closesAt: new Date(m.endDate).toISOString(),
    yesPrice: Number(m.yesPrice ?? 0),
    noPrice: Number(m.noPrice ?? 0),
    totalVolume: Number(m.totalVolume ?? 0),
    participants: Number(m.participants ?? 0),
    status: 'open',
    creator: m.creatorId
      ? {
          id: m.creatorId,
          name: m.creatorName,
          avatar: m.creatorAvatar,
          type: m.creatorType,
        }
      : undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '12', 10), 50));
    const sort = (searchParams.get('sort') || 'closing_soon').toLowerCase();
    const category = (searchParams.get('category') || 'all').toString();

    const now = new Date();

    // Filter only live markets (active and not past endDate)
    let live = allMarkets.filter(m => isLive(m, now));

    // Optional category filter if provided and not 'all'
    if (category && category !== 'all') {
      const catNorm = category.toLowerCase();
      live = live.filter(m => String(m.category || '').toLowerCase() === catNorm);
    }

    // Sort strategies
    if (sort === 'volume') {
      live.sort((a, b) => Number(b.totalVolume ?? 0) - Number(a.totalVolume ?? 0));
    } else if (sort === 'newest') {
      // We do not have createdAt on mock; fallback to sorting by closesAt descending
      live.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
    } else {
      // Default: closing soon (ascending time to close)
      live.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    }

    const limited = live.slice(0, limit).map(toLiveMarket);

    const body = {
      markets: limited,
      meta: {
        total: live.length,
        limit,
        sort,
        category,
        generatedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(body, {
      headers: {
        // Reasonable caching: 60s with 5m stale-while-revalidate
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[LiveMarketsAPI] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
