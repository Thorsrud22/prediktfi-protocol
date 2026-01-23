import { NextResponse } from 'next/server';
import { CoinbaseMarketService } from '@/lib/market/coinbase';
import { redis } from '@/lib/redis';

const CACHE_KEY = 'market:coinbase:trending:v1';
const TTL = 60; // 60 seconds

// Simple in-memory lock for this instance to prevent Thundering Herd
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
            const service = new CoinbaseMarketService();
            inflightPromise = service.getTrendingFeed()
                .then(async (data) => {
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
        console.error('Error fetching trending feed:', error);

        // In a real scenario, we might try to fetch stale data from Redis here if the cache was just expired but fresh fetch failed.

        return NextResponse.json(
            { error: 'Service Unavailable', details: (error as Error).message },
            { status: 503 }
        );
    }
}
