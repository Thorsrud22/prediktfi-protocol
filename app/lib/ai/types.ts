export type InsightInput = {
  topic: string;
  question: string;
  horizon: string;
  scenarioId?: string;
  drivers?: string[];
  rationale?: string;
};

export type InsightErrorCode = 
  | "INVALID_SIGNATURE"
  | "NOT_FOUND"
  | "NOT_CONFIRMED"
  | "NO_MEMO"
  | "INVALID_MEMO"
  | "NOT_PREDIKT_INSIGHT"
  | "NETWORK_ERROR";

export type Insight = {
  kind: "insight";
  topic: string;
  question: string;
  horizon: string;
  prob: number;
  drivers: string[];
  rationale: string;
  model: string;
  scenarioId: string;
  ts: string;
  signature?: string;
  ref?: string;
  creatorId?: string;
};

export type PredictResponse = {
  prob: number;
  drivers: string[];
  rationale: string;
  model: string;
  scenarioId: string;
  ts: string;
};

export const TOPICS = [
  { value: "crypto", label: "Crypto" },
  { value: "politics", label: "Politics" },
  { value: "sports", label: "Sports" },
  { value: "custom", label: "Custom" },
] as const;

export const HORIZONS = [
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "1m", label: "1 month" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
] as const;
