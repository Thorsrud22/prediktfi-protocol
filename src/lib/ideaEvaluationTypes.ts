import { z } from 'zod';

export type DimensionScore = {
  id: string;
  label: string;
  score: number; // 0-100
  comment: string;
};

export type IdeaEvaluationResult = {
  overallVerdict: string;
  successProbability: number; // 0-100
  confidence: number; // 0-100
  dimensionScores: DimensionScore[];
  redFlags: string[];
  recommendedPivots: string[];
  nextSteps: string[];
  riskSummary: string;
};

export const dimensionScoreSchema = z.object({
  id: z.string(),
  label: z.string(),
  score: z.number().min(0).max(100),
  comment: z.string(),
});

export const ideaEvaluationResultSchema = z.object({
  overallVerdict: z.string(),
  successProbability: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  dimensionScores: z.array(dimensionScoreSchema),
  redFlags: z.array(z.string()),
  recommendedPivots: z.array(z.string()),
  nextSteps: z.array(z.string()),
  riskSummary: z.string(),
});
