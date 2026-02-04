import { IdeaSubmission } from "@/lib/ideaSchema";
import { openai } from "@/lib/openaiClient";
import { CompetitiveMemo, CompetitiveMemoResult } from "./competitiveTypes";
import { searchCompetitors } from "@/lib/tavilyClient";
import { generateDeFiCompetitiveSummary, getDeFiCompetitors, formatTVL } from "@/lib/defiLlamaClient";
import { analyzeMemecoinNarrative, generateMemecoinCompetitiveSummary } from "@/lib/dexscreenerClient";
import { getTopCoinsByCategory, getCoinsMarkets } from "@/lib/coingecko";
import { BirdeyeMarketService } from "./birdeye";

const COMPETITIVE_SYSTEM_PROMPT = `You are a Competitive Intelligence Scout for specialized crypto/tech sectors.
Your goal is to produce a "Competitive Memo" that provides a reality check on an idea's landscape.

Supported Categories: "memecoin", "defi", "ai".
Start by strictly categorizing the idea. If it's not one of these 3, return a default error.

You must output valid JSON matching the CompetitiveMemo structure.
Do not output markdown blocks. Just the raw JSON.

JSON Structure Requirements:
{
  "categoryLabel": string, // e.g. "DeFi - Lending", "Memecoin - Animal"
  "crowdednessLevel": "empty" | "moderate" | "high" | "saturated",
  "shortLandscapeSummary": string, // 1-2 sentence high-level summary.
    { 
        "name": string, 
        "chainOrPlatform": string, 
        "note": string,
        "metrics": {
            "marketCap": string, // e.g. "$1.2B" or "N/A"
            "tvl": string, // e.g. "$500M" or "N/A"
            "dailyUsers": string, // e.g. "150k DAU" or "N/A"
            "funding": string, // e.g. "$5M Seed" or "Bootstrapped"
            "revenue": string // e.g. "$1M ARR" or "N/A"
        }
    }
  ],
  "tractionDifficulty": {
    "label": "low" | "medium" | "high" | "extreme",
    "explanation": string // why it's hard/easy to get users
  },
  "differentiationWindow": {
    "label": "wide_open" | "narrow" | "closed",
    "explanation": string // is there space for a new player?
  },
  "noiseVsSignal": "mostly_noise" | "mixed" | "high_signal",
  "evaluatorNotes": string, // Additional strategic notes

  // OPTIONAL SECTIONS - Include ONLY the one matching the category
  "memecoin": {
    "narrativeLabel": string, // e.g. "Dog Coin", "PolitiFi"
    "narrativeCrowdedness": "low" | "medium" | "high"
  },
  "defi": {
    "defiBucket": string, // e.g. "Lending", "Perps", "DEX"
    "categoryKings": [string] // e.g. ["Aave", "Compound"]
  },
  "ai": {
    "aiPattern": string, // e.g. "Agent", "Wrapper", "Infra"
    "moatType": string // e.g. "Data", "UX", "None"
  },

  "timestamp": string // Use current ISO string provided in user prompt or generate one
}

Category Specific Instructions:
- **Memecoin**: Focus on narrative exhaustion. If it's another dog coin, crowdedness is "saturated". Reference Top 3 similar coins.
- **DeFi**: Focus on distinct mechanism or liquidity moat. If it's a generic fork, crowdedness is "high". USE THE DEFILLAMA TVL DATA PROVIDED.
- **AI**: Focus on "Wrapper vs Proprietary". If it's just a GPT wrapper, moat is "None".

Constraint:
- Do not fabricate URLs. 
- Keep notes concise (under 20 words).
- If the idea is nonsense, be honest in "evaluatorNotes".
- For DeFi: Reference ACTUAL TVL numbers from DeFiLlama when comparing to competitors.
- **CRITICAL**: Populate the "metrics" object for each reference project using the Web Search Context.
    - Look for "raised", "funding", "TVL", "revenue", "users", "marketCap".
    - FOR MEMECOINS: You MUST populate "marketCap" and "dailyUsers" (proxy for holders/vol). Set "tvl" to "N/A".
    - FOR DEFI: You MUST populate "tvl".
    - If unknown, set to "N/A".
`;

/**
 * Extract memecoin narrative keywords from description.
 * Looks for common narrative patterns (animals, politics, AI, etc.)
 */
function extractNarrativeFromDescription(description: string): string | null {
    const text = description.toLowerCase();

    // Animal narratives
    if (text.includes('dog') || text.includes('doge') || text.includes('shiba') || text.includes('puppy')) return 'dog';
    if (text.includes('cat') || text.includes('kitty') || text.includes('kitten') || text.includes('popcat')) return 'cat';
    if (text.includes('frog') || text.includes('pepe')) return 'frog pepe';
    if (text.includes('bird') || text.includes('penguin')) return 'bird';

    // Theme narratives
    if (text.includes('trump') || text.includes('maga') || text.includes('politi')) return 'trump politifi';
    if (text.includes('elon') || text.includes('musk') || text.includes('tesla')) return 'elon musk';
    if (text.includes('ai agent') || text.includes('artificial intelligence')) return 'ai agent';
    if (text.includes('anime') || text.includes('waifu')) return 'anime';
    if (text.includes('chad') || text.includes('gigachad') || text.includes('alpha')) return 'chad';

    // Generic fallback - try to extract the main noun
    const words = description.split(/\s+/).filter(w => w.length > 3);
    if (words.length > 0) {
        return words[0]; // Use first significant word as search term
    }

    return null;
}

/**
 * Detect DeFi mechanism type from idea data
 */
function detectDeFiMechanism(idea: IdeaSubmission): string {
    const text = `${idea.description} ${idea.defiMechanism || ''} ${idea.mvpScope || ''}`.toLowerCase();

    if (text.includes('lend') || text.includes('borrow') || text.includes('collateral')) {
        return 'lending';
    }
    if (text.includes('stake') || text.includes('staking') || text.includes('validator')) {
        return 'staking';
    }
    if (text.includes('swap') || text.includes('dex') || text.includes('amm') || text.includes('liquidity pool')) {
        return 'amm';
    }
    if (text.includes('perp') || text.includes('derivative') || text.includes('futures') || text.includes('options')) {
        return 'derivatives';
    }
    if (text.includes('yield') || text.includes('farm') || text.includes('vault')) {
        return 'yield';
    }
    if (text.includes('aggregat')) {
        return 'aggregator';
    }

    // Fall back to defiMechanism field if set
    if (idea.defiMechanism) {
        return idea.defiMechanism;
    }

    return 'lending'; // Default fallback
}

/**
 * Fetches a competitive memo using the LLM.
 * Returns a result object indicating success or failure.
 */
export async function fetchCompetitiveMemo(
    idea: IdeaSubmission,
    normalizedCategory: string
): Promise<CompetitiveMemoResult> {
    // 1. Filter supported categories
    const supported = ['memecoin', 'defi', 'ai'];
    if (!supported.includes(normalizedCategory)) {
        return {
            status: 'not_available',
            reason: `Category '${normalizedCategory}' is not supported for competitive intelligence.`
        };
    }

    // 2. Fetch real competitor data via Tavily (if API key is configured)
    let webSearchContext = "";
    try {
        const searchResults = await searchCompetitors(idea.description, normalizedCategory);
        if (searchResults.length > 0) {
            const formattedResults = searchResults
                .map((r, i) => `${i + 1}. ${r.title}\n   URL: ${r.url}\n   Snippet: ${r.content}`)
                .join("\n\n");
            webSearchContext = `
REAL-TIME WEB SEARCH RESULTS (from Tavily):
Use these actual competitor references to ground your analysis.
Do NOT make up competitors - prioritize what's listed here.

${formattedResults}
`;
            console.log(`[Competitive] Found ${searchResults.length} real competitors via Tavily`);
        }
    } catch (err) {
        console.warn("[Competitive] Tavily search failed (non-blocking):", err);
    }

    // 3. Fetch DeFiLlama data for DeFi projects
    let defiLlamaContext = "";
    if (normalizedCategory === 'defi') {
        try {
            // Detect mechanism type from idea
            const mechanism = detectDeFiMechanism(idea);

            // Fetch SOLANA competitors (for local context)
            const solanaCompetitors = await getDeFiCompetitors(mechanism, "Solana");

            // Fetch GLOBAL competitors (for broader context like GMX, Aave)
            const globalCompetitors = await getDeFiCompetitors(mechanism, "Global");

            if (solanaCompetitors.length > 0 || globalCompetitors.length > 0) {
                // Combine lists for context, prioritizing Solana but including global giants
                const allCompetitors = [...solanaCompetitors, ...globalCompetitors]
                    // Dedup by name
                    .filter((v, i, a) => a.findIndex(t => t.name === v.name) === i)
                    .sort((a, b) => b.tvl - a.tvl)
                    .slice(0, 10);

                const totalTVL = allCompetitors.reduce((sum, p) => sum + p.tvl, 0);

                defiLlamaContext = `
REAL-TIME DEFILLAMA TVL DATA (Global & Solana ${mechanism.toUpperCase()} Market):
Top Competitors by TVL (Global Context):
${allCompetitors.map((p, i) => {
                    const change = p.change_7d !== null ? ` (${p.change_7d > 0 ? '+' : ''}${p.change_7d.toFixed(1)}% 7d)` : '';
                    return `${i + 1}. ${p.name} (${p.chain}): ${formatTVL(p.tvl)}${change}`;
                }).join('\n')}

Use these REAL numbers when analyzing competitive landscape.
If user's target TVL is provided, compare it to these actual figures.
If competitors like GMX or Gains are relevant, they should appear here.
`;
                console.log(`[Competitive] Found ${allCompetitors.length} DeFi competitors via DeFiLlama (Global+Solana)`);
            }
        } catch (err) {
            console.warn("[Competitive] DeFiLlama fetch failed (non-blocking):", err);
        }
    }

    // 4. Fetch Memecoin Data (DexScreener + Coingecko)
    let dexScreenerContext = "";
    if (normalizedCategory === 'memecoin') {
        // 4a. Coingecko Top Memecoins (Global Context)
        try {
            const topMemecoins = await getTopCoinsByCategory("meme-token", 5);
            if (topMemecoins.length > 0) {
                const coingeckoContext = `
GLOBAL MEMECOIN LEADERS (Coingecko Data):
These are the current market leaders to compare against. ADVISE user to study these.
${topMemecoins.map((c, i) => `${i + 1}. ${c.name} (${c.symbol.toUpperCase()}): MCap $${c.market_cap.toLocaleString()} | Vol $${c.total_volume.toLocaleString()}`).join('\n')}
`;
                dexScreenerContext += coingeckoContext;
            }
        } catch (err) {
            console.warn("[Competitive] Coingecko fetch failed:", err);
        }

        // 4b. DexScreener Narrative Analysis
        try {
            // Extract narrative from idea (use memecoinNarrative field or parse from description)
            const narrative = idea.memecoinNarrative || extractNarrativeFromDescription(idea.description);

            if (narrative) {
                const snapshot = await analyzeMemecoinNarrative(narrative);

                if (snapshot && snapshot.solanaPairs > 0) {
                    dexScreenerContext = `
${generateMemecoinCompetitiveSummary(snapshot)}

INSTRUCTION: Use this REAL on-chain data to assess narrative crowdedness and competitive positioning.
- If crowdedness is "saturated" or "high", be skeptical of differentiation claims.
- Compare the user's idea to the top performers listed above.
- If no clear leader exists, there may be opportunity.
`;
                    console.log(`[Competitive] Found ${snapshot.solanaPairs} memecoin pairs via DexScreener ("${narrative}")`);
                }
            }
        } catch (err) {
            console.warn("[Competitive] DexScreener fetch failed (non-blocking):", err);
        }

        // 4b. Fetch Birdeye data for Memecoin projects (Searching for similar tokens)
        try {
            const birdeye = new BirdeyeMarketService();
            const narrative = idea.memecoinNarrative || extractNarrativeFromDescription(idea.description);
            if (narrative) {
                const searchResults = await birdeye.searchTokens(narrative);
                if (searchResults.length > 0) {
                    const birdeyeContext = `
BIRDEYE SEARCH RESULTS (Real-time Solana Token Search):
Found ${searchResults.length} tokens matching "${narrative}":
${searchResults.slice(0, 5).map(t => `- ${t.name} (${t.symbol}): ${t.verified ? 'Metadata Verified' : 'Unverified'}, Network: ${t.network}`).join('\n')}

INSTRUCTION: Reference these as potential competitors or similar projects in the landscape.
`;
                    dexScreenerContext += birdeyeContext;
                    console.log(`[Competitive] Found ${searchResults.length} tokens via Birdeye search for "${narrative}"`);
                }
            }
        } catch (err) {
            console.warn("[Competitive] Birdeye search failed (non-blocking):", err);
        }
    }

    // 5. Prepare Prompt
    const userContent = `
Analyze this idea for Competitive Intelligence.
Category: ${normalizedCategory}
Current Time: ${new Date().toISOString()}

Idea Data:
${JSON.stringify({
        description: idea.description,
        projectType: idea.projectType, // using original type as hint
        mvpScope: idea.mvpScope,
        successDefinition: idea.successDefinition,
        targetTVL: idea.targetTVL, // Include target TVL for comparison
    }, null, 2)}
${webSearchContext}
${defiLlamaContext}
${dexScreenerContext}
`;

    try {
        // 3. Call LLM
        const modelEnv = process.env.EVAL_MODEL || "gpt-5.2";
        const reasoningEffort = process.env.EVAL_REASONING_SHORT || "medium";

        let model = modelEnv;
        // No auto-mapping to gpt-4o anymore as user explicitly wants 5.2

        const params: any = {
            model: model,
            messages: [
                { role: "system", content: COMPETITIVE_SYSTEM_PROMPT },
                { role: "user", content: userContent }
            ],
            response_format: { type: "json_object" }
        };

        if (model.startsWith('o1') || model.startsWith('gpt-5')) {
            params.reasoning_effort = reasoningEffort;
        }

        const response = await openai().chat.completions.create(params);

        // 4. Parse Response
        let responseContent: string | null = null;

        if (response.choices && response.choices.length > 0) {
            responseContent = response.choices[0].message.content;
        }

        let memo: CompetitiveMemo;

        if (typeof responseContent === 'string') {
            try {
                // Remove potential markdown fences
                const cleanJson = responseContent.replace(/```json/g, '').replace(/```/g, '').trim();
                memo = JSON.parse(cleanJson);
            } catch (e) {
                console.error("Failed to parse CompetitiveMemo JSON:", e);
                return { status: 'not_available', reason: 'invalid_llm_payload' };
            }
        } else {
            return { status: 'not_available', reason: 'empty_llm_response' };
        }

        // 5. Minimal Validation
        if (!memo.categoryLabel || !memo.crowdednessLevel || !Array.isArray(memo.referenceProjects)) {
            console.warn("Invalid CompetitiveMemo shape:", memo);
            return { status: 'not_available', reason: 'invalid_schema_returned' };
        }

        return { status: 'ok', memo };

    } catch (error) {
        console.error("Error fetching competitive memo:", error);
        return {
            status: 'not_available',
            reason: error instanceof Error ? error.message : "Unknown error during fetch"
        };
    }
}
