import { IdeaSubmission } from "@/lib/ideaSchema";
import { IdeaEvaluationResult } from "@/lib/ideaEvaluationTypes";
import { openai } from "@/lib/openaiClient";
import { MarketSnapshot } from "@/lib/market/types";
import {
    PERMABEAR_SYSTEM_PROMPT,
    PERMABULL_SYSTEM_PROMPT,
    JUDGE_SYSTEM_PROMPT,
    JSON_OUTPUT_SCHEMA
} from "./prompts";
import { buildIdeaContextSummary, detectLaunchedStatus } from "./evaluator"; // Re-use helpers
import { parseEvaluationResponse } from "./parser";
import { calibrateScore } from "./calibration";
import { verifyTokenSecurity } from "@/lib/solana/token-check";
import { fetchCompetitiveMemo } from "@/lib/market/competitive";

// Types for intermediate agent outputs
interface BearAnalysis {
    bearAnalysis: {
        fatalFlaws: string[];
        riskScore: number;
        verdict: "KILL" | "AVOID" | "SHORT";
        roast: string;
    }
}

interface BullAnalysis {
    bullAnalysis: {
        alphaSignals: string[];
        upsideScore: number;
        verdict: "ALL IN" | "APE" | "LONG";
        pitch: string;
    }
}

export type ProgressCallback = (step: string) => void;
export type ThoughtCallback = (thought: string) => void;

/**
 * Evaluates an idea using the "Investment Committee" protocol (Bull/Bear/Judge).
 */
export async function evaluateWithCommittee(
    input: IdeaSubmission,
    options?: {
        market?: MarketSnapshot;
        onProgress?: ProgressCallback;
        onThought?: ThoughtCallback;
    }
): Promise<IdeaEvaluationResult> {
    const contextSummary = buildIdeaContextSummary(input);

    // 1. Parallel Data Fetching (Same as legacy evaluator)
    options?.onProgress?.("Gathering intel (Market, On-Chain, Competitors)...");

    const normalizedCategory = input.projectType.toLowerCase();

    // Launch market checks
    const tokenCheckPromise = input.tokenAddress
        ? verifyTokenSecurity(input.tokenAddress).catch(err => ({ valid: false, error: String(err) } as any))
        : Promise.resolve(null);

    const competitiveMemoPromise = ['memecoin', 'defi', 'ai'].includes(normalizedCategory)
        ? fetchCompetitiveMemo(input, normalizedCategory).catch(err => ({ status: 'error', error: err } as any))
        : Promise.resolve(null);

    const [tokenCheckRaw, competitiveMemoResult] = await Promise.all([tokenCheckPromise, competitiveMemoPromise]);

    // Construct Context Strings (Reuse logic from evaluator.ts)
    let marketContext = "";
    if (options?.market && options.market.source !== 'fallback') {
        marketContext = `Market Data:\n${JSON.stringify(options.market, null, 2)}`;
    }

    let verificationContext = "";
    if (tokenCheckRaw) {
        if (!tokenCheckRaw.valid) {
            verificationContext = `Token Check: FAILED (${tokenCheckRaw.error})`;
        } else {
            verificationContext = `Token Check: MINT=${tokenCheckRaw.mintAuthority ? 'ACTIVE' : 'REVOKED'}, FREEZE=${tokenCheckRaw.freezeAuthority ? 'ACTIVE' : 'REVOKED'}, LP=${tokenCheckRaw.isLiquidityLocked ? 'LOCKED' : 'UNLOCKED'}`;
        }
    } else if (detectLaunchedStatus(input)) {
        verificationContext = "INTELLIGENCE GAP: Claims live, no CA provided.";
    }

    let competitiveContext = "";
    let referenceProjects: any[] = [];
    if (competitiveMemoResult?.status === 'ok') {
        competitiveContext = `Competitors: ${competitiveMemoResult.memo.shortLandscapeSummary}`;
        referenceProjects = competitiveMemoResult.memo.referenceProjects || [];
    }

    // 2. The Committee Process
    const baseUserContent = `
  Input Data:
  ${contextSummary}
  ${marketContext}
  ${verificationContext}
  ${competitiveContext}
  
  Idea:
  ${JSON.stringify(input, null, 2)}
  `;

    // --- Step 2a: The Agents (Parallel) ---
    options?.onProgress?.("kicking off Committee Debate (Bull vs Bear)...");

    // Bear Agent (Cheap Model)
    const bearTask = openai().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: PERMABEAR_SYSTEM_PROMPT },
            { role: "user", content: baseUserContent }
        ],
        response_format: { type: "json_object" }
    });

    // Bull Agent (Cheap Model)
    const bullTask = openai().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: PERMABULL_SYSTEM_PROMPT },
            { role: "user", content: baseUserContent }
        ],
        response_format: { type: "json_object" }
    });

    const [bearRaw, bullRaw] = await Promise.all([bearTask, bullTask]);

    const bearOutput = JSON.parse(bearRaw.choices[0].message.content || "{}");
    const bullOutput = JSON.parse(bullRaw.choices[0].message.content || "{}");

    options?.onProgress?.(`Debate Concluded. Bear: "${bearOutput.bearAnalysis?.verdict}", Bull: "${bullOutput.bullAnalysis?.verdict}"`);

    if (options?.onThought) {
        options.onThought(`[BEAR] "${bearOutput.bearAnalysis?.roast || 'No comment'}"\n`);
        options.onThought(`[BULL] "${bullOutput.bullAnalysis?.pitch || 'No comment'}"\n`);
    }

    // --- Step 2b: The Judge (Flagship Model) ---
    options?.onProgress?.("The Judge is deliberating...");

    const judgeContent = `
  ${baseUserContent}

  --- COMMITTEE REPORTS ---
  
  THE BEAR REPORT (Risks):
  ${JSON.stringify(bearOutput, null, 2)}

  THE BULL REPORT (Upside):
  ${JSON.stringify(bullOutput, null, 2)}

  --- INSTRUCTION ---
  Synthesize a final decision based on these reports and the JSON Schema.
  ${JSON_OUTPUT_SCHEMA}
  `;

    // Judge uses GPT-5.2 (or environment default for flagship)
    const judgeModel = process.env.EVAL_MODEL === 'gpt-5.2' ? 'gpt-5.2' : 'gpt-4o';

    const judgeResponse = await openai().chat.completions.create({
        model: judgeModel,
        messages: [
            { role: "system", content: JUDGE_SYSTEM_PROMPT },
            { role: "user", content: judgeContent }
        ],
        response_format: { type: "json_object" }
    });

    options?.onProgress?.("Final Verdict Reached.");

    // 3. Post-Processing (Calibration)
    let result = parseEvaluationResponse(judgeResponse);

    // Inject Committee Data into the result (for UI display if needed)
    // We can attach it to "technical.comments" or a new field if we extend the type
    // For now, let's append it to the technical comments so user sees it
    result.technical.comments += `\n\n[COMMITTEE LOG]\nBear Verdict: ${bearOutput.bearAnalysis?.verdict} ("${bearOutput.bearAnalysis?.roast}")\nBull Verdict: ${bullOutput.bullAnalysis?.verdict} ("${bullOutput.bullAnalysis?.pitch}")`;

    // Run standard calibration
    result = calibrateScore({
        projectType: input.projectType,
        market: options?.market,
        rawResult: result,
        ideaSubmission: input
    });

    // Merge Competitors (Same as legacy)
    if (referenceProjects.length > 0) {
        const mappedCompetitors = referenceProjects.map(p => ({
            name: p.name,
            metrics: p.metrics || {}
        }));
        const existingNames = new Set((result.market?.competitors || []).map(c => c.name.toLowerCase()));
        const uniqueNewCompetitors = mappedCompetitors.filter(c => !existingNames.has(c.name.toLowerCase()));
        result.market = {
            ...result.market,
            competitors: [...(result.market?.competitors || []), ...uniqueNewCompetitors]
        };
    }

    return result;
}
