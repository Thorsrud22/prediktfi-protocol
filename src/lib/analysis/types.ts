// Type definitions for the analysis engine

export type Horizon = '24h' | '7d' | '30d';

export interface Candle {
  t: number; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

export interface PriceSeries {
  assetId: string;
  vsCurrency: string;
  candles: Candle[];
  source: string;
  fetchedAt: number;
  quality: number; // 0 to 1
}

export interface TechnicalSummary {
  rsi: number;
  sma: number;
  ema: number;
  atr: number;
  trend: 'up' | 'down' | 'sideways';
  support: number[];
  resistance: number[];
  signals: {
    maCross: 'golden' | 'death' | 'none';
  };
}

export interface SentimentSummary {
  fngNow: number;
  fngPrev: number;
  regime: 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';
  quality: number; // 0 to 1
}

export interface RiskItem {
  name: string;
  impact: number;
  likelihood: number;
  note: string;
}

export interface RiskSummary {
  items: RiskItem[];
  total: number; // 0 to 1
}

export interface Scenario {
  label: 'bear' | 'base' | 'bull';
  probability: number; // 0 to 1
  target: number;
  narrative: string;
}

export interface AnalysisInput {
  assetId: string;
  vsCurrency: string;
  horizon: Horizon;
}

export interface AnalysisOutput {
  probability: number; // 0 to 1
  confidence: number; // 0 to 1
  interval: {
    low: number;
    high: number;
  };
  technical: TechnicalSummary;
  sentiment: SentimentSummary;
  risk: RiskSummary;
  scenarios: Scenario[];
  drivers: string[];
  meta: {
    ms: number;
    fetchedAt: number;
    sources: string[];
  };
}
