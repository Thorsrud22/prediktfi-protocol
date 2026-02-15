export type ProjectDomain =
  | "crypto_defi"
  | "memecoin"
  | "ai_ml"
  | "saas"
  | "consumer"
  | "hardware"
  | "other";

export type DomainConfidence = "high" | "medium" | "low";

export interface DomainClassification {
  domain: ProjectDomain;
  confidence: DomainConfidence;
  matchedSignals: string[];
  usedProjectTypeHint: boolean;
}

const DOMAIN_KEYWORDS: Record<ProjectDomain, string[]> = {
  crypto_defi: [
    "blockchain",
    "defi",
    "smart contract",
    "liquidity",
    "liquidity pool",
    "dex",
    "staking",
    "yield",
    "on-chain",
    "onchain",
    "tvl",
    "protocol",
    "amm",
    "governance token",
    "bridge",
    "wallet",
  ],
  memecoin: [
    "meme",
    "memecoin",
    "degen",
    "pump",
    "community token",
    "fair launch",
    "bonding curve",
    "ticker",
    "viral token",
    "to the moon",
    "shitcoin",
  ],
  ai_ml: [
    "ai",
    "machine learning",
    "ml",
    "llm",
    "model",
    "training",
    "inference",
    "fine-tune",
    "finetune",
    "embedding",
    "rag",
    "transformer",
    "dataset",
    "gpu",
  ],
  saas: [
    "saas",
    "subscription",
    "mrr",
    "arr",
    "churn",
    "b2b",
    "enterprise",
    "seat-based",
    "per-seat",
    "per user",
    "crm",
    "onboarding",
    "workflow software",
  ],
  consumer: [
    "consumer",
    "social",
    "creator",
    "influencer",
    "marketplace",
    "mobile app",
    "viral loop",
    "retention",
    "nft",
    "gaming",
    "game",
    "community",
    "collectors",
  ],
  hardware: [
    "hardware",
    "device",
    "sensor",
    "chip",
    "manufacturing",
    "factory",
    "firmware",
    "iot",
    "pcb",
    "bom",
    "supply chain",
    "robotics",
  ],
  other: [],
};

const PROJECT_TYPE_TO_DOMAIN: Record<string, ProjectDomain> = {
  defi: "crypto_defi",
  memecoin: "memecoin",
  ai: "ai_ml",
  nft: "consumer",
  gaming: "consumer",
  saas: "saas",
  consumer: "consumer",
  hardware: "hardware",
  other: "other",
};

const ALL_DOMAINS: ProjectDomain[] = [
  "crypto_defi",
  "memecoin",
  "ai_ml",
  "saas",
  "consumer",
  "hardware",
  "other",
];

function hasKeyword(text: string, keyword: string): boolean {
  if (keyword.includes(" ")) {
    return text.includes(keyword);
  }
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escaped}\\b`, "i");
  return pattern.test(text);
}

export function mapProjectTypeHintToDomain(projectTypeHint?: string | null): ProjectDomain {
  const normalized = (projectTypeHint || "").trim().toLowerCase();
  return PROJECT_TYPE_TO_DOMAIN[normalized] || "other";
}

export function mapDomainToRubricProfile(
  domain: ProjectDomain
): "defi" | "memecoin" | "ai" | "saas" | "consumer" | "generic" {
  if (domain === "crypto_defi") return "defi";
  if (domain === "memecoin") return "memecoin";
  if (domain === "ai_ml") return "ai";
  if (domain === "saas") return "saas";
  if (domain === "consumer") return "consumer";
  return "generic";
}

export function classifyDomain(
  ideaText: string,
  projectTypeHint?: string | null
): DomainClassification {
  const text = (ideaText || "").toLowerCase();
  const hintedDomain = mapProjectTypeHintToDomain(projectTypeHint);

  const scores: Record<ProjectDomain, number> = {
    crypto_defi: 0,
    memecoin: 0,
    ai_ml: 0,
    saas: 0,
    consumer: 0,
    hardware: 0,
    other: 0,
  };
  const matchedByDomain: Record<ProjectDomain, string[]> = {
    crypto_defi: [],
    memecoin: [],
    ai_ml: [],
    saas: [],
    consumer: [],
    hardware: [],
    other: [],
  };

  if (hintedDomain !== "other") {
    scores[hintedDomain] += 3;
  }

  for (const domain of ALL_DOMAINS) {
    if (domain === "other") continue;
    for (const keyword of DOMAIN_KEYWORDS[domain]) {
      if (!hasKeyword(text, keyword)) continue;
      const increment = hintedDomain === domain ? 1.2 : 1;
      scores[domain] += increment;
      matchedByDomain[domain].push(keyword);
    }
  }

  // Memecoin should win over generic DeFi when both appear and meme signals are present.
  if (scores.memecoin >= 2 && scores.crypto_defi > 0) {
    scores.memecoin += 0.75;
  }

  const ranked = (ALL_DOMAINS.filter((domain) => domain !== "other") as ProjectDomain[])
    .map((domain) => ({ domain, score: scores[domain] }))
    .sort((left, right) => right.score - left.score);

  const top = ranked[0];
  const second = ranked[1];

  if (!top || top.score < 1.5) {
    return {
      domain: hintedDomain === "other" ? "other" : hintedDomain,
      confidence: hintedDomain === "other" ? "low" : "medium",
      matchedSignals: hintedDomain === "other" ? [] : [`projectType:${projectTypeHint}`],
      usedProjectTypeHint: hintedDomain !== "other",
    };
  }

  const margin = top.score - (second?.score || 0);
  let confidence: DomainConfidence = "low";
  if (top.score >= 5 && margin >= 1.5) confidence = "high";
  else if (top.score >= 3 && margin >= 0.75) confidence = "medium";

  return {
    domain: top.domain,
    confidence,
    matchedSignals: matchedByDomain[top.domain].slice(0, 8),
    usedProjectTypeHint: hintedDomain !== "other",
  };
}
