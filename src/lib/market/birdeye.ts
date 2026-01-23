/**
 * Birdeye Market Service
 * 
 * Provides access to Birdeye API for token data.
 * Uses direct fetch (not SDK) for reliability.
 * Includes in-memory caching to prevent rate limiting.
 */

const BIRDEYE_BASE_URL = 'https://public-api.birdeye.so';
const CACHE_TTL_MS = 120_000; // 2 minutes

// In-memory cache for trending tokens
interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

const trendingCache = new Map<string, CacheEntry<BirdeyeToken[]>>();

export interface BirdeyeToken {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    liquidity: number;
    volume24hUSD: number;
    rank?: number;
    logoURI?: string;
    price?: number;
}

export interface BirdeyeSearchItem {
    name: string;
    symbol: string;
    address: string;
    network: string;
    decimals: number;
    logo_uri: string;
    verified: boolean;
}

export interface BirdeyeSecurityData {
    ownerAddress: string | null;
    creatorAddress: string;
    ownerPercentage: number;
    creatorPercentage: number;
    top10HolderPercentage: number;
    isLiquidityLocked: boolean;
    totalLiquidity: number;
}

/**
 * Gets the API key from environment, trimmed and validated.
 */
function getApiKey(): string | null {
    const key = (process.env.BIRDEYE_API_KEY || '').trim();
    return key.length > 0 ? key : null;
}

/**
 * Makes a fetch request to Birdeye API with proper headers.
 */
async function birdeyeFetch(endpoint: string, chain: string = 'solana'): Promise<any> {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.warn('[Birdeye] No API key configured');
        return null;
    }

    const res = await fetch(`${BIRDEYE_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
            'accept': 'application/json',
            'X-API-KEY': apiKey,
            'x-chain': chain
        }
    });

    if (!res.ok) {
        console.warn(`[Birdeye] API returned ${res.status}: ${res.statusText}`);
        return null;
    }

    const body = await res.json();
    if (!body.success) {
        console.warn('[Birdeye] API returned success=false');
        return null;
    }

    return body.data;
}

export class BirdeyeMarketService {
    /**
     * Fetches trending tokens with caching.
     */
    async getTrendingTokens(chain: string = 'solana', limit: number = 20): Promise<BirdeyeToken[]> {
        const cacheKey = `trending:${chain}:${limit}`;
        const now = Date.now();

        // Check cache
        const cached = trendingCache.get(cacheKey);
        if (cached && cached.expiresAt > now) {
            return cached.data;
        }

        try {
            const data = await birdeyeFetch(
                `/defi/token_trending?sort_by=rank&sort_type=asc&offset=0&limit=${limit}`,
                chain
            );

            if (!data?.tokens) {
                // Return stale cache if available, otherwise empty
                return cached?.data || [];
            }

            const tokens: BirdeyeToken[] = data.tokens.map((t: any) => ({
                address: t.address,
                name: t.name,
                symbol: t.symbol,
                decimals: t.decimals,
                liquidity: t.liquidity,
                volume24hUSD: t.volume24hUSD,
                rank: t.rank,
                logoURI: t.logoURI,
                price: t.price
            }));

            // Update cache
            trendingCache.set(cacheKey, {
                data: tokens,
                expiresAt: now + CACHE_TTL_MS
            });

            return tokens;
        } catch (error) {
            console.error('[Birdeye] Error fetching trending tokens:', error);
            return cached?.data || [];
        }
    }

    /**
     * Searches for tokens by keyword (name or symbol).
     */
    async searchTokens(keyword: string, chain: string = 'solana'): Promise<BirdeyeSearchItem[]> {
        try {
            const data = await birdeyeFetch(
                `/defi/v3/search?keyword=${encodeURIComponent(keyword)}&search_by=combination&target=token&chain=${chain}`,
                chain
            );

            if (!data?.items) return [];

            const tokenItems = data.items.find((i: any) => i.type === 'token');
            if (!tokenItems) return [];

            return tokenItems.result.map((t: any) => ({
                name: t.name,
                symbol: t.symbol,
                address: t.address,
                network: t.network,
                decimals: t.decimals,
                logo_uri: t.logo_uri,
                verified: t.verified
            }));
        } catch (error) {
            console.error('[Birdeye] Error searching tokens:', error);
            return [];
        }
    }

    /**
     * Fetches security information for a token.
     * 
     * NOTE: This endpoint may require a paid plan.
     * Feature-flagged to return null gracefully on free tier.
     */
    async getTokenSecurity(address: string, chain: string = 'solana'): Promise<BirdeyeSecurityData | null> {
        // Feature flag: disable on free tier to avoid 401/403 errors
        const enableSecurityEndpoint = process.env.BIRDEYE_ENABLE_SECURITY === 'true';
        if (!enableSecurityEndpoint) {
            return null;
        }

        try {
            const data = await birdeyeFetch(
                `/defi/token_security?address=${address}`,
                chain
            );

            if (!data) return null;

            return {
                ownerAddress: data.owner || null,
                creatorAddress: data.creator || '',
                ownerPercentage: data.ownerPercentage || 0,
                creatorPercentage: data.creatorPercentage || 0,
                top10HolderPercentage: data.top10HolderPercentage || 0,
                isLiquidityLocked: data.liquidity?.some((l: any) => l.isLocked) || false,
                totalLiquidity: data.totalLiquidity || 0
            };
        } catch (error) {
            console.error('[Birdeye] Error fetching token security:', error);
            return null;
        }
    }
}
