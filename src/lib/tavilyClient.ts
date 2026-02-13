/**
 * Tavily Search Client
 *
 * Lightweight client for Tavily's search API.
 * Used to fetch real competitor information for the Idea Evaluator.
 *
 * Docs: https://docs.tavily.com/documentation/api-reference/endpoint/search
 */

export interface TavilySearchResult {
    title: string;
    url: string;
    content: string; // snippet
    score: number;
}

export interface TavilySearchResponse {
    query: string;
    results: TavilySearchResult[];
    answer?: string; // AI-generated summary (optional feature)
}

/**
 * Search the web using Tavily API.
 *
 * @param query - Search query string
 * @param options - Optional search configuration
 * @returns Search results or empty array if API key missing / error
 */
export async function searchWeb(
    query: string,
    options?: {
        maxResults?: number;
        searchDepth?: "basic" | "advanced";
        includeDomains?: string[];
        excludeDomains?: string[];
    }
): Promise<TavilySearchResult[]> {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
        console.warn("[Tavily] No API key configured (TAVILY_API_KEY). Skipping web search.");
        return [];
    }

    const maxResults = options?.maxResults ?? 5;
    const searchDepth = options?.searchDepth ?? "basic";

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                api_key: apiKey,
                query,
                max_results: maxResults,
                search_depth: searchDepth,
                include_domains: options?.includeDomains,
                exclude_domains: options?.excludeDomains,
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Tavily] API error (${response.status}):`, errorText);
            return [];
        }

        const data = (await response.json()) as TavilySearchResponse;
        return data.results || [];
    } catch (error) {
        console.error("[Tavily] Search failed:", error);
        return [];
    }
}

/**
 * Generate search queries for competitor research based on an idea.
 *
 * @param description - The idea description
 * @param category - The project category (memecoin, defi, ai)
 * @returns Array of 2-3 search queries
 */
export function generateCompetitorQueries(
    description: string,
    category: string
): string[] {
    // Extract key terms from description (first 100 chars for brevity)
    const shortDesc = description.slice(0, 100).toLowerCase();

    const queries: string[] = [];

    switch (category) {
        case "memecoin":
            queries.push(`top ${category} projects Solana 2025`);
            if (shortDesc.includes("dog") || shortDesc.includes("cat") || shortDesc.includes("animal")) {
                queries.push(`animal themed memecoins Solana`);
            } else if (shortDesc.includes("ai") || shortDesc.includes("agent")) {
                queries.push(`AI agent memecoins crypto`);
            } else {
                queries.push(`trending memecoins Solana this week`);
            }
            break;

        case "defi":
            queries.push(`Solana DeFi protocols competitors 2025`);
            if (shortDesc.includes("lend") || shortDesc.includes("borrow")) {
                queries.push(`Solana lending protocols Kamino Marginfi`);
            } else if (shortDesc.includes("dex") || shortDesc.includes("swap")) {
                queries.push(`Solana DEX aggregators Jupiter Raydium`);
            } else if (shortDesc.includes("yield") || shortDesc.includes("vault")) {
                queries.push(`Solana yield vaults protocols`);
            } else {
                queries.push(`top DeFi projects Solana TVL`);
            }
            break;

        case "ai":
            queries.push(`AI crypto projects 2025 competitors`);
            if (shortDesc.includes("agent")) {
                queries.push(`AI agent frameworks crypto web3`);
            } else if (shortDesc.includes("data") || shortDesc.includes("oracle")) {
                queries.push(`AI data oracles blockchain`);
            } else {
                queries.push(`top AI tokens crypto market`);
            }
            break;

        default:
            queries.push(`${category} crypto projects 2025`);
    }

    return queries;
}

/**
 * Search for competitors of a given idea.
 * Runs multiple queries and consolidates results.
 *
 * @param description - The idea description
 * @param category - The project category
 * @returns Consolidated search results (deduplicated by URL)
 */
export async function searchCompetitors(
    description: string,
    category: string
): Promise<TavilySearchResult[]> {
    const queries = generateCompetitorQueries(description, category);

    const allResults: TavilySearchResult[] = [];
    const seenUrls = new Set<string>();

    for (const query of queries) {
        const results = await searchWeb(query, { maxResults: 3 });

        for (const result of results) {
            if (!seenUrls.has(result.url)) {
                seenUrls.add(result.url);
                allResults.push(result);
            }
        }
    }

    // Cap at 8 results total to avoid prompt bloat
    return allResults.slice(0, 8);
}
