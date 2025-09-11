/**
 * Creator Score v1 calculation utilities
 * Implements deterministic scoring system with accuracy, consistency, volume, and recency components
 */

import { winsorize, winsorizedMean, winsorizedStd, getAlphaForSampleSize } from './winsorize';

// Score calculation constants
export const SCORE = {
  W_ACC: 0.45,           // Accuracy weight
  W_CONS: 0.25,          // Consistency weight  
  W_VOL: 0.20,           // Volume weight
  W_REC: 0.10,           // Recency weight
  HALF_LIFE_DAYS: 14,    // Half-life for recency calculation
  VOL_NORM: parseInt(process.env.CREATOR_VOL_NORM || '50000'), // Volume normalization constant (USDC) - env override
  PROVISIONAL_THRESHOLD: 50, // Minimum matured insights for stable score
} as const;

/**
 * Clamp a value between 0 and 1
 */
export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/**
 * Calculate accuracy from Brier score
 * @param brier Brier score (0-1, lower is better)
 * @returns Accuracy score (0-1, higher is better)
 */
export function accuracyFromBrier(brier: number): number {
  return clamp01(1 - brier);
}

/**
 * Calculate consistency from standard deviation of returns
 * @param std Standard deviation of returns
 * @returns Consistency score (0-1, higher is better)
 */
export function consistencyFromStd(std: number): number {
  return clamp01(1 / (1 + std));
}

/**
 * Calculate volume score from notional trading volume
 * @param notional Notional volume in USDC
 * @param norm Normalization constant (default 50000)
 * @returns Volume score (0-1, higher is better)
 */
export function volumeScoreFromNotional(notional: number, norm: number = SCORE.VOL_NORM): number {
  return clamp01(Math.log1p(Math.max(0, notional)) / Math.log1p(norm));
}

/**
 * Calculate recency weights for exponential decay
 * @param days Array of days ago (0 = today, 1 = yesterday, etc.)
 * @param halfLife Half-life in days (default 14)
 * @returns Array of weights (sum should be normalized)
 */
export function recencyWeights(days: number[], halfLife: number = SCORE.HALF_LIFE_DAYS): number[] {
  const k = Math.log(2) / halfLife;
  const weights = days.map(d => Math.exp(-k * d));
  
  // Normalize weights to sum to 1
  const sum = weights.reduce((s, w) => s + w, 0);
  return sum > 0 ? weights.map(w => w / sum) : weights;
}

/**
 * Calculate weighted average with recency weights
 * @param values Array of values to average
 * @param weights Array of weights (should sum to 1)
 * @returns Weighted average
 */
export function weightedAverage(values: number[], weights: number[]): number {
  if (values.length !== weights.length || values.length === 0) return 0;
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (let i = 0; i < values.length; i++) {
    weightedSum += values[i] * weights[i];
    totalWeight += weights[i];
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Calculate Brier score for a set of predictions and outcomes
 * @param predictions Array of predicted probabilities (0-1)
 * @param outcomes Array of actual outcomes (0 or 1)
 * @param winsorizeAlpha Alpha for winsorizing (optional)
 * @returns Brier score (0-1, lower is better)
 */
export function calculateBrierScore(
  predictions: number[], 
  outcomes: number[],
  winsorizeAlpha?: number
): number {
  if (predictions.length !== outcomes.length || predictions.length === 0) return 1;
  
  let brierSum = 0;
  const n = predictions.length;
  
  for (let i = 0; i < n; i++) {
    const p = clamp01(predictions[i]);
    const o = outcomes[i] === 1 ? 1 : 0;
    brierSum += Math.pow(p - o, 2);
  }
  
  return brierSum / n;
}

/**
 * Calculate returns from price data
 * @param prices Array of prices
 * @param side Trading side ('BUY' or 'SELL')
 * @returns Array of returns
 */
export function calculateReturns(prices: number[], side: 'BUY' | 'SELL'): number[] {
  if (prices.length < 2) return [];
  
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prevPrice = prices[i - 1];
    const currPrice = prices[i];
    
    if (prevPrice <= 0 || currPrice <= 0) continue;
    
    let ret: number;
    if (side === 'BUY') {
      ret = (currPrice / prevPrice) - 1;
    } else {
      ret = (prevPrice / currPrice) - 1;
    }
    
    returns.push(ret);
  }
  
  return returns;
}

/**
 * Calculate total creator score from component scores
 * @param accuracy Accuracy score (0-1)
 * @param consistency Consistency score (0-1)
 * @param volumeScore Volume score (0-1)
 * @param recencyScore Recency score (0-1)
 * @returns Total score (0-1)
 */
export function calculateTotalScore(
  accuracy: number,
  consistency: number,
  volumeScore: number,
  recencyScore: number
): number {
  return (
    SCORE.W_ACC * clamp01(accuracy) +
    SCORE.W_CONS * clamp01(consistency) +
    SCORE.W_VOL * clamp01(volumeScore) +
    SCORE.W_REC * clamp01(recencyScore)
  );
}

/**
 * Check if a creator's score should be marked as provisional
 * @param maturedN Number of matured insights
 * @returns True if score should be provisional
 */
export function isProvisional(maturedN: number): boolean {
  return maturedN < SCORE.PROVISIONAL_THRESHOLD;
}

/**
 * Calculate all score components for a creator
 * @param params Score calculation parameters
 * @returns Complete score breakdown
 */
export interface ScoreCalculationParams {
  maturedN: number;
  brierMean: number;
  retStd30d: number | null;
  notional30d: number;
  dailyAccuracy?: number[]; // For recency calculation
  dailyScores?: number[];   // For recency calculation
}

export interface ScoreBreakdown {
  accuracy: number;
  consistency: number;
  volumeScore: number;
  recencyScore: number;
  totalScore: number;
  isProvisional: boolean;
  maturedN: number;
}

export function calculateCreatorScore(params: ScoreCalculationParams): ScoreBreakdown {
  const { maturedN, brierMean, retStd30d, notional30d, dailyAccuracy, dailyScores } = params;
  
  // Calculate component scores
  const accuracy = accuracyFromBrier(brierMean);
  const consistency = retStd30d !== null ? consistencyFromStd(retStd30d) : 0;
  const volumeScore = volumeScoreFromNotional(notional30d);
  
  // Calculate recency score
  let recencyScore = 0;
  if (dailyAccuracy && dailyAccuracy.length > 0) {
    // Use daily accuracy for recency calculation
    const days = dailyAccuracy.map((_, i) => i);
    const weights = recencyWeights(days);
    recencyScore = weightedAverage(dailyAccuracy, weights);
  } else if (dailyScores && dailyScores.length > 0) {
    // Fallback to daily total scores
    const days = dailyScores.map((_, i) => i);
    const weights = recencyWeights(days);
    recencyScore = weightedAverage(dailyScores, weights);
  }
  
  const totalScore = calculateTotalScore(accuracy, consistency, volumeScore, recencyScore);
  const isProvisionalFlag = isProvisional(maturedN);
  
  return {
    accuracy,
    consistency,
    volumeScore,
    recencyScore,
    totalScore,
    isProvisional: isProvisionalFlag,
    maturedN
  };
}

/**
 * Calculate trend direction for score changes
 * Uses locked 7d vs previous 7d definition with 1pp threshold for flat
 * @param currentScore Current 7d period score
 * @param previousScore Previous 7d period score
 * @returns Trend direction
 */
export function calculateTrend(currentScore: number, previousScore: number): 'up' | 'down' | 'flat' {
  const diff = currentScore - previousScore;
  const threshold = 0.01; // 1 percentage point threshold for flat trend
  
  if (Math.abs(diff) < threshold) return 'flat';
  return diff > 0 ? 'up' : 'down';
}

/**
 * Format score for display with appropriate precision
 * @param score Score value (0-1)
 * @param precision Number of decimal places (default 3)
 * @returns Formatted score string
 */
export function formatScore(score: number, precision: number = 3): string {
  return (score * 100).toFixed(precision) + '%';
}
