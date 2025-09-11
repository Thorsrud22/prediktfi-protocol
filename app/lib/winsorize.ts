/**
 * Winsorize utility functions for robust statistics
 * Handles outlier trimming for creator score calculations
 */

/**
 * Winsorize an array of numbers by trimming extreme values
 * @param arr Array of numbers to winsorize
 * @param alpha Fraction to trim from each tail (default 0.05 for 5%)
 * @returns Winsorized array
 */
export function winsorize(arr: number[], alpha: number = 0.05): number[] {
  if (arr.length === 0) return arr;
  if (alpha <= 0 || alpha >= 0.5) return arr;

  const sorted = [...arr].sort((a, b) => a - b);
  const n = sorted.length;
  const trimCount = Math.floor(n * alpha);
  
  if (trimCount === 0) return arr;

  const lowerBound = sorted[trimCount];
  const upperBound = sorted[n - trimCount - 1];

  return arr.map(x => {
    if (x < lowerBound) return lowerBound;
    if (x > upperBound) return upperBound;
    return x;
  });
}

/**
 * Winsorize returns per trading pair
 * @param returns Array of returns with pair information
 * @param alpha Fraction to trim from each tail
 * @returns Winsorized returns grouped by pair
 */
export function winsorizeByPair(
  returns: Array<{ pair: string; return: number }>,
  alpha: number = 0.05
): Array<{ pair: string; return: number }> {
  const pairs = new Map<string, number[]>();
  
  // Group returns by pair
  returns.forEach(({ pair, return: ret }) => {
    if (!pairs.has(pair)) {
      pairs.set(pair, []);
    }
    pairs.get(pair)!.push(ret);
  });

  // Winsorize each pair separately
  const result: Array<{ pair: string; return: number }> = [];
  pairs.forEach((pairReturns, pair) => {
    const winsorized = winsorize(pairReturns, alpha);
    winsorized.forEach(ret => {
      result.push({ pair, return: ret });
    });
  });

  return result;
}

/**
 * Get appropriate alpha value based on sample size
 * @param n Sample size
 * @returns Alpha value (0.10 for n<20, 0.05 otherwise)
 */
export function getAlphaForSampleSize(n: number): number {
  return n < 20 ? 0.10 : 0.05;
}

/**
 * Calculate winsorized mean
 * @param arr Array of numbers
 * @param alpha Fraction to trim
 * @returns Winsorized mean
 */
export function winsorizedMean(arr: number[], alpha: number = 0.05): number {
  if (arr.length === 0) return 0;
  const winsorized = winsorize(arr, alpha);
  return winsorized.reduce((sum, x) => sum + x, 0) / winsorized.length;
}

/**
 * Calculate winsorized standard deviation
 * @param arr Array of numbers
 * @param alpha Fraction to trim
 * @returns Winsorized standard deviation
 */
export function winsorizedStd(arr: number[], alpha: number = 0.05): number {
  if (arr.length === 0) return 0;
  const winsorized = winsorize(arr, alpha);
  const mean = winsorizedMean(winsorized, 0); // No double winsorizing
  const variance = winsorized.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / winsorized.length;
  return Math.sqrt(variance);
}
