import { MarketSnapshot } from './types';

export async function getMarketSnapshot(): Promise<MarketSnapshot> {
    try {
        // Fetch SOL price
        const priceRes = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
            { next: { revalidate: 60 } } // Cache for 60s
        );

        // Fetch Global Data (for BTC dominance)
        const globalRes = await fetch(
            'https://api.coingecko.com/api/v3/global',
            { next: { revalidate: 300 } } // Cache for 5m
        );

        if (!priceRes.ok || !globalRes.ok) {
            throw new Error('Failed to fetch market data');
        }

        const priceData = await priceRes.json();
        const globalData = await globalRes.json();

        return {
            timestamp: new Date().toISOString(),
            solPriceUsd: priceData.solana.usd,
            btcDominance: globalData.data.market_cap_percentage.btc,
            totalAltVolume24hUsd: globalData.data.total_volume.usd, // Approximation, actually total volume
            source: 'coingecko'
        };
    } catch (error) {
        console.warn('Failed to fetch market snapshot, using fallback:', error);
        return {
            timestamp: new Date().toISOString(),
            solPriceUsd: 0,
            btcDominance: 0,
            source: 'fallback'
        };
    }
}
