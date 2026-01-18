import { IdeaSubmission } from "@/lib/ideaSchema";
import { openai } from "@/lib/openaiClient";
import { CompetitiveMemo, CompetitiveMemoResult } from "./competitiveTypes";
import { searchCompetitors } from "@/lib/tavilyClient";

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
  "referenceProjects": [
    { "name": string, "chainOrPlatform": string, "note": string }
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
- **DeFi**: Focus on distinct mechanism or liquidity moat. If it's a generic fork, crowdedness is "high".
- **AI**: Focus on "Wrapper vs Proprietary". If it's just a GPT wrapper, moat is "None".

Constraint:
- Do not fabricate URLs. 
- Keep notes concise (under 20 words).
- If the idea is nonsense, be honest in "evaluatorNotes".
`;

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

    // 3. Prepare Prompt
    const userContent = `
Analyze this idea for Competitive Intelligence.
Category: ${normalizedCategory}
Current Time: ${new Date().toISOString()}

Idea Data:
${JSON.stringify({
        description: idea.description,
        projectType: idea.projectType, // using original type as hint
        mvpScope: idea.mvpScope,
        successDefinition: idea.successDefinition
    }, null, 2)}
${webSearchContext}
`;

    try {
        // 3. Call LLM
        const model = process.env.EVAL_MODEL || "gpt-5.2";
        const reasoningEffort = process.env.EVAL_REASONING_SHORT || "medium";

        // @ts-ignore - openai client typing
        const response = await openai().responses.create({
            model: model,
            input: [
                { role: "system", content: COMPETITIVE_SYSTEM_PROMPT },
                { role: "user", content: userContent }
            ],
            // Activate "Thinking" logic via parameter
            reasoning: {
                effort: reasoningEffort
            },
            text: {
                format: { type: "json_object" }
            },
        } as any);

        // 4. Parse Response
        let responseContent: string | object | undefined;
        const anyResponse = response as any;

        if (anyResponse.output_text) {
            responseContent = anyResponse.output_text;
        } else if (anyResponse.output) {
            responseContent = anyResponse.output;
        } else if (anyResponse.choices && anyResponse.choices[0]?.message?.content) {
            responseContent = anyResponse.choices[0].message.content;
        } else {
            // Fallback: try using the response object directly if it looks like the result
            responseContent = response;
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
        } else if (typeof responseContent === 'object') {
            memo = responseContent as CompetitiveMemo;
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
