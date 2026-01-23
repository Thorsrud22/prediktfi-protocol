import { NextResponse } from 'next/server';
import { BirdeyeMarketService } from '@/lib/market/birdeye';
import { redis } from '@/lib/redis';

const CACHE_KEY = 'market:birdeye:trending:v1';
const TTL = 60; // 60 seconds

let inflightPromise: Promise<any> | null = null;

export async function GET() {
    try {
        // 1. Check Redis Cache
        if (redis) {
            try {
                const cached = await redis.get(CACHE_KEY);
                if (cached) {
                    return NextResponse.json(cached);
                }
            } catch (e) {
                console.warn('Redis error during fetch:', e);
            }
        }

        // 2. Fetch Fresh Data (Coalesced)
        if (!inflightPromise) {
            const service = new BirdeyeMarketService();
            inflightPromise = service.getTrendingTokens()
                .then(async (tokens) => {
                    const data = {
                        updatedAt: new Date().toISOString(),
                        source: 'birdeye',
                        items: tokens
                    };

                    if (redis) {
                        try {
                            await redis.set(CACHE_KEY, data, { ex: TTL });
                        } catch (e) {
                            console.warn('Redis error during set:', e);
                        }
                    }
                    return data;
                })
                .catch(err => {
                    throw err;
                })
                .finally(() => {
                    inflightPromise = null;
                });
        }

        const data = await inflightPromise;
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error fetching Birdeye trending feed:', error);

        return NextResponse.json(
            { error: 'Service Unavailable', details: (error as Error).message },
            { status: 503 }
        );
    }
}
