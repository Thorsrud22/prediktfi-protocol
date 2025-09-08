/**
 * Model Calibration and Brier Score Calculations
 * Implements matured-only analysis with winsorization and binning
 */

// Configuration constants - can be adjusted later
export const CALIBRATION_CONFIG = {
  BRIER_GOOD: 0.18,
  BRIER_FAIR: 0.22,
  MATURED_MIN_N: 50,
  BINS_MIN_N: 20,
  WINSOR_P: 0.05,
  WINSOR_P_SMALL: 0.10, // for n < 20
  DEFAULT_EXPECTED_DURATION_DAYS: 30,
  EPSILON: 1e-8, // Protect std calculation
} as const;

export type CalibrationStatus = 'Good' | 'Fair' | 'Poor';

export interface CalibrationBin {
  /** Average predicted probability in this bin */
  p: number;
  /** Actual hit rate (0-1) */
  hit_rate: number;
  /** Number of observations in bin */
  n: number;
}

export interface CalibrationResult {
  status: CalibrationStatus;
  bins: CalibrationBin[];
  brier_score: number;
  matured_n: number;
  matured_coverage: number;
  calibrationNote?: string;
}

export interface TradingRecord {
  confidence: number;
  actual_return: number;
  is_profitable: boolean;
  trading_pair: string;
  matured: boolean;
}

/**
 * Calculate Brier score for probability predictions
 */
export function calculateBrierScore(predictions: { confidence: number; outcome: boolean }[]): number {
  if (predictions.length === 0) return 0;
  
  const sum = predictions.reduce((acc, pred) => {
    return acc + Math.pow(pred.confidence - (pred.outcome ? 1 : 0), 2);
  }, 0);
  
  return sum / predictions.length;
}

/**
 * Determine calibration status based on Brier score
 */
export function getCalibrationStatus(brierScore: number): CalibrationStatus {
  if (brierScore <= CALIBRATION_CONFIG.BRIER_GOOD) return 'Good';
  if (brierScore <= CALIBRATION_CONFIG.BRIER_FAIR) return 'Fair';
  return 'Poor';
}

/**
 * Winsorize returns by trading pair to handle outliers
 */
export function winsorizeReturns(records: TradingRecord[]): TradingRecord[] {
  // Group by trading pair
  const byPair = new Map<string, TradingRecord[]>();
  
  for (const record of records) {
    const existing = byPair.get(record.trading_pair) || [];
    existing.push(record);
    byPair.set(record.trading_pair, existing);
  }
  
  // Winsorize each pair separately
  const winsorizedRecords: TradingRecord[] = [];
  
  for (const [pair, pairRecords] of byPair) {
    const returns = pairRecords.map(r => r.actual_return).sort((a, b) => a - b);
    const n = returns.length;
    
    if (n === 0) continue;
    
    // Choose winsorization percentile based on sample size
    const p = n < 20 ? CALIBRATION_CONFIG.WINSOR_P_SMALL : CALIBRATION_CONFIG.WINSOR_P;
    
    // Calculate percentile indices
    const lowerIdx = Math.floor(n * p);
    const upperIdx = Math.ceil(n * (1 - p)) - 1;
    
    const lowerBound = returns[Math.max(0, lowerIdx)];
    const upperBound = returns[Math.min(n - 1, upperIdx)];
    
    // Apply winsorization
    for (const record of pairRecords) {
      const winsorizedReturn = Math.max(lowerBound, Math.min(upperBound, record.actual_return));
      
      winsorizedRecords.push({
        ...record,
        actual_return: winsorizedReturn,
        is_profitable: winsorizedReturn > 0
      });
    }
  }
  
  return winsorizedRecords;
}

/**
 * Create calibration bins from trading records
 */
export function createCalibrationBins(records: TradingRecord[]): CalibrationBin[] {
  if (records.length < CALIBRATION_CONFIG.BINS_MIN_N) {
    return []; // Not enough data for reliable binning
  }
  
  // Sort by confidence to create deciles
  const sortedRecords = [...records].sort((a, b) => a.confidence - b.confidence);
  const n = sortedRecords.length;
  
  // Create 10 decile bins initially
  const rawBins: CalibrationBin[] = [];
  const binSize = Math.floor(n / 10);
  
  for (let i = 0; i < 10; i++) {
    const startIdx = i * binSize;
    const endIdx = i === 9 ? n : (i + 1) * binSize; // Last bin gets remainder
    
    const binRecords = sortedRecords.slice(startIdx, endIdx);
    
    if (binRecords.length === 0) continue;
    
    const avgConfidence = binRecords.reduce((sum, r) => sum + r.confidence, 0) / binRecords.length;
    const hitRate = binRecords.filter(r => r.is_profitable).length / binRecords.length;
    
    rawBins.push({
      p: Math.round(avgConfidence * 100) / 100, // Round to 2 decimals
      hit_rate: Math.round(hitRate * 100) / 100,
      n: binRecords.length
    });
  }
  
  // Merge bins with n < 3 into adjacent bins
  const mergedBins: CalibrationBin[] = [];
  let i = 0;
  
  while (i < rawBins.length) {
    let currentBin = rawBins[i];
    
    // Check if we need to merge with next bins
    let j = i + 1;
    while (j < rawBins.length && (currentBin.n < 3 || rawBins[j].n < 3)) {
      const nextBin = rawBins[j];
      
      // Merge bins
      const totalN = currentBin.n + nextBin.n;
      const weightedP = (currentBin.p * currentBin.n + nextBin.p * nextBin.n) / totalN;
      const weightedHitRate = (currentBin.hit_rate * currentBin.n + nextBin.hit_rate * nextBin.n) / totalN;
      
      currentBin = {
        p: Math.round(weightedP * 100) / 100,
        hit_rate: Math.round(weightedHitRate * 100) / 100,
        n: totalN
      };
      
      j++;
    }
    
    mergedBins.push(currentBin);
    i = j;
  }
  
  return mergedBins;
}

/**
 * Calculate comprehensive calibration analysis
 */
export function calculateCalibration(
  records: TradingRecord[],
  totalSampleSize: number
): CalibrationResult {
  // Filter to matured records only
  const maturedRecords = records.filter(r => r.matured);
  const maturedN = maturedRecords.length;
  const maturedCoverage = totalSampleSize > 0 ? maturedN / totalSampleSize : 0;
  
  // Winsorize returns
  const winsorizedRecords = winsorizeReturns(maturedRecords);
  
  // Calculate Brier score
  const brierPredictions = winsorizedRecords.map(r => ({
    confidence: r.confidence,
    outcome: r.is_profitable
  }));
  
  const brierScore = calculateBrierScore(brierPredictions);
  const status = getCalibrationStatus(brierScore);
  
  // Create bins if we have enough data
  const bins = maturedN >= CALIBRATION_CONFIG.BINS_MIN_N 
    ? createCalibrationBins(winsorizedRecords)
    : [];
  
  // Determine calibration note
  let calibrationNote: string | undefined;
  if (winsorizedRecords.some(r => !r.matured)) {
    calibrationNote = "standard_horizon";
  }
  
  return {
    status,
    bins,
    brier_score: Math.round(brierScore * 1000) / 1000, // Round to 3 decimals
    matured_n: maturedN,
    matured_coverage: Math.round(maturedCoverage * 100) / 100,
    calibrationNote
  };
}

/**
 * Check if we have sufficient data to show calibration
 */
export function hasSufficientCalibrationData(maturedN: number): boolean {
  return maturedN >= CALIBRATION_CONFIG.MATURED_MIN_N;
}
