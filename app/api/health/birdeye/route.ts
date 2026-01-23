import { NextResponse } from 'next/server';

/**
 * GET /api/health/birdeye
 * 
 * Server-only health check for Birdeye API connectivity.
 * Tests the API key by calling the trending tokens endpoint.
 * Never exposes or logs the API key.
 */
export async function GET() {
    const timestamp = new Date().toISOString();
    const apiKey = (process.env.BIRDEYE_API_KEY || '').trim();

    if (!apiKey) {
        return NextResponse.json({
            ok: false,
            status: 0,
            message: 'BIRDEYE_API_KEY is not configured',
            timestamp
        }, { status: 500 });
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(
            'https://public-api.birdeye.so/defi/token_trending?sort_by=rank&sort_type=asc&offset=0&limit=1',
            {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'X-API-KEY': apiKey,
                    'x-chain': 'solana'
                },
                signal: controller.signal
            }
        );

        clearTimeout(timeoutId);

        const body = await res.json().catch(() => ({}));

        if (res.ok && body.success) {
            return NextResponse.json({
                ok: true,
                status: res.status,
                message: 'Birdeye API is reachable and key is valid',
                timestamp
            });
        }

        return NextResponse.json({
            ok: false,
            status: res.status,
            message: body.message || `Birdeye returned ${res.status} ${res.statusText}`,
            timestamp
        }, { status: res.status >= 500 ? 502 : 200 });

    } catch (error: any) {
        const isTimeout = error.name === 'AbortError';
        return NextResponse.json({
            ok: false,
            status: 0,
            message: isTimeout ? 'Request timed out' : 'Network error',
            timestamp
        }, { status: 503 });
    }
}
