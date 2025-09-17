/**
 * Fear & Greed Index Adapter
 * Fetches market sentiment data from Alternative.me API
 */

export interface AdapterResult {
  items: Array<{
    type: 'fear_greed';
    label: string;
    value: number;
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

export async function fetchFearGreed(ctx: AdapterCtx): Promise<AdapterResult> {
  const { startTime } = ctx.telemetry.start('fear_greed');

  try {
    const baseUrl = process.env.NEXT_PUBLIC_FGI_BASE || 'https://api.alternative.me/fng/';
    const url = `${baseUrl}?limit=1`;

    // Check for existing ETag
    const existingEtag = ctx.etagStore.get('fear_greed');
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
      ctx.telemetry.end('fear_greed', { ok: true, timedOut: false, elapsedMs });
      return {
        items: [],
        ok: true,
        timedOut: false,
        etag: existingEtag || undefined,
      };
    }

    if (!response.ok) {
      ctx.telemetry.end('fear_greed', { ok: false, timedOut: false, elapsedMs });
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
      ctx.etagStore.set('fear_greed', etag);
    }

    // Normalize to our format
    const fngData = data.data?.[0];
    if (!fngData) {
      ctx.telemetry.end('fear_greed', { ok: false, timedOut: false, elapsedMs });
      return {
        items: [],
        ok: false,
        timedOut: false,
      };
    }

    const parsedValue = parseInt(fngData.value);
    const value = isNaN(parsedValue) ? 50 : parsedValue;
    const classification = fngData.value_classification || 'Neutral';

    const items = [
      {
        type: 'fear_greed' as const,
        label: `${classification} (${value})`,
        value,
        ts: ctx.now.toISOString(),
      },
    ];

    ctx.telemetry.end('fear_greed', { ok: true, timedOut: false, elapsedMs });

    return {
      items,
      ok: true,
      timedOut: false,
      etag: etag || undefined,
    };
  } catch (error) {
    const elapsedMs = Date.now() - startTime;
    const timedOut = error instanceof Error && error.name === 'AbortError';

    ctx.telemetry.end('fear_greed', { ok: false, timedOut, elapsedMs });

    return {
      items: [],
      ok: false,
      timedOut,
    };
  }
}
