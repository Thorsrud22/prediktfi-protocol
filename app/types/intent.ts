export interface TradingIntentDraft {
  id?: string;
  predictionId?: string;
  prediction?: string;
  reasoning?: string;
  confidence?: number;
  timeframe?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  position?: 'bullish' | 'bearish' | 'neutral';
  targetPrice?: number;
  stopLoss?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TradingIntent extends TradingIntentDraft {
  id: string;
  userId: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisData {
  prediction: string;
  reasoning: string;
  confidence: number;
  timeframe: string;
  riskLevel: 'low' | 'medium' | 'high';
  position: 'bullish' | 'bearish' | 'neutral';
  targetPrice?: number;
  stopLoss?: number;
}
