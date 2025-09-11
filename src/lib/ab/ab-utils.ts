/**
 * A/B Testing Utilities
 * Provides stable bucket assignment for different experiments
 */

import crypto from 'crypto';

export type ABBucket = 'A' | 'B';

/**
 * Get stable A/B bucket for a session and experiment
 * Uses hash(experimentKey + sessionId) % 2 to ensure consistent assignment
 */
export function getBucket(sessionId: string, experimentKey?: string): ABBucket {
  if (!sessionId) {
    // Fallback to B if no session ID (shouldn't happen in practice)
    return 'B';
  }

  const key = experimentKey ? `${experimentKey}:${sessionId}` : sessionId;
  
  // Create hash of key
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  
  // Use last character to determine bucket (0-9, a-f)
  const lastChar = hash.slice(-1);
  const numericValue = parseInt(lastChar, 16);
  
  // Even = A, Odd = B
  return numericValue % 2 === 0 ? 'A' : 'B';
}

/**
 * Get bucket for specific experiment
 */
export function getExperimentBucket(sessionId: string, experimentKey: string): ABBucket {
  return getBucket(sessionId, experimentKey);
}

/**
 * Validate that a bucket assignment is valid
 */
export function isValidBucket(bucket: string): bucket is ABBucket {
  return bucket === 'A' || bucket === 'B';
}

/**
 * Get bucket distribution for analytics
 */
export function getBucketDistribution(): { bucketA: number; bucketB: number } {
  return {
    bucketA: 50.0,
    bucketB: 50.0
  };
}
