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
import { baselineAdapter } from './adapters/baseline';

export async function predict(input: PredictInput): Promise<PredictOutput> {
  try {
    // For v1, use mock adapter for all topics to ensure reliability
    // Baseline adapter with external API calls disabled for now
    console.log('Using mock adapter for analysis...');
    return await mockAdapter(input);
  } catch (error) {
    console.error('Prediction failed:', error);
    // Final fallback - should not happen with mock adapter
    throw new Error('AI prediction service temporarily unavailable');
  }
}
