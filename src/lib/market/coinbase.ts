import { z } from 'zod';

// Types
export interface CoinbaseTrendingItem {
    id: string; // product id e.g. BONK-USD
    baseSymbol: string;
    quoteSymbol: string;
    price: number;
    priceChange24hPct: number;
    volume24h: number; // Quote volume
    marketCap?: number;
    intensity?: number;
    score: number;
    explanation: string;
}

export interface CoinbaseTrendingResponse {
    updatedAt: string;
    source: 'coinbase';
    items: CoinbaseTrendingItem[];
}

// Configuration
const COINBASE_API_URL = 'https://api.exchange.coinbase.com';
const MAJORS = new Set(['BTC', 'ETH', 'SOL', 'WBTC', 'WETH', 'CBETH', 'LTC', 'BCH', 'ETC']);
const STABLES = new Set(['USDC', 'USD', 'USDT', 'DAI', 'FDUSD', 'PYUSD', 'USDE', 'GUSD', 'USDM', 'EUR', 'GBP']);
const IGNORED_QUOTES = new Set(['EUR', 'GBP', 'BTC', 'ETH', 'USDT']); // Focus on USD/USDC pairs for valid comparison

// Zod Schemas
const ProductSchema = z.object({
    id: z.string(),
    base_currency: z.string(),
    quote_currency: z.string(),
    status: z.string(),
});

const StatsSchema = z.object({
    volume: z.string(),
    last: z.string(),
    open: z.string(),
});

// Helper: Batch processor
async function batchProcess<T, R>(
    items: T[],
    batchSize: number,
    processor: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(item => processor(item).catch(() => null)));
        for (const res of batchResults) {
            if (res !== null) {
                results.push(res as R);
            }
        }
        // Small delay to be nice to API?
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    return results;
}

export class CoinbaseMarketService {
    async getTrendingFeed(): Promise<CoinbaseTrendingResponse> {
        // 1. Fetch Products
        const productsRes = await fetch(`${COINBASE_API_URL}/products`);
        if (!productsRes.ok) throw new Error(`Failed to fetch products: ${productsRes.status}`);
        const productsRaw = await productsRes.json();

        // Parse and Filter
        const products = z.array(ProductSchema).parse(productsRaw)
            .filter(p => p.status === 'online')
            .filter(p => p.quote_currency === 'USD' || p.quote_currency === 'USDC')
            .filter(p => !IGNORED_QUOTES.has(p.quote_currency) || (p.quote_currency === 'USDT')) // Allow USDT if mapped
            .filter(p => !MAJORS.has(p.base_currency))
            .filter(p => !STABLES.has(p.base_currency));

        // Deduplicate: Prefer USD over USDC pairs for same base if both exist? 
        // Usually USD pair has more volume on Coinbase. 
        // Strategy: Fetch stats for all valid pairs, then merge or pick best?
        // Let's just keep all valid pairs for now and maybe filter duplicates by picking highest volume later.

        // 2. Fetch Stats (Batched)
        // 200 items in chunks of 5 is safe.
        const productStats = await batchProcess(products, 10, async (p) => {
            const statsRes = await fetch(`${COINBASE_API_URL}/products/${p.id}/stats`);
            if (!statsRes.ok) throw new Error(`Stats failed for ${p.id}`);
            const stats = StatsSchema.parse(await statsRes.json());

            const last = parseFloat(stats.last);
            const open = parseFloat(stats.open);
            const volumeBase = parseFloat(stats.volume);

            return {
                product: p,
                price: last,
                priceChange24hPct: ((last - open) / open) * 100,
                volume24h: volumeBase * last // Quote volume estimate
            };
        });

        // 3. Preliminary Sort by Volume to find Candidates
        // We want candidates with high volume but not majors.
        const candidates = productStats
            .sort((a, b) => b.volume24h - a.volume24h)
            .slice(0, 50); // Take top 50 by volume

        // 4. (Optional) Fetch Market Caps
        // For now, we skip external CoinGecko calls to keep v1 dependency-free and fast.
        // We fall back to volume-only scoring as per spec.

        // 5. Score Candidates
        const scored = candidates.map(c => {
            // Z-score components would require population stats, but we can do a simplified relative score.
            // Spec: "v1 Score: If marketCap missing: Score = 0.70 * z(log10(volume24h)) + 0.30 * z(Momentum)"

            // We need to normalize to get "z-scores" or at least 0-1 range.
            // Let's compute population stats for the candidate set.
            return {
                ...c,
                logVol: Math.log10(c.volume24h),
                mom: c.priceChange24hPct,
                marketCap: undefined as number | undefined
            };
        });

        const volMean = mean(scored.map(s => s.logVol));
        const volStd = std(scored.map(s => s.logVol));

        const momMean = mean(scored.map(s => s.mom));
        const momStd = std(scored.map(s => s.mom));

        const finalItems = scored.map(item => {
            const zVol = volStd === 0 ? 0 : (item.logVol - volMean) / volStd;
            const zMom = momStd === 0 ? 0 : (item.mom - momMean) / momStd;

            // Weight: 0.7 Vol, 0.3 Mom
            const score = 0.7 * zVol + 0.3 * zMom;

            // Format explanation
            const explanation = `Vol: $${formatCompact(item.volume24h)}, 24h: ${item.priceChange24hPct.toFixed(1)}%`;

            return {
                id: item.product.id,
                baseSymbol: item.product.base_currency,
                quoteSymbol: item.product.quote_currency,
                price: item.price,
                priceChange24hPct: item.priceChange24hPct,
                volume24h: item.volume24h,
                marketCap: undefined,
                score,
                explanation
            } as CoinbaseTrendingItem;
        });

        // 6. Final Sort and Limit
        finalItems.sort((a, b) => b.score - a.score);

        return {
            updatedAt: new Date().toISOString(),
            source: 'coinbase',
            items: finalItems.slice(0, 25)
        };
    }
}

// Helpers
function mean(nums: number[]) {
    return nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
}

function std(nums: number[]) {
    const m = mean(nums);
    const v = nums.reduce((a, b) => a + Math.pow(b - m, 2), 0) / (nums.length || 1);
    return Math.sqrt(v);
}

function formatCompact(num: number) {
    return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
}
