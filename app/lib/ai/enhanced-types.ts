// Enhanced AI Analysis Types
export interface DataSource {
  name: string;
  freshness: number; // minutes since last update
  quality: number; // 0-1 confidence in data quality
  url?: string;
}

export interface TechnicalAnalysis {
  price: number;
  volume24h: number;
  change24h: number;
  change7d: number;
  change30d: number;
  volatility: number;
  support: number | null;
  resistance: number | null;
  trend: 'bullish' | 'bearish' | 'neutral';
  rsi: number | null;
  movingAverages: {
    ma7: number | null;
    ma30: number | null;
    ma200: number | null;
  };
}

export interface SentimentAnalysis {
  fearGreedIndex: number | null; // 0-100
  newsScore: number | null; // -1 to 1
  socialScore: number | null; // -1 to 1
  overallSentiment: 'fear' | 'greed' | 'neutral';
}

export interface FundamentalAnalysis {
  marketCap: number | null;
  volume24h: number;
  circulatingSupply: number | null;
  maxSupply: number | null;
  dominance: number | null; // market dominance %
  correlationBTC: number | null; // -1 to 1
}

export interface RiskFactor {
  type: 'technical' | 'fundamental' | 'regulatory' | 'market';
  description: string;
  impact: 'high' | 'medium' | 'low';
  likelihood: number; // 0-1
}

export interface Scenario {
  name: 'optimistic' | 'likely' | 'pessimistic';
  probability: number;
  description: string;
  targetPrice?: number;
  timeframe: string;
  keyFactors: string[];
}

export interface AdvancedAnalysis {
  // Core prediction
  probability: number;
  confidence: number; // 0-1, how sure we are
  
  // Multi-scenario analysis
  scenarios: Scenario[];
  
  // Evidence and reasoning
  technical: TechnicalAnalysis;
  sentiment: SentimentAnalysis;
  fundamental: FundamentalAnalysis;
  
  // Risk assessment
  risks: RiskFactor[];
  
  // Data sources used
  dataSources: DataSource[];
  
  // Transparency
  methodology: string;
  processingTimeMs: number;
  dataQuality: number; // 0-1 overall data quality
}

export interface EnhancedPredictOutput {
  // Original fields
  prob: number;
  drivers: string[];
  rationale: string;
  model: string;
  scenarioId: string;
  ts: string;
  
  // Enhanced fields
  analysis?: AdvancedAnalysis;
  confidence?: number;
  processingTime?: number; // seconds
}
