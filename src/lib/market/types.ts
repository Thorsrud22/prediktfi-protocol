export interface MarketSnapshot {
    timestamp: string;
    btcDominance: number;
    solPriceUsd: number;
    totalAltVolume24hUsd?: number;
    source?: 'coingecko' | 'fallback';
}

export interface GroundingEnvelope<T> {
    data: T;
    fetchedAt: string;
    stalenessHours: number;
    source: string;
    ttlHours: number;
    isStale: boolean;
}

export function wrapGrounding<T>(
    data: T,
    source: string,
    fetchedAt: Date,
    ttlHours: number
): GroundingEnvelope<T> {
    const now = Date.now();
    const stalenessHours = (now - fetchedAt.getTime()) / 3_600_000;
    return {
        data,
        fetchedAt: fetchedAt.toISOString(),
        stalenessHours: Math.round(stalenessHours * 100) / 100,
        source,
        ttlHours,
        isStale: stalenessHours > ttlHours,
    };
}
