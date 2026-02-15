import type { ProjectDomain } from "@/lib/ai/domain-classifier";

export type RubricBand = "0-2" | "3-4" | "5-6" | "7-8" | "9-10";

export interface RubricDimension {
  id: string;
  label: string;
  anchors: Record<RubricBand, string>;
}

const BAND_ORDER: RubricBand[] = ["0-2", "3-4", "5-6", "7-8", "9-10"];

export const CORE_SCORING_RUBRIC: RubricDimension[] = [
  {
    id: "market_opportunity",
    label: "Market Opportunity",
    anchors: {
      "0-2": "No clear user pain, no defensible demand, or market appears non-viable.",
      "3-4": "Niche or shrinking demand with weak buying intent and unclear entry wedge.",
      "5-6": "Real demand exists but crowded landscape and limited proof of early pull.",
      "7-8": "Large demand with a credible wedge, identified early adopters, and timing tailwind.",
      "9-10": "Exceptional market setup: strong timing, clear distribution path, and durable upside.",
    },
  },
  {
    id: "technical_feasibility",
    label: "Technical Feasibility",
    anchors: {
      "0-2": "Architecture is unrealistic, unsafe, or impossible for stated scope and team.",
      "3-4": "High execution risk with major unresolved constraints and fragile implementation plan.",
      "5-6": "Build is feasible but contains notable complexity, debt risk, or undefined constraints.",
      "7-8": "Feasible implementation with pragmatic scope, manageable risks, and clear build path.",
      "9-10": "Strong technical plan with clear milestones, robust architecture, and low unknowns.",
    },
  },
  {
    id: "competitive_moat",
    label: "Competitive Moat",
    anchors: {
      "0-2": "Easily copyable concept with no differentiation beyond hype or branding.",
      "3-4": "Weak differentiation and strong incumbents likely to out-execute quickly.",
      "5-6": "Some differentiation exists but moat durability remains uncertain.",
      "7-8": "Clear differentiation with evidence of defensibility (data, distribution, network effects).",
      "9-10": "Compelling and durable moat with sustained advantage that is difficult to replicate.",
    },
  },
  {
    id: "execution_readiness",
    label: "Execution Readiness",
    anchors: {
      "0-2": "No credible path to launch, major team or operational blockers unresolved.",
      "3-4": "Execution plan is weak and likely to miss critical milestones.",
      "5-6": "Execution path exists but requires meaningful derisking before scale.",
      "7-8": "Team and plan can deliver MVP with realistic milestones and resource mapping.",
      "9-10": "Exceptional execution readiness with clear milestones, ownership, and launch discipline.",
    },
  },
];

type RubricProfile = "defi" | "memecoin" | "ai" | "saas" | "consumer" | "generic";

function normalizeProjectType(projectType?: string): string {
  return (projectType || "generic").trim().toLowerCase();
}

function domainToRubricProfile(domain?: ProjectDomain): RubricProfile | null {
  if (!domain) return null;
  if (domain === "crypto_defi") return "defi";
  if (domain === "memecoin") return "memecoin";
  if (domain === "ai_ml") return "ai";
  if (domain === "saas") return "saas";
  if (domain === "consumer") return "consumer";
  return "generic";
}

function projectTypeToRubricProfile(projectType?: string): RubricProfile {
  const normalized = normalizeProjectType(projectType);
  if (normalized === "defi") return "defi";
  if (normalized === "memecoin") return "memecoin";
  if (normalized === "ai") return "ai";
  return "generic";
}

function resolveRubricProfile(projectType?: string, classifiedDomain?: ProjectDomain): RubricProfile {
  const domainProfile = domainToRubricProfile(classifiedDomain);
  if (domainProfile) return domainProfile;
  return projectTypeToRubricProfile(projectType);
}

function domainAddendum(profile: RubricProfile): string {
  if (profile === "defi") {
    return `Domain calibration (DeFi):
- Penalize unsustainable yield mechanics, unclear liquidation design, or weak security posture.
- Reward clear value accrual, realistic liquidity strategy, and explicit risk controls.`;
  }

  if (profile === "memecoin") {
    return `Domain calibration (Memecoin):
- Penalize vague distribution plans, concentrated holder risk, and narrative-only utility.
- Reward fair launch mechanics, transparent liquidity plans, and credible community growth loops.`;
  }

  if (profile === "ai") {
    return `Domain calibration (AI):
- Penalize thin wrapper products with no proprietary data moat or distribution advantage.
- Reward differentiated model strategy, unique data loops, and realistic acquisition channels.`;
  }

  if (profile === "saas") {
    return `Domain calibration (SaaS):
- Penalize weak unit economics, vague ICP definition, and churn-prone onboarding assumptions.
- Reward clear CAC/LTV logic, retention evidence, and expansion revenue paths (upsell/seat growth).`;
  }

  if (profile === "consumer") {
    return `Domain calibration (Consumer):
- Penalize shallow engagement loops, no distribution edge, and weak habit formation assumptions.
- Reward clear retention loops, organic growth vectors, and measurable user value at low friction.`;
  }

  return `Domain calibration (Generic):
- Adjust emphasis by category, but keep score anchors consistent and evidence-driven.`;
}

function formatDimension(dimension: RubricDimension): string {
  const lines = [`${dimension.label}:`];
  for (const band of BAND_ORDER) {
    lines.push(`- ${band}: ${dimension.anchors[band]}`);
  }
  return lines.join("\n");
}

export function buildScoringRubricPrompt(
  projectType?: string,
  classifiedDomain?: ProjectDomain
): string {
  const dimensions = CORE_SCORING_RUBRIC.map(formatDimension).join("\n\n");
  const profile = resolveRubricProfile(projectType, classifiedDomain);

  return `SCORING RUBRIC (MANDATORY):
Use these anchored definitions for every 0-10 sub-score. Do not invent custom scales.

${dimensions}

Scoring discipline rules:
- Show sub-scores with one-line evidence-backed rationale per dimension.
- Final score must be a weighted synthesis of sub-scores, not a vibes-based guess.
- If evidence is missing, lower confidence and note uncertainty explicitly.

${domainAddendum(profile)}`;
}
