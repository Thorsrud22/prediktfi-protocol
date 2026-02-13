import type { MarketSnapshot } from "@/lib/market/types";

export const IDEA_PROJECT_TYPES = [
  "memecoin",
  "defi",
  "ai",
  "nft",
  "gaming",
  "other",
] as const;

export type IdeaProjectType = (typeof IDEA_PROJECT_TYPES)[number];

export type ContextualFieldKey =
  | "memecoinVibe"
  | "memecoinNarrative"
  | "defiMechanism"
  | "defiRevenue"
  | "aiModelType"
  | "aiDataMoat"
  | "nftUtility"
  | "nftCollectorHook"
  | "gamingCoreLoop"
  | "gamingEconomyModel"
  | "otherTargetUser"
  | "otherDifferentiation";

export type IdeaContextualFieldValues = Partial<Record<ContextualFieldKey, string | undefined>>;

export interface ContextualFieldDefinition {
  key: ContextualFieldKey;
  label: string;
  reviewLabel: string;
  placeholder: string;
}

interface IdeaCategoryConfig {
  label: string;
  requiresMarketSnapshot: boolean;
  preflightLeadingSteps: string[];
  preflightPostSnapshotSteps: string[];
  committeeIntelStep: string;
  fallbackReasoningSteps: string[];
  contextualFields: readonly ContextualFieldDefinition[];
}

const CATEGORY_CONFIG: Record<IdeaProjectType, IdeaCategoryConfig> = {
  memecoin: {
    label: "Memecoin",
    requiresMarketSnapshot: true,
    preflightLeadingSteps: ["Connecting to market data feeds..."],
    preflightPostSnapshotSteps: ["Syncing memecoin liquidity, narrative, and competitor signals..."],
    committeeIntelStep: "Gathering intel (Market, Liquidity, Narrative, Competitors)...",
    fallbackReasoningSteps: [
      "Scanning narrative momentum and meme distribution channels...",
      "Checking liquidity setup and anti-rug readiness...",
      "Comparing saturation against top meme competitors...",
      "Stress-testing launch assumptions against team bandwidth...",
      "Synthesizing conviction vs downside in a memecoin context...",
    ],
    contextualFields: [
      {
        key: "memecoinVibe",
        label: "Community Vibe",
        reviewLabel: "Vibe",
        placeholder: "e.g. Cult-like, Degen, Institutional-grade",
      },
      {
        key: "memecoinNarrative",
        label: "Primary Narrative",
        reviewLabel: "Narrative",
        placeholder: "e.g. AI-driven, Real World Asset, Joke",
      },
    ],
  },
  defi: {
    label: "DeFi / Utility",
    requiresMarketSnapshot: true,
    preflightLeadingSteps: ["Connecting to market data feeds..."],
    preflightPostSnapshotSteps: ["Syncing DeFi security, TVL, and protocol competitiveness signals..."],
    committeeIntelStep: "Gathering intel (Market, Security, TVL, Competitors)...",
    fallbackReasoningSteps: [
      "Reviewing mechanism design and protocol security assumptions...",
      "Evaluating revenue durability and unit economics...",
      "Benchmarking TVL and traction versus category leaders...",
      "Auditing launch dependencies and compliance-sensitive risks...",
      "Synthesizing investment case with downside-weighted discipline...",
    ],
    contextualFields: [
      {
        key: "defiMechanism",
        label: "Key Mechanism",
        reviewLabel: "Mechanism",
        placeholder: "e.g. Concentrated Liquidity, Lending",
      },
      {
        key: "defiRevenue",
        label: "Revenue Model",
        reviewLabel: "Revenue",
        placeholder: "e.g. Trading fees, Subscription",
      },
    ],
  },
  ai: {
    label: "AI Agent",
    requiresMarketSnapshot: false,
    preflightLeadingSteps: [
      "Loading AI category intelligence feeds...",
      "Profiling model strategy, data moat, and GTM signals...",
    ],
    preflightPostSnapshotSteps: [],
    committeeIntelStep: "Gathering intel (Model, Data Moat, Distribution, Competitors)...",
    fallbackReasoningSteps: [
      "Evaluating model architecture depth and adaptation strategy...",
      "Assessing data moat quality and defensibility over time...",
      "Inspecting user acquisition loops and GTM realism...",
      "Benchmarking AI category saturation and differentiation...",
      "Synthesizing product moat versus execution risk...",
    ],
    contextualFields: [
      {
        key: "aiModelType",
        label: "Model Type",
        reviewLabel: "Model",
        placeholder: "e.g. LLM-wrapper, Custom Training",
      },
      {
        key: "aiDataMoat",
        label: "Data Moat",
        reviewLabel: "Moat",
        placeholder: "e.g. Proprietary dataset, Network effect",
      },
    ],
  },
  nft: {
    label: "NFT / Art",
    requiresMarketSnapshot: false,
    preflightLeadingSteps: [
      "Loading NFT category intelligence feeds...",
      "Profiling utility depth, collector pull, and distribution channels...",
    ],
    preflightPostSnapshotSteps: [],
    committeeIntelStep: "Gathering intel (Utility, Collector Demand, Distribution)...",
    fallbackReasoningSteps: [
      "Evaluating utility depth beyond pure artwork speculation...",
      "Assessing collector hook strength and retention mechanics...",
      "Reviewing distribution pathways to creator and collector communities...",
      "Benchmarking crowdedness against adjacent NFT concepts...",
      "Synthesizing investability under creator-economy constraints...",
    ],
    contextualFields: [
      {
        key: "nftUtility",
        label: "Utility Layer",
        reviewLabel: "Utility",
        placeholder: "e.g. Member perks, gated access, in-product unlocks",
      },
      {
        key: "nftCollectorHook",
        label: "Collector Hook",
        reviewLabel: "Collector Hook",
        placeholder: "e.g. Lore, artist collaboration, evolving rarity loop",
      },
    ],
  },
  gaming: {
    label: "Gaming",
    requiresMarketSnapshot: false,
    preflightLeadingSteps: [
      "Loading gaming category intelligence feeds...",
      "Profiling core gameplay loop, economy model, and retention signals...",
    ],
    preflightPostSnapshotSteps: [],
    committeeIntelStep: "Gathering intel (Core Loop, Economy, Retention)...",
    fallbackReasoningSteps: [
      "Analyzing core gameplay loop for repeatable player engagement...",
      "Evaluating economy design for inflation and sink/source balance...",
      "Assessing acquisition and retention assumptions by audience segment...",
      "Reviewing production scope against realistic delivery cadence...",
      "Synthesizing upside versus execution burn risk...",
    ],
    contextualFields: [
      {
        key: "gamingCoreLoop",
        label: "Core Gameplay Loop",
        reviewLabel: "Core Loop",
        placeholder: "e.g. Compete, earn, upgrade, and re-enter ranked matches",
      },
      {
        key: "gamingEconomyModel",
        label: "Economy Model",
        reviewLabel: "Economy",
        placeholder: "e.g. Cosmetic sinks, season pass, crafted item marketplace",
      },
    ],
  },
  other: {
    label: "Other",
    requiresMarketSnapshot: false,
    preflightLeadingSteps: [
      "Loading category-adaptive intelligence feeds...",
      "Profiling user pain, differentiation, and execution constraints...",
    ],
    preflightPostSnapshotSteps: [],
    committeeIntelStep: "Gathering intel (Target User, Differentiation, Execution)...",
    fallbackReasoningSteps: [
      "Defining target user pain point and urgency...",
      "Assessing whether the solution is materially differentiated...",
      "Reviewing distribution realism and demand capture path...",
      "Stress-testing scope against founder capacity and timeline...",
      "Synthesizing conviction with uncertainty-adjusted assumptions...",
    ],
    contextualFields: [
      {
        key: "otherTargetUser",
        label: "Target User",
        reviewLabel: "Target User",
        placeholder: "e.g. Active traders, indie studios, creator teams",
      },
      {
        key: "otherDifferentiation",
        label: "Differentiation",
        reviewLabel: "Differentiation",
        placeholder: "e.g. Why this is 10x better than existing alternatives",
      },
    ],
  },
};

const DEFAULT_CATEGORY: IdeaProjectType = "other";

const AI_TOKENOMICS_ONLY_PATTERNS = [
  "tokenomics",
  "liquidity",
  "lp ",
  "lp-",
  "rug",
  "mint authority",
  "freeze authority",
  "holder distribution",
  "airdrop",
  "staking",
  "market cap",
  "renounce",
  "on-chain authority",
];

const AI_RELEVANCE_HINTS = [
  "ai",
  "model",
  "llm",
  "agent",
  "dataset",
  "data moat",
  "inference",
  "prompt",
  "retrieval",
  "acquisition",
  "distribution",
  "gtm",
  "users",
];

function isFilled(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isAiTokenomicsOnlyStep(step: string): boolean {
  const lowered = step.toLowerCase();
  const hasTokenomicsKeyword = AI_TOKENOMICS_ONLY_PATTERNS.some((keyword) => lowered.includes(keyword));
  if (!hasTokenomicsKeyword) return false;
  const hasAiKeyword = AI_RELEVANCE_HINTS.some((keyword) => lowered.includes(keyword));
  return !hasAiKeyword;
}

export function normalizeIdeaProjectType(projectType: string | null | undefined): IdeaProjectType {
  if (typeof projectType !== "string" || !projectType) return DEFAULT_CATEGORY;
  const lowered = projectType.toLowerCase();
  return (IDEA_PROJECT_TYPES as readonly string[]).includes(lowered)
    ? (lowered as IdeaProjectType)
    : DEFAULT_CATEGORY;
}

export function getIdeaCategoryConfig(projectType: string | null | undefined): IdeaCategoryConfig {
  return CATEGORY_CONFIG[normalizeIdeaProjectType(projectType)];
}

export function categoryNeedsMarketSnapshot(projectType: string | null | undefined): boolean {
  return getIdeaCategoryConfig(projectType).requiresMarketSnapshot;
}

export function getCategoryContextualFields(
  projectType: string | null | undefined
): readonly ContextualFieldDefinition[] {
  return getIdeaCategoryConfig(projectType).contextualFields;
}

export function getMissingContextualFields(
  projectType: string | null | undefined,
  values: IdeaContextualFieldValues
): ContextualFieldDefinition[] {
  return getCategoryContextualFields(projectType).filter((field) => !isFilled(values[field.key]));
}

export function getCategoryCommitteeIntelStep(projectType: string | null | undefined): string {
  return getIdeaCategoryConfig(projectType).committeeIntelStep;
}

export function buildCategoryPreflightSteps(
  projectType: string | null | undefined,
  marketSnapshot?: Pick<MarketSnapshot, "solPriceUsd">
): string[] {
  const config = getIdeaCategoryConfig(projectType);
  const steps = [...config.preflightLeadingSteps];

  if (config.requiresMarketSnapshot) {
    const snapshot = marketSnapshot?.solPriceUsd;
    const formatted = typeof snapshot === "number" ? snapshot.toLocaleString() : "N/A";
    steps.push(`Market snapshot: SOL $${formatted}`);
  }

  steps.push(...config.preflightPostSnapshotSteps);
  return steps;
}

export function sanitizeReasoningStepsForCategory(
  projectType: string | null | undefined,
  reasoningSteps: string[] | undefined
): string[] {
  const config = getIdeaCategoryConfig(projectType);
  const normalizedCategory = normalizeIdeaProjectType(projectType);
  const cleaned = (reasoningSteps || [])
    .map((step) => (typeof step === "string" ? step.trim() : ""))
    .filter((step) => step.length > 0);

  let filtered = cleaned;
  if (normalizedCategory === "ai") {
    filtered = cleaned.filter((step) => !isAiTokenomicsOnlyStep(step));
  }

  const deduped: string[] = [];
  for (const step of filtered) {
    if (!deduped.some((existing) => existing.toLowerCase() === step.toLowerCase())) {
      deduped.push(step);
    }
  }

  if (deduped.length < 3) {
    for (const fallback of config.fallbackReasoningSteps) {
      if (!deduped.some((existing) => existing.toLowerCase() === fallback.toLowerCase())) {
        deduped.push(fallback);
      }
      if (deduped.length >= 5) break;
    }
  }

  return deduped.slice(0, 7);
}
