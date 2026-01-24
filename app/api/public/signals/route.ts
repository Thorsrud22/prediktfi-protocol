/**
 * Public Market Signals API
 * GET /api/public/signals
 * 
 * Returns cached market context signals with L2 cache, SWR, and ETag support
 * Optimized for early 304 returns and lazy imports
 * Supports gradual rollout based on IP address
 */

export const runtime = "nodejs";

import { NextResponse, NextRequest } from 'next/server';
import { getFresh, getStaleButServeable, getOrRefresh } from '@/lib/cache/signalsL2';
import { shouldEnableSignals } from '@/lib/flags';
import { checkRateLimit } from '@/app/lib/ratelimit';

type Entry = { etag: string; payload: any; ts: number };

async function refresher(): Promise<Entry> {
  const { getMarketSignals } = await import('@/server/signals/feed');
  const { makeEtag } = await import('@/lib/etag');
  const payload = await getMarketSignals();
  const etag = makeEtag(payload);
  return { etag, payload, ts: Date.now() };
}

export async function GET(req: Request) {
  // Rate limit check for public API to prevent scraping
  // Using 'global' plan (10 requests/min)
  const limitRes = await checkRateLimit(req as NextRequest, { plan: 'global' });
  if (limitRes) {
    return limitRes;
  }

  const now = Date.now();

  // Extract client IP for rollout check
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  const clientIp = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';

  // Check if signals API is enabled for this client
  if (!shouldEnableSignals(clientIp)) {
    return NextResponse.json(
      { error: 'Signals API not available' },
      {
        status: 503,
        headers: {
          'X-Rollout-Status': 'disabled',
          'Retry-After': '3600' // 1 hour
        }
      }
    );
  }

  // Normalize ETag format - remove W/ and quotes before comparison
  const raw = req.headers.get("if-none-match");
  const inm = raw?.replace(/^W\/"?|"?$/g, ""); // W/"abc" → abc
  const fresh = getFresh(now);

  // 1) 304 – ingen arbeid, ingen imports utover det som er i denne fila
  if (fresh) {
    const current = fresh.etag.replace(/^W\/"?|"?$/g, "");
    if (inm && inm === current) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: fresh.etag,
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120, max-age=0, must-revalidate",
          "X-Cache": "HIT-304",
          "X-Rollout-Status": "enabled",
          "X-Rollout-Percent": process.env.ROLLOUT_PERCENT || '0'
        }
      });
    }
  }

  // 2) HIT – server umiddelbart
  if (fresh) {
    return NextResponse.json(fresh.payload, {
      headers: {
        ETag: fresh.etag,
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120, max-age=0, must-revalidate",
        "X-Cache": "HIT",
        "X-Rollout-Status": "enabled",
        "X-Rollout-Percent": process.env.ROLLOUT_PERCENT || '0'
      }
    });
  }

  // 3) STALE – server raskt, trigge refresh i bakgrunnen (ikke await)
  const stale = getStaleButServeable(now);
  if (stale) {
    void getOrRefresh("signals", refresher);
    return NextResponse.json(stale.payload, {
      headers: {
        ETag: stale.etag,
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120, max-age=0, must-revalidate",
        "X-Cache": "STALE",
        "X-Rollout-Status": "enabled",
        "X-Rollout-Percent": process.env.ROLLOUT_PERCENT || '0'
      }
    });
  }

  // 4) MISS – eneste blocking refresh
  const entry = await getOrRefresh("signals", refresher);
  return NextResponse.json(entry.payload, {
    headers: {
      ETag: entry.etag,
      "Cache-Control": "public, max-age=0, must-revalidate, stale-while-revalidate=120",
      "X-Cache": "MISS",
      "X-Rollout-Status": "enabled",
      "X-Rollout-Percent": process.env.ROLLOUT_PERCENT || '0'
    }
  });
}
