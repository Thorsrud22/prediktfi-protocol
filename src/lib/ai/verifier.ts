import { EvidenceClaim, EvidencePack } from "@/lib/ai/evidenceTypes";
import { IdeaEvaluationResult } from "@/lib/ideaEvaluationTypes";
import { openai } from "@/lib/openaiClient";
import { JSON_OUTPUT_SCHEMA } from "@/lib/ai/prompts";
import { parseEvaluationResponse } from "@/lib/ai/parser";

export type VerifierStatus = "pass" | "soft_fail" | "hard_fail" | "error";

export interface VerifierOutcome {
  status: VerifierStatus;
  issues: string[];
  repaired: boolean;
  result: IdeaEvaluationResult;
}

interface VerifierPayload {
  verdict?: VerifierStatus;
  issues?: string[];
  repairedResult?: IdeaEvaluationResult;
}

const VERIFIER_SYSTEM_PROMPT = `You are a strict evaluation verifier.
Your task is to validate a candidate investment evaluation JSON against:
1) Provided evidence pack and claim map.
2) Internal consistency (scores align with risk/verdict).
3) Schema correctness.

Rules:
- Flag unsupported factual claims.
- Flag fabricated competitors not grounded in evidence.
- Flag score/reason mismatches (e.g. severe risks with very high score).
- Flag missing required JSON structure.
- If major issues exist, set verdict to "hard_fail".
- If moderate issues exist, set verdict to "soft_fail".
- If clean, set verdict to "pass".

Output only JSON:
{
  "verdict": "pass" | "soft_fail" | "hard_fail",
  "issues": ["..."],
  "repairedResult": { ...optional full fixed evaluation JSON... }
}`;

function safeParseVerifierPayload(raw: string): VerifierPayload | null {
  try {
    return JSON.parse(raw) as VerifierPayload;
  } catch {
    return null;
  }
}

function sanitizeIssues(issues: unknown): string[] {
  if (!Array.isArray(issues)) return [];
  return issues
    .filter((issue) => typeof issue === "string")
    .map((issue) => issue.trim())
    .filter(Boolean)
    .slice(0, 10);
}

async function runRepairPass(
  model: string,
  draftResult: IdeaEvaluationResult,
  issues: string[],
  evidencePack: EvidencePack,
  claims: EvidenceClaim[]
): Promise<IdeaEvaluationResult | null> {
  try {
    const repairPrompt = `
Fix this evaluation JSON so it remains faithful to the original intent while resolving the verifier issues.

Verifier issues:
${issues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}

Evidence IDs available:
${evidencePack.evidence.map((item) => `- ${item.id} (${item.source}) ${item.title}`).join("\n")}

Claims:
${claims
  .slice(0, 20)
  .map(
    (claim, i) =>
      `${i + 1}. [${claim.claimType}] ${claim.support || "uncorroborated"} | ids=${
        claim.evidenceIds.join(",") || "none"
      } | ${claim.text}`
  )
  .join("\n")}

Return ONLY the corrected JSON evaluation.
${JSON_OUTPUT_SCHEMA}

Current candidate JSON:
${JSON.stringify(draftResult, null, 2)}
`;

    const response = await openai().chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You repair JSON strictly and preserve schema." },
        { role: "user", content: repairPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) return null;

    return parseEvaluationResponse({ output: content });
  } catch {
    return null;
  }
}

export async function runEvaluationVerifier(
  params: {
    draftResult: IdeaEvaluationResult;
    evidencePack: EvidencePack;
    claims: EvidenceClaim[];
    model: string;
  }
): Promise<VerifierOutcome> {
  const { draftResult, evidencePack, claims, model } = params;

  try {
    const verifierPrompt = `
Validate this evaluation output.

Evidence pack:
${JSON.stringify(
  {
    generatedAt: evidencePack.generatedAt,
    unavailableSources: evidencePack.unavailableSources || [],
    evidence: evidencePack.evidence.slice(0, 30),
  },
  null,
  2
)}

Claims:
${JSON.stringify(claims.slice(0, 40), null, 2)}

Candidate evaluation JSON:
${JSON.stringify(draftResult, null, 2)}
`;

    const response = await openai().chat.completions.create({
      model,
      messages: [
        { role: "system", content: VERIFIER_SYSTEM_PROMPT },
        { role: "user", content: verifierPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      return {
        status: "error",
        issues: ["Verifier returned empty response."],
        repaired: false,
        result: draftResult,
      };
    }

    const payload = safeParseVerifierPayload(content);
    if (!payload) {
      return {
        status: "error",
        issues: ["Verifier returned invalid JSON."],
        repaired: false,
        result: draftResult,
      };
    }

    const status = payload.verdict || "error";
    const issues = sanitizeIssues(payload.issues);

    if ((status === "pass" || status === "soft_fail") && payload.repairedResult) {
      try {
        const repairedResult = parseEvaluationResponse(payload.repairedResult);
        return {
          status,
          issues,
          repaired: true,
          result: repairedResult,
        };
      } catch {
        // Ignore invalid repaired JSON and continue with original.
      }
    }

    if (status === "hard_fail") {
      const repaired = await runRepairPass(model, draftResult, issues, evidencePack, claims);
      if (repaired) {
        return {
          status: "soft_fail",
          issues: issues.length > 0 ? issues : ["Verifier repaired severe inconsistencies."],
          repaired: true,
          result: repaired,
        };
      }
    }

    return {
      status,
      issues,
      repaired: false,
      result: draftResult,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      issues: [`Verifier failed: ${message}`],
      repaired: false,
      result: draftResult,
    };
  }
}
