/**
 * Polymarket Adapter
 * Fetches prediction market data from Polymarket API
 */

export interface AdapterResult {
  items: Array<{
    type: 'polymarket';
    label: string;
    prob: number;
    ts: string;
  }>;
  ok: boolean;
  timedOut: boolean;
  etag?: string;
}

export interface AdapterCtx {
  now: Date;
  timeoutMs: number;
  etagStore: {
    get: (key: string) => string | null;
    set: (key: string, etag: string) => void;
  };
  fetchImpl: typeof fetch;
  telemetry: {
    start: (source: string) => { startTime: number };
    end: (source: string, result: { ok: boolean; timedOut: boolean; elapsedMs: number }) => void;
  };
}

export async function fetchPolymarket(ctx: AdapterCtx): Promise<AdapterResult> {
  const { startTime } = ctx.telemetry.start('polymarket');

  try {
    // NOTE: Polymarket API might not be available or has changed endpoints
    // For now, we'll return mock data to prevent 401/404 errors
    const baseUrl = process.env.NEXT_PUBLIC_PM_BASE;

    // If no custom base URL is set, return mock data
    if (!baseUrl) {
      ctx.telemetry.end('polymarket', {
        ok: true,
        timedOut: false,
        elapsedMs: Date.now() - startTime,
      });
      return {
        items: [
          {
            type: 'polymarket' as const,
            label: 'Market prediction (demo)',
            prob: 0.65,
            ts: ctx.now.toISOString(),
          },
        ],
        ok: true,
        timedOut: false,
      };
    }

    const url = `${baseUrl}?active=true&limit=3`;

    // Check for existing ETag
    const existingEtag = ctx.etagStore.get('polymarket');
    const headers: HeadersInit = {
      'User-Agent': 'PrediktFi/1.0',
      Accept: 'application/json',
    };

    if (existingEtag) {
      headers['If-None-Match'] = existingEtag;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ctx.timeoutMs);

    const response = await ctx.fetchImpl(url, {
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const elapsedMs = Date.now() - startTime;

    // Handle 304 Not Modified
    if (response.status === 304) {
      ctx.telemetry.end('polymarket', { ok: true, timedOut: false, elapsedMs });
      return {
        items: [],
        ok: true,
        timedOut: false,
        etag: existingEtag || undefined,
      };
    }

    if (!response.ok) {
      ctx.telemetry.end('polymarket', { ok: false, timedOut: false, elapsedMs });
      return {
        items: [],
        ok: false,
        timedOut: false,
      };
    }

    const data = await response.json();

    // Extract ETag from response
    const etag = response.headers.get('ETag');
    if (etag) {
      ctx.etagStore.set('polymarket', etag);
    }

    // Normalize to our format
    const items = (data.data || []).slice(0, 3).map((market: any) => ({
      type: 'polymarket' as const,
      label: market.question || 'Market prediction',
      prob: Math.max(0, Math.min(1, market.outcomeTokens?.[0]?.price || 0.5)),
      ts: ctx.now.toISOString(),
    }));

    ctx.telemetry.end('polymarket', { ok: true, timedOut: false, elapsedMs });

    return {
      items,
      ok: true,
      timedOut: false,
      etag: etag || undefined,
    };
  } catch (error) {
    const elapsedMs = Date.now() - startTime;
    const timedOut = error instanceof Error && error.name === 'AbortError';

    ctx.telemetry.end('polymarket', { ok: false, timedOut, elapsedMs });

    return {
      items: [],
      ok: false,
      timedOut,
    };
  }
}
