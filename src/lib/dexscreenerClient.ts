/**
 * DexScreener API Client
 * 
 * Provides real-time trading data for tokens, especially memecoins.
 * API is free and requires no authentication.
 * Rate limit: 300 requests/minute
 * 
 * Docs: https://docs.dexscreener.com/api/reference
 */

const DEXSCREENER_BASE = "https://api.dexscreener.com/latest/dex";

export interface DexScreenerPair {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    quoteToken: {
        address: string;
        name: string;
        symbol: string;
    };
    priceUsd: string;
    volume: {
        h24: number;
        h6: number;
        h1: number;
        m5: number;
    };
    priceChange: {
        h24: number;
        h6: number;
        h1: number;
        m5: number;
    };
    liquidity: {
        usd: number;
        base: number;
        quote: number;
    };
    fdv: number; // Fully diluted valuation
    marketCap: number;
    pairCreatedAt: number; // Unix timestamp
    info?: {
        imageUrl?: string;
        websites?: { url: string }[];
        socials?: { type: string; url: string }[];
    };
}

export interface DexScreenerSearchResult {
    pairs: DexScreenerPair[];
}

export interface MemecoinNarrativeSnapshot {
    narrative: string;
    totalPairs: number;
    solanaPairs: number;
    topTokens: {
        name: string;
        symbol: string;
        marketCap: number;
        volume24h: number;
        liquidity: number;
        ageHours: number;
        priceChange24h: number;
    }[];
    avgMarketCap: number;
    avgLiquidity: number;
    avgAgeHours: number;
    crowdednessSignal: "empty" | "low" | "moderate" | "high" | "saturated";
    timestamp: string;
}

/**
 * Search for trading pairs by narrative/keyword on Solana.
 * Useful for finding competing memecoins in the same narrative.
 */
export async function searchMemecoinNarrative(
    narrative: string
): Promise<DexScreenerPair[]> {
    try {
        const response = await fetch(
            `${DEXSCREENER_BASE}/search?q=${encodeURIComponent(narrative)}`,
            {
                headers: { "Accept": "application/json" },
                next: { revalidate: 60 } // Cache for 1 minute in Next.js
            }
        );

        if (!response.ok) {
            console.warn(`[DexScreener] Search failed: ${response.status}`);
            return [];
        }

        const data: DexScreenerSearchResult = await response.json();

        // Filter to Solana pairs only
        return data.pairs?.filter(p => p.chainId === "solana") || [];
    } catch (error) {
        console.error("[DexScreener] Search error:", error);
        return [];
    }
}

/**
 * Get all pairs for a specific token address on Solana.
 */
export async function getTokenPairs(
    tokenAddress: string
): Promise<DexScreenerPair[]> {
    try {
        const response = await fetch(
            `${DEXSCREENER_BASE}/tokens/solana/${tokenAddress}`,
            {
                headers: { "Accept": "application/json" },
                next: { revalidate: 60 }
            }
        );

        if (!response.ok) {
            console.warn(`[DexScreener] Token lookup failed: ${response.status}`);
            return [];
        }

        const data: DexScreenerSearchResult = await response.json();
        return data.pairs || [];
    } catch (error) {
        console.error("[DexScreener] Token lookup error:", error);
        return [];
    }
}

/**
 * Analyze a memecoin narrative and return a structured snapshot.
 * This provides context for competitive intelligence.
 */
export async function analyzeMemecoinNarrative(
    narrative: string
): Promise<MemecoinNarrativeSnapshot | null> {
    const pairs = await searchMemecoinNarrative(narrative);

    if (pairs.length === 0) {
        return null;
    }

    const now = Date.now();

    // Calculate metrics
    const tokensWithData = pairs.filter(p => p.marketCap > 0);
    const avgMarketCap = tokensWithData.length > 0
        ? tokensWithData.reduce((sum, p) => sum + p.marketCap, 0) / tokensWithData.length
        : 0;

    const avgLiquidity = tokensWithData.length > 0
        ? tokensWithData.reduce((sum, p) => sum + (p.liquidity?.usd || 0), 0) / tokensWithData.length
        : 0;

    const avgAgeHours = pairs.reduce((sum, p) => {
        const ageMs = now - (p.pairCreatedAt || now);
        return sum + (ageMs / (1000 * 60 * 60));
    }, 0) / pairs.length;

    // Determine crowdedness
    let crowdednessSignal: MemecoinNarrativeSnapshot["crowdednessSignal"];
    if (pairs.length <= 2) crowdednessSignal = "empty";
    else if (pairs.length <= 10) crowdednessSignal = "low";
    else if (pairs.length <= 30) crowdednessSignal = "moderate";
    else if (pairs.length <= 75) crowdednessSignal = "high";
    else crowdednessSignal = "saturated";

    // Get top tokens by market cap
    const sortedByMcap = [...tokensWithData].sort((a, b) => b.marketCap - a.marketCap);
    const topTokens = sortedByMcap.slice(0, 5).map(p => ({
        name: p.baseToken.name,
        symbol: p.baseToken.symbol,
        marketCap: p.marketCap,
        volume24h: p.volume?.h24 || 0,
        liquidity: p.liquidity?.usd || 0,
        ageHours: (now - (p.pairCreatedAt || now)) / (1000 * 60 * 60),
        priceChange24h: p.priceChange?.h24 || 0,
    }));

    return {
        narrative,
        totalPairs: pairs.length,
        solanaPairs: pairs.length, // Already filtered
        topTokens,
        avgMarketCap,
        avgLiquidity,
        avgAgeHours,
        crowdednessSignal,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Format market cap for display (e.g., "$1.2M")
 */
export function formatMarketCap(value: number): string {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
}

/**
 * Generate a human-readable summary for the competitive memo.
 */
export function generateMemecoinCompetitiveSummary(
    snapshot: MemecoinNarrativeSnapshot
): string {
    const topToken = snapshot.topTokens[0];
    const topLine = topToken
        ? `Top performer: $${topToken.symbol} at ${formatMarketCap(topToken.marketCap)} mcap`
        : "No clear leader yet";

    const lines = [
        `MEMECOIN LANDSCAPE (DexScreener Live Data):`,
        `- "${snapshot.narrative}" narrative on Solana: ${snapshot.solanaPairs} active pairs`,
        `- Crowdedness: ${snapshot.crowdednessSignal.toUpperCase()}`,
        `- Avg market cap: ${formatMarketCap(snapshot.avgMarketCap)}, Avg liquidity: ${formatMarketCap(snapshot.avgLiquidity)}`,
        ``,
        `TOP COMPETITORS (Reference these in your analysis):`,
        ...snapshot.topTokens.slice(0, 5).map((t, i) =>
            `${i + 1}. ${t.name} ($${t.symbol}) - MCap: ${formatMarketCap(t.marketCap)} | Vol24h: ${formatMarketCap(t.volume24h)} | Age: ${t.ageHours.toFixed(1)}h`
        )
    ];

    return lines.join("\n");
}
