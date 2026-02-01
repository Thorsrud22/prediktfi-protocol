/**
 * Coingecko Client
 * 
 * Fetches market data using the Coingecko API.
 * Uses public API (no key) by default, with support for Pro keys via env var.
 * 
 * Docs: https://docs.coingecko.com/reference/introduction
 */

const COINGECKO_BASE = process.env.COINGECKO_API_KEY
    ? "https://pro-api.coingecko.com/api/v3"
    : "https://api.coingecko.com/api/v3";

interface CoingeckoCoinMarket {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    fully_diluted_valuation: number | null;
    total_volume: number;
    price_change_percentage_24h: number;
}

/**
 * Get top coins by category (e.g. 'meme-token', 'solana-ecosystem')
 * Ordered by market cap desc.
 */
export async function getTopCoinsByCategory(
    category: string,
    limit: number = 10
): Promise<CoingeckoCoinMarket[]> {
    try {
        const headers: Record<string, string> = {
            "Accept": "application/json"
        };

        if (process.env.COINGECKO_API_KEY) {
            headers["x-cg-pro-api-key"] = process.env.COINGECKO_API_KEY;
        }

        const url = new URL(`${COINGECKO_BASE}/coins/markets`);
        url.searchParams.append("vs_currency", "usd");
        url.searchParams.append("category", category);
        url.searchParams.append("order", "market_cap_desc");
        url.searchParams.append("per_page", limit.toString());
        url.searchParams.append("page", "1");
        url.searchParams.append("sparkline", "false");

        const response = await fetch(url.toString(), {
            headers,
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) {
            console.warn(`[Coingecko] Fetch failed for category ${category}: ${response.status}`);
            return [];
        }

        const data: CoingeckoCoinMarket[] = await response.json();
        return data;

    } catch (error) {
        console.error(`[Coingecko] Error fetching category ${category}:`, error);
        return [];
    }
}

/**
 * Get simple price and stats for specific coin IDs
 */
export async function getCoinsMarkets(ids: string[]): Promise<CoingeckoCoinMarket[]> {
    if (ids.length === 0) return [];

    try {
        const headers: Record<string, string> = {
            "Accept": "application/json"
        };

        if (process.env.COINGECKO_API_KEY) {
            headers["x-cg-pro-api-key"] = process.env.COINGECKO_API_KEY;
        }

        const url = new URL(`${COINGECKO_BASE}/coins/markets`);
        url.searchParams.append("vs_currency", "usd");
        url.searchParams.append("ids", ids.join(","));
        url.searchParams.append("order", "market_cap_desc");
        url.searchParams.append("per_page", ids.length.toString());
        url.searchParams.append("page", "1");
        url.searchParams.append("sparkline", "false");

        const response = await fetch(url.toString(), {
            headers,
            next: { revalidate: 60 } // Cache for 1 minute
        });

        if (!response.ok) {
            console.warn(`[Coingecko] Fetch failed for ids ${ids.join(',')}: ${response.status}`);
            return [];
        }

        return await response.json();
    } catch (error) {
        console.error(`[Coingecko] Error fetching ids:`, error);
        return [];
    }
}
