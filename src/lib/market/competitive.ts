import { EvidenceClaim, EvidenceItem, EvidencePack, EvidenceSource } from "@/lib/ai/evidenceTypes";
import { getEvaluationModelMap } from "@/lib/ai/model-routing";
import { IdeaSubmission } from "@/lib/ideaSchema";
import { formatTVL, getDeFiCompetitors } from "@/lib/defiLlamaClient";
import { analyzeMemecoinNarrative, generateMemecoinCompetitiveSummary } from "@/lib/dexscreenerClient";
import { BirdeyeMarketService } from "@/lib/market/birdeye";
import { getTopCoinsByCategory } from "@/lib/coingecko";
import { openai } from "@/lib/openaiClient";
import { searchCompetitors } from "@/lib/tavilyClient";
import { wrapGrounding } from "@/lib/market/types";
import { CompetitiveMemo, CompetitiveMemoResult, ReferenceProject } from "./competitiveTypes";

const COMPETITIVE_SYSTEM_PROMPT = `You are a Competitive Intelligence Scout for specialized crypto/tech sectors.
Your goal is to produce a "Competitive Memo" grounded in provided evidence IDs.

Supported Categories: "memecoin", "defi", "ai".

You must output valid JSON. No markdown.

JSON STRUCTURE:
{
  "categoryLabel": string,
  "crowdednessLevel": "empty" | "moderate" | "high" | "saturated",
  "shortLandscapeSummary": string,
  "referenceProjects": [
    {
      "name": string,
      "chainOrPlatform": string,
      "note": string,
      "metrics": {
        "marketCap": string,
        "tvl": string,
        "dailyUsers": string,
        "funding": string,
        "revenue": string
      }
    }
  ],
  "tractionDifficulty": {
    "label": "low" | "medium" | "high" | "extreme",
    "explanation": string
  },
  "differentiationWindow": {
    "label": "wide_open" | "narrow" | "closed",
    "explanation": string
  },
  "noiseVsSignal": "mostly_noise" | "mixed" | "high_signal",
  "evaluatorNotes": string,
  "claims": [
    {
      "text": string,
      "evidenceIds": [string],
      "claimType": "fact" | "inference",
      "support": "corroborated" | "uncorroborated"
    }
  ],
  "memecoin"?: {
    "narrativeLabel": string,
    "narrativeCrowdedness": "low" | "medium" | "high"
  },
  "defi"?: {
    "defiBucket": string,
    "categoryKings": [string]
  },
  "ai"?: {
    "aiPattern": string,
    "moatType": string
  },
  "timestamp": string
}

Critical rules:
- Any factual claim MUST use valid evidenceIds from the prompt.
- If a fact cannot be grounded, set support="uncorroborated" with evidenceIds=[].
- Do not fabricate competitors or URLs.
- Keep notes concise.`;

const SOURCE_RELIABILITY: Record<EvidenceSource, "high" | "medium" | "low"> = {
  tavily: "medium",
  defillama: "high",
  dexscreener: "high",
  coingecko: "high",
  birdeye: "medium",
  system: "low",
};

function truncateSnippet(input: string, maxLen: number = 240): string {
  const normalized = input.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLen) return normalized;
  return `${normalized.slice(0, maxLen - 3)}...`;
}

function buildEvidenceCollector() {
  const evidence: EvidenceItem[] = [];
  let counter = 1;

  const add = (params: {
    source: EvidenceSource;
    title: string;
    snippet: string;
    url?: string;
    fetchedAt?: string;
  }): string => {
    const id = `${params.source}_${counter++}`;
    evidence.push({
      id,
      source: params.source,
      title: truncateSnippet(params.title, 120),
      snippet: truncateSnippet(params.snippet, 280),
      url: params.url,
      fetchedAt: params.fetchedAt || new Date().toISOString(),
      reliabilityTier: SOURCE_RELIABILITY[params.source],
    });
    return id;
  };

  return {
    add,
    pack: (unavailableSources: string[] = []): EvidencePack => ({
      evidence,
      unavailableSources,
      generatedAt: new Date().toISOString(),
    }),
  };
}

function hasRealMetric(project: ReferenceProject): boolean {
  const metrics = project.metrics;
  if (!metrics) return false;
  return [metrics.marketCap, metrics.tvl, metrics.dailyUsers, metrics.funding, metrics.revenue]
    .some((value) => !!value && value !== "N/A" && value !== "-" && value !== "unknown");
}

function findEvidenceIdsByProject(referenceName: string, evidencePack: EvidencePack): string[] {
  const target = referenceName.toLowerCase();
  return evidencePack.evidence
    .filter((item) => `${item.title} ${item.snippet}`.toLowerCase().includes(target))
    .map((item) => item.id)
    .slice(0, 3);
}

export function normalizeCompetitiveClaims(
  rawClaims: unknown,
  evidencePack: EvidencePack,
  referenceProjects: ReferenceProject[]
): EvidenceClaim[] {
  const validEvidenceIds = new Set(evidencePack.evidence.map((item) => item.id));
  const claims: EvidenceClaim[] = [];

  if (Array.isArray(rawClaims)) {
    for (const rawClaim of rawClaims) {
      if (!rawClaim || typeof rawClaim !== "object") continue;
      const maybeClaim = rawClaim as Partial<EvidenceClaim>;
      const text = typeof maybeClaim.text === "string" ? maybeClaim.text.trim() : "";
      if (!text) continue;

      const claimType = maybeClaim.claimType === "inference" ? "inference" : "fact";
      const evidenceIds = Array.isArray(maybeClaim.evidenceIds)
        ? maybeClaim.evidenceIds.filter((id): id is string => typeof id === "string" && validEvidenceIds.has(id))
        : [];
      const support = evidenceIds.length > 0 ? "corroborated" : "uncorroborated";

      claims.push({
        text: truncateSnippet(text, 220),
        evidenceIds,
        claimType,
        support,
      });
    }
  }

  // Backfill factual claims for reference projects with concrete metrics.
  for (const project of referenceProjects) {
    if (!hasRealMetric(project)) continue;
    const alreadyRepresented = claims.some((claim) =>
      claim.text.toLowerCase().includes(project.name.toLowerCase())
    );
    if (alreadyRepresented) continue;

    const metricSummary = [
      project.metrics?.marketCap ? `market cap ${project.metrics.marketCap}` : null,
      project.metrics?.tvl ? `TVL ${project.metrics.tvl}` : null,
      project.metrics?.dailyUsers ? `users ${project.metrics.dailyUsers}` : null,
      project.metrics?.funding ? `funding ${project.metrics.funding}` : null,
      project.metrics?.revenue ? `revenue ${project.metrics.revenue}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    const evidenceIds = findEvidenceIdsByProject(project.name, evidencePack);
    claims.push({
      text: `${project.name} is an active benchmark with ${metricSummary}.`,
      claimType: "fact",
      evidenceIds,
      support: evidenceIds.length > 0 ? "corroborated" : "uncorroborated",
    });
  }

  if (claims.length === 0) {
    claims.push({
      text: "Competitive positioning remains partially uncertain due limited grounded evidence.",
      evidenceIds: [],
      claimType: "inference",
      support: "uncorroborated",
    });
  }

  // De-duplicate by normalized text.
  const unique = new Map<string, EvidenceClaim>();
  for (const claim of claims) {
    const key = claim.text.toLowerCase().trim();
    if (!unique.has(key)) unique.set(key, claim);
  }

  return Array.from(unique.values()).slice(0, 12);
}

/**
 * Extract memecoin narrative keywords from description.
 */
function extractNarrativeFromDescription(description: string): string | null {
  const text = description.toLowerCase();

  if (text.includes("dog") || text.includes("doge") || text.includes("shiba") || text.includes("puppy")) return "dog";
  if (text.includes("cat") || text.includes("kitty") || text.includes("kitten") || text.includes("popcat")) return "cat";
  if (text.includes("frog") || text.includes("pepe")) return "frog pepe";
  if (text.includes("bird") || text.includes("penguin")) return "bird";

  if (text.includes("trump") || text.includes("maga") || text.includes("politi")) return "trump politifi";
  if (text.includes("elon") || text.includes("musk") || text.includes("tesla")) return "elon musk";
  if (text.includes("ai agent") || text.includes("artificial intelligence")) return "ai agent";
  if (text.includes("anime") || text.includes("waifu")) return "anime";
  if (text.includes("chad") || text.includes("gigachad") || text.includes("alpha")) return "chad";

  const words = description.split(/\s+/).filter((word) => word.length > 3);
  return words.length > 0 ? words[0] : null;
}

function detectDeFiMechanism(idea: IdeaSubmission): string {
  const text = `${idea.description} ${idea.defiMechanism || ""} ${idea.mvpScope || ""}`.toLowerCase();

  if (text.includes("lend") || text.includes("borrow") || text.includes("collateral")) return "lending";
  if (text.includes("stake") || text.includes("staking") || text.includes("validator")) return "staking";
  if (text.includes("swap") || text.includes("dex") || text.includes("amm") || text.includes("liquidity pool")) return "amm";
  if (text.includes("perp") || text.includes("derivative") || text.includes("futures") || text.includes("options")) return "derivatives";
  if (text.includes("yield") || text.includes("farm") || text.includes("vault")) return "yield";
  if (text.includes("aggregat")) return "aggregator";

  if (idea.defiMechanism) return idea.defiMechanism;
  return "lending";
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function fetchCompetitiveMemo(
  idea: IdeaSubmission,
  normalizedCategory: string
): Promise<CompetitiveMemoResult> {
  const fetchedAt = new Date();
  const supported = ["memecoin", "defi", "ai"];
  if (!supported.includes(normalizedCategory)) {
    return {
      status: "not_available",
      reason: `Category '${normalizedCategory}' is not supported for competitive intelligence.`,
    };
  }

  const unavailableSources: string[] = [];
  const collector = buildEvidenceCollector();

  let webSearchContext = "";
  let defiLlamaContext = "";
  let dexScreenerContext = "";

  // Tavily evidence
  try {
    const searchResults = await withTimeout(searchCompetitors(idea.description, normalizedCategory), 5000);
    if (searchResults.length > 0) {
      const formattedResults = searchResults
        .map((result, i) => {
          const evidenceId = collector.add({
            source: "tavily",
            title: result.title,
            url: result.url,
            snippet: result.content,
          });
          return `${i + 1}. [${evidenceId}] ${result.title}\n   URL: ${result.url}\n   Snippet: ${truncateSnippet(result.content, 220)}`;
        })
        .join("\n\n");

      webSearchContext = `
REAL-TIME WEB SEARCH RESULTS (Tavily):
${formattedResults}
`;
      console.log(`[Competitive] Found ${searchResults.length} web references via Tavily`);
    } else if (!process.env.TAVILY_API_KEY) {
      unavailableSources.push("tavily");
    }
  } catch (err) {
    unavailableSources.push("tavily");
    console.warn("[Competitive] Tavily search failed (non-blocking):", err);
  }

  // DeFiLlama evidence
  if (normalizedCategory === "defi") {
    try {
      const mechanism = detectDeFiMechanism(idea);
      const [solanaCompetitors, globalCompetitors] = await Promise.all([
        withTimeout(getDeFiCompetitors(mechanism, "Solana"), 5000),
        withTimeout(getDeFiCompetitors(mechanism, "Global"), 5000),
      ]);

      if (solanaCompetitors.length > 0 || globalCompetitors.length > 0) {
        const allCompetitors = [...solanaCompetitors, ...globalCompetitors]
          .filter((value, i, arr) => arr.findIndex((item) => item.name === value.name) === i)
          .sort((a, b) => b.tvl - a.tvl)
          .slice(0, 10);

        const formattedLines = allCompetitors.map((protocol, i) => {
          const evidenceId = collector.add({
            source: "defillama",
            title: `${protocol.name} TVL snapshot`,
            url: protocol.slug ? `https://defillama.com/protocol/${protocol.slug}` : undefined,
            snippet: `${protocol.name} (${protocol.chain}) TVL ${formatTVL(protocol.tvl)}${protocol.change_7d !== null ? `, 7d ${protocol.change_7d.toFixed(1)}%` : ""}`,
          });
          const change = protocol.change_7d !== null ? ` (${protocol.change_7d > 0 ? "+" : ""}${protocol.change_7d.toFixed(1)}% 7d)` : "";
          return `${i + 1}. [${evidenceId}] ${protocol.name} (${protocol.chain}): ${formatTVL(protocol.tvl)}${change}`;
        });

        defiLlamaContext = `
REAL-TIME DEFILLAMA TVL DATA:
${formattedLines.join("\n")}
`;
        console.log(`[Competitive] Found ${allCompetitors.length} DeFi competitors via DeFiLlama`);
      } else {
        unavailableSources.push("defillama");
      }
    } catch (err) {
      unavailableSources.push("defillama");
      console.warn("[Competitive] DeFiLlama fetch failed (non-blocking):", err);
    }
  }

  // Memecoin extra evidence
  if (normalizedCategory === "memecoin") {
    try {
      const topMemecoins = await withTimeout(getTopCoinsByCategory("meme-token", 5), 5000);
      if (topMemecoins.length > 0) {
        const coingeckoContext = topMemecoins
          .map((coin, i) => {
            const evidenceId = collector.add({
              source: "coingecko",
              title: `${coin.name} market snapshot`,
              url: `https://www.coingecko.com/en/coins/${coin.id}`,
              snippet: `${coin.name} (${coin.symbol.toUpperCase()}) market cap $${coin.market_cap.toLocaleString()} volume $${coin.total_volume.toLocaleString()}`,
            });
            return `${i + 1}. [${evidenceId}] ${coin.name} (${coin.symbol.toUpperCase()}): MCap $${coin.market_cap.toLocaleString()} | Vol $${coin.total_volume.toLocaleString()}`;
          })
          .join("\n");

        dexScreenerContext += `
GLOBAL MEMECOIN LEADERS (Coingecko):
${coingeckoContext}
`;
      }
    } catch (err) {
      unavailableSources.push("coingecko");
      console.warn("[Competitive] Coingecko fetch failed (non-blocking):", err);
    }

    try {
      const narrative = idea.memecoinNarrative || extractNarrativeFromDescription(idea.description);
      if (narrative) {
        const snapshot = await withTimeout(analyzeMemecoinNarrative(narrative), 5000);
        if (snapshot && snapshot.solanaPairs > 0) {
          collector.add({
            source: "dexscreener",
            title: `Narrative snapshot: ${narrative}`,
            snippet: `${snapshot.solanaPairs} Solana pairs, crowdedness ${snapshot.crowdednessSignal}, avg mcap ${snapshot.avgMarketCap.toFixed(0)}`,
          });

          for (const token of snapshot.topTokens.slice(0, 5)) {
            collector.add({
              source: "dexscreener",
              title: `${token.name} (${token.symbol})`,
              snippet: `MCap ${token.marketCap.toFixed(0)} | Vol24h ${token.volume24h.toFixed(0)} | Liquidity ${token.liquidity.toFixed(0)} | Age ${token.ageHours.toFixed(1)}h`,
            });
          }

          dexScreenerContext += `
${generateMemecoinCompetitiveSummary(snapshot)}
`;
          console.log(`[Competitive] Found ${snapshot.solanaPairs} memecoin pairs via DexScreener`);
        } else {
          unavailableSources.push("dexscreener");
        }
      }
    } catch (err) {
      unavailableSources.push("dexscreener");
      console.warn("[Competitive] DexScreener fetch failed (non-blocking):", err);
    }

    try {
      const birdeye = new BirdeyeMarketService();
      const narrative = idea.memecoinNarrative || extractNarrativeFromDescription(idea.description);
      if (narrative) {
        const searchResults = await withTimeout(birdeye.searchTokens(narrative), 5000);
        if (searchResults.length > 0) {
          const rows = searchResults.slice(0, 5).map((token) => {
            const evidenceId = collector.add({
              source: "birdeye",
              title: `${token.name} (${token.symbol})`,
              url: `https://birdeye.so/token/${token.address}?chain=solana`,
              snippet: `${token.verified ? "verified" : "unverified"} metadata on ${token.network}`,
            });
            return `- [${evidenceId}] ${token.name} (${token.symbol}) - ${token.verified ? "Verified" : "Unverified"}`;
          });

          dexScreenerContext += `
BIRDEYE SEARCH RESULTS:
${rows.join("\n")}
`;
        } else {
          unavailableSources.push("birdeye");
        }
      }
    } catch (err) {
      unavailableSources.push("birdeye");
      console.warn("[Competitive] Birdeye search failed (non-blocking):", err);
    }
  }

  const evidencePack = collector.pack(Array.from(new Set(unavailableSources)));
  const evidenceIdHints = evidencePack.evidence
    .slice(0, 40)
    .map((item) => `- ${item.id} (${item.source}): ${item.title}`)
    .join("\n");

  const userContent = `
Analyze this idea for Competitive Intelligence.
Category: ${normalizedCategory}
Current Time: ${new Date().toISOString()}

Idea Data:
${JSON.stringify(
  {
    description: idea.description,
    projectType: idea.projectType,
    mvpScope: idea.mvpScope,
    successDefinition: idea.successDefinition,
    targetTVL: idea.targetTVL,
  },
  null,
  2
)}

Evidence IDs available for citation:
${evidenceIdHints || "- none"}

${webSearchContext}
${defiLlamaContext}
${dexScreenerContext}
`;

  try {
    const modelMap = getEvaluationModelMap();
    const reasoningEffort = process.env.EVAL_REASONING_SHORT || "medium";

    const params: Record<string, unknown> = {
      model: modelMap.competitive,
      messages: [
        { role: "system", content: COMPETITIVE_SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    };

    if (modelMap.competitive.startsWith("o1") || modelMap.competitive.startsWith("gpt-5")) {
      params.reasoning_effort = reasoningEffort;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const response = await openai().chat.completions.create(params as any, { signal: controller.signal });
    clearTimeout(timeoutId);

    const responseContent = response.choices?.[0]?.message?.content;
    if (typeof responseContent !== "string") {
      return { status: "not_available", reason: "empty_llm_response" };
    }

    let memo: CompetitiveMemo;
    try {
      const cleanJson = responseContent.replace(/```json/g, "").replace(/```/g, "").trim();
      memo = JSON.parse(cleanJson) as CompetitiveMemo;
    } catch (error) {
      console.error("Failed to parse CompetitiveMemo JSON:", error);
      return { status: "not_available", reason: "invalid_llm_payload" };
    }

    if (!memo.categoryLabel || !memo.crowdednessLevel || !Array.isArray(memo.referenceProjects)) {
      console.warn("Invalid CompetitiveMemo shape:", memo);
      return { status: "not_available", reason: "invalid_schema_returned" };
    }

    memo.claims = normalizeCompetitiveClaims((memo as any).claims, evidencePack, memo.referenceProjects || []);
    return {
      status: "ok",
      memo,
      evidencePack,
      grounding: wrapGrounding(
        {
          category: normalizedCategory,
          evidenceCount: evidencePack.evidence.length,
          unavailableSources: evidencePack.unavailableSources || [],
        },
        "competitive_memo",
        fetchedAt,
        72
      ),
    };
  } catch (error) {
    console.error("Error fetching competitive memo:", error);
    return {
      status: "not_available",
      reason: error instanceof Error ? error.message : "Unknown error during fetch",
    };
  }
}
