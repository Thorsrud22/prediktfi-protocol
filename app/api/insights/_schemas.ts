import { z } from 'zod';

// Request schema
export const InsightRequestSchema = z.object({
  question: z.string().min(10).max(200),
  category: z.string().min(1).max(50),
  horizon: z.string().datetime(), // ISO date string
  analysisType: z.enum(['basic', 'advanced']).optional().default('basic'),
});

export type InsightRequest = z.infer<typeof InsightRequestSchema>;

// Response schema types
export interface InsightResponse {
  probability: number; // 0 to 1
  confidence: number; // 0 to 1
  interval: {
    lower: number;
    upper: number;
  };
  rationale: string;
  scenarios: Array<{
    label: string;
    probability: number;
    drivers: string[];
  }>;
  sources: Array<{
    name: string;
    url: string;
  }>;
  metrics: {
    rsi?: number;
    sma20?: number;
    sma50?: number;
    ema12?: number;
    ema26?: number;
    atr?: number;
    trend: 'up' | 'down' | 'neutral';
    sentiment: number; // -1 to 1
    support?: number;
    resistance?: number;
  };
  tookMs: number;
}

// Internal pipeline types
export interface MarketData {
  symbol: string;
  prices: number[];
  volumes: number[];
  timestamps: number[];
}

export interface NewsData {
  title: string;
  score: number; // -1 to 1
  url?: string;
}

export interface IndicatorResults {
  rsi: number;
  sma20: number;
  sma50: number;
  ema12: number;
  ema26: number;
  atr: number;
  support: number;
  resistance: number;
  trend: 'up' | 'down' | 'neutral';
  strength: number; // 0 to 1
}

export interface PipelineContext {
  request: InsightRequest;
  marketData: MarketData[];
  newsData: NewsData[];
  indicators: IndicatorResults;
  sentiment: number;
  dataQuality: number; // 0 to 1
}
