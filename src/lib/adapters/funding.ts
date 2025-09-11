/**
 * Funding Rate Adapter
 * Fetches funding rate data for crypto pairs
 */

export interface AdapterResult {
  items: Array<{
    type: 'funding';
    label: string;
    direction: 'up' | 'down' | 'neutral';
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

export async function fetchFunding(ctx: AdapterCtx): Promise<AdapterResult> {
  const { startTime } = ctx.telemetry.start('funding');
  
  try {
    // For now, use a mock funding rate API or create a simple proxy
    // In production, this would connect to Binance, Bybit, or similar
    const baseUrl = process.env.NEXT_PUBLIC_FUNDING_BASE || 'https://api.binance.com/api/v3/premiumIndex';
    const url = `${baseUrl}?symbols=["BTCUSDT","ETHUSDT","SOLUSDT"]`;
    
    // Check for existing ETag
    const existingEtag = ctx.etagStore.get('funding');
    const headers: HeadersInit = {
      'User-Agent': 'PrediktFi/1.0',
      'Accept': 'application/json'
    };
    
    if (existingEtag) {
      headers['If-None-Match'] = existingEtag;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ctx.timeoutMs);

    const response = await ctx.fetchImpl(url, {
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const elapsedMs = Date.now() - startTime;

    // Handle 304 Not Modified
    if (response.status === 304) {
      ctx.telemetry.end('funding', { ok: true, timedOut: false, elapsedMs });
      return {
        items: [],
        ok: true,
        timedOut: false,
        etag: existingEtag
      };
    }

    if (!response.ok) {
      ctx.telemetry.end('funding', { ok: false, timedOut: false, elapsedMs });
      return {
        items: [],
        ok: false,
        timedOut: false
      };
    }

    const data = await response.json();
    
    // Extract ETag from response
    const etag = response.headers.get('ETag');
    if (etag) {
      ctx.etagStore.set('funding', etag);
    }

    // Normalize to our format
    const items = (Array.isArray(data) ? data : [data]).slice(0, 3).map((item: any) => {
      const symbol = item.symbol?.replace('USDT', '') || 'BTC';
      const fundingRate = parseFloat(item.lastFundingRate) || 0;
      
      // Convert funding rate to probability and direction
      const absRate = Math.abs(fundingRate);
      const direction = fundingRate > 0.0001 ? 'up' : fundingRate < -0.0001 ? 'down' : 'neutral';
      const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
      
      return {
        type: 'funding' as const,
        label: `${symbol} funding ${arrow}`,
        direction: direction as 'up' | 'down' | 'neutral',
        ts: ctx.now.toISOString()
      };
    });

    ctx.telemetry.end('funding', { ok: true, timedOut: false, elapsedMs });
    
    return {
      items,
      ok: true,
      timedOut: false,
      etag
    };

  } catch (error) {
    const elapsedMs = Date.now() - startTime;
    const timedOut = error instanceof Error && error.name === 'AbortError';
    
    ctx.telemetry.end('funding', { ok: false, timedOut, elapsedMs });
    
    return {
      items: [],
      ok: false,
      timedOut
    };
  }
}
