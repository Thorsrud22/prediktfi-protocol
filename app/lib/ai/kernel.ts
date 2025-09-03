// AI prediction kernel - types and main predict function

export interface PredictInput {
  topic: string;
  question: string;
  horizon: string; // e.g. "24h", "1week", "1month"
  context?: string;
}

export interface PredictOutput {
  prob: number; // 0.0 to 1.0
  drivers: string[]; // max 3 key factors
  rationale: string; // brief explanation
  model: string; // adapter name
  scenarioId: string; // deterministic ID for caching
  ts: string; // ISO timestamp
}

import { mockAdapter } from './adapters/mock';
import { baselineAdapter } from './adapters/baseline-advanced';

export async function predict(input: PredictInput): Promise<PredictOutput> {
  // For v1, use advanced baseline for crypto topics, mock for everything else
  const isCrypto = input.topic.toLowerCase().includes('crypto') || 
                   input.topic.toLowerCase().includes('bitcoin') ||
                   input.topic.toLowerCase().includes('ethereum') ||
                   input.topic.toLowerCase().includes('solana') ||
                   input.question.toLowerCase().includes('btc') ||
                   input.question.toLowerCase().includes('eth') ||
                   input.question.toLowerCase().includes('sol');

  try {
    if (isCrypto) {
      console.log('Using advanced baseline adapter for crypto analysis...');
      return await baselineAdapter(input);
    } else {
      console.log('Using mock adapter for non-crypto analysis...');
      return await mockAdapter(input);
    }
  } catch (error) {
    console.warn('Prediction adapter failed, falling back to mock:', error);
    return await mockAdapter(input);
  }
}
