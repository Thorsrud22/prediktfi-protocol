export type EvidenceSource =
  | "tavily"
  | "defillama"
  | "dexscreener"
  | "coingecko"
  | "birdeye"
  | "system";

export type EvidenceReliabilityTier = "high" | "medium" | "low";

export interface EvidenceItem {
  id: string;
  source: EvidenceSource;
  url?: string;
  title: string;
  snippet: string;
  fetchedAt: string;
  reliabilityTier: EvidenceReliabilityTier;
}

export interface EvidenceClaim {
  text: string;
  evidenceIds: string[];
  claimType: "fact" | "inference";
  support?: "corroborated" | "uncorroborated";
}

export interface EvidencePack {
  evidence: EvidenceItem[];
  unavailableSources?: string[];
  generatedAt: string;
}
