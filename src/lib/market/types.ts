export interface MarketSnapshot {
    timestamp: string;
    btcDominance: number;
    solPriceUsd: number;
    totalAltVolume24hUsd?: number;
    source?: 'coingecko' | 'fallback';
}
