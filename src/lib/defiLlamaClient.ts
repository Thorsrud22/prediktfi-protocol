/**
 * DeFiLlama Client
 * 
 * Fetches real-time TVL data from DeFiLlama's public API.
 * No API key required - completely free and public.
 * 
 * API Docs: https://defillama.com/docs/api
 */

const DEFILLAMA_BASE_URL = "https://api.llama.fi";

export interface ProtocolTVL {
    name: string;
    slug: string;
    tvl: number;
    chain: string;
    category: string;
    change_1d: number | null;
    change_7d: number | null;
    mcap?: number;
    fdv?: number;
}

export interface ChainTVL {
    name: string;
    tvl: number;
    tokenSymbol?: string;
}

interface DefiLlamaProtocol {
    name: string;
    slug: string;
    tvl: number;
    chain: string;
    category: string;
    change_1d: number | null;
    change_7d: number | null;
    mcap?: number;
    fdv?: number;
    chains?: string[];
}

/**
 * Get all protocols with their TVL data
 */
export async function getAllProtocols(): Promise<ProtocolTVL[]> {
    try {
        const response = await fetch(`${DEFILLAMA_BASE_URL}/protocols`);

        if (!response.ok) {
            console.error(`[DeFiLlama] API error: ${response.status}`);
            return [];
        }

        const protocols = await response.json() as DefiLlamaProtocol[];

        return protocols.map(p => ({
            name: p.name,
            slug: p.slug,
            tvl: p.tvl || 0,
            chain: p.chain || (p.chains?.[0] ?? "Multi-chain"),
            category: p.category || "Unknown",
            change_1d: p.change_1d,
            change_7d: p.change_7d,
            mcap: p.mcap,
            fdv: p.fdv,
        }));
    } catch (error) {
        console.error("[DeFiLlama] Failed to fetch protocols:", error);
        return [];
    }
}

/**
 * Get TVL for a specific chain (e.g., "Solana", "Ethereum")
 */
export async function getChainTVL(chain: string): Promise<ChainTVL | null> {
    try {
        const response = await fetch(`${DEFILLAMA_BASE_URL}/v2/chains`);

        if (!response.ok) {
            console.error(`[DeFiLlama] Chain API error: ${response.status}`);
            return null;
        }

        const chains = await response.json() as ChainTVL[];
        const target = chains.find(c => c.name.toLowerCase() === chain.toLowerCase());

        return target || null;
    } catch (error) {
        console.error("[DeFiLlama] Failed to fetch chain TVL:", error);
        return null;
    }
}

/**
 * Search for protocols by category (e.g., "Lending", "Dexes", "Yield")
 */
export async function getProtocolsByCategory(
    category: string,
    options?: { chain?: string; limit?: number }
): Promise<ProtocolTVL[]> {
    const protocols = await getAllProtocols();

    let filtered = protocols.filter(p =>
        p.category.toLowerCase().includes(category.toLowerCase())
    );

    // Filter by chain if specified
    if (options?.chain) {
        filtered = filtered.filter(p =>
            p.chain.toLowerCase() === options.chain?.toLowerCase()
        );
    }

    // Sort by TVL descending
    filtered.sort((a, b) => b.tvl - a.tvl);

    // Limit results
    return filtered.slice(0, options?.limit || 10);
}

/**
 * Get top protocols on Solana by TVL
 */
export async function getSolanaTopProtocols(limit: number = 10): Promise<ProtocolTVL[]> {
    const protocols = await getAllProtocols();

    const solanaProtocols = protocols.filter(p =>
        p.chain.toLowerCase() === "solana" ||
        (p.chain === "Multi-chain" && p.name.toLowerCase().includes("solana"))
    );

    solanaProtocols.sort((a, b) => b.tvl - a.tvl);

    return solanaProtocols.slice(0, limit);
}

/**
 * Get competitors for a DeFi mechanism type on Solana
 */
export async function getDeFiCompetitors(
    mechanism: string,
    chain: string = "Solana"
): Promise<ProtocolTVL[]> {
    // Map mechanism types to DeFiLlama categories
    const categoryMap: Record<string, string[]> = {
        lending: ["Lending", "CDP"],
        staking: ["Liquid Staking", "Staking"],
        amm: ["Dexes", "DEX Aggregator"],
        dex: ["Dexes", "DEX Aggregator"],
        derivatives: ["Derivatives", "Options", "Perpetuals"],
        yield: ["Yield", "Yield Aggregator", "Farm"],
        aggregator: ["DEX Aggregator", "Yield Aggregator"],
    };

    const categories = categoryMap[mechanism.toLowerCase()] || [mechanism];
    const protocols = await getAllProtocols();

    // Filter by categories and chain
    const competitors = protocols.filter(p => {
        const matchesCategory = categories.some(cat =>
            p.category.toLowerCase().includes(cat.toLowerCase())
        );
        const matchesChain = chain.toLowerCase() === "all" ||
            p.chain.toLowerCase() === chain.toLowerCase();

        return matchesCategory && matchesChain;
    });

    // Sort by TVL
    competitors.sort((a, b) => b.tvl - a.tvl);

    return competitors.slice(0, 10);
}

/**
 * Format TVL for display (e.g., "$1.2B", "$450M", "$12K")
 */
export function formatTVL(tvl: number): string {
    if (tvl >= 1_000_000_000) {
        return `$${(tvl / 1_000_000_000).toFixed(2)}B`;
    }
    if (tvl >= 1_000_000) {
        return `$${(tvl / 1_000_000).toFixed(1)}M`;
    }
    if (tvl >= 1_000) {
        return `$${(tvl / 1_000).toFixed(0)}K`;
    }
    return `$${tvl.toFixed(0)}`;
}

/**
 * Generate a competitive summary for DeFi ideas
 */
export async function generateDeFiCompetitiveSummary(
    mechanism: string,
    targetTVL?: string
): Promise<string> {
    const competitors = await getDeFiCompetitors(mechanism, "Solana");
    const chainData = await getChainTVL("Solana");

    if (competitors.length === 0) {
        return "No DeFiLlama data available for this category on Solana.";
    }

    const top5 = competitors.slice(0, 5);
    const totalCategoryTVL = competitors.reduce((sum, p) => sum + p.tvl, 0);

    let summary = `## Solana ${mechanism.toUpperCase()} Market (DeFiLlama Data)\n\n`;
    summary += `**Total Category TVL:** ${formatTVL(totalCategoryTVL)}\n`;

    if (chainData) {
        summary += `**Solana Total TVL:** ${formatTVL(chainData.tvl)}\n`;
    }

    summary += `\n### Top Competitors:\n`;

    top5.forEach((p, i) => {
        const changeStr = p.change_7d !== null
            ? ` (${p.change_7d > 0 ? '+' : ''}${p.change_7d.toFixed(1)}% 7d)`
            : '';
        summary += `${i + 1}. **${p.name}** - ${formatTVL(p.tvl)}${changeStr}\n`;
    });

    // Add context for target TVL if provided
    if (targetTVL) {
        const targetNum = parseFloat(targetTVL.replace(/[^0-9.]/g, ''));
        const multiplier = targetTVL.toLowerCase().includes('b') ? 1_000_000_000
            : targetTVL.toLowerCase().includes('m') ? 1_000_000
                : targetTVL.toLowerCase().includes('k') ? 1_000
                    : 1;
        const targetValue = targetNum * multiplier;

        if (competitors[0] && targetValue > 0) {
            const marketShare = (targetValue / totalCategoryTVL * 100).toFixed(2);
            const vsLeader = (targetValue / competitors[0].tvl * 100).toFixed(1);

            summary += `\n### Your Target Analysis:\n`;
            summary += `- Target: ${formatTVL(targetValue)} = ${marketShare}% of category TVL\n`;
            summary += `- = ${vsLeader}% of market leader (${competitors[0].name})\n`;
        }
    }

    return summary;
}
