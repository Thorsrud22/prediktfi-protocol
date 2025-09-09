/**
 * A/B Testing Utilities
 * Provides stable bucket assignment based on session ID hashing
 */

import crypto from 'crypto';

export type ABBucket = 'A' | 'B';

/**
 * Get stable A/B bucket for a session
 * Uses hash(sessionId) % 2 to ensure consistent assignment
 */
export function getBucket(sessionId: string): ABBucket {
  if (!sessionId) {
    // Fallback to B if no session ID (shouldn't happen in practice)
    return 'B';
  }

  // Create hash of session ID
  const hash = crypto.createHash('sha256').update(sessionId).digest('hex');
  
  // Use last character to determine bucket (0-9, a-f)
  const lastChar = hash.slice(-1);
  const numericValue = parseInt(lastChar, 16);
  
  // Even = A, Odd = B
  return numericValue % 2 === 0 ? 'A' : 'B';
}

/**
 * Get bucket distribution for analytics
 * Returns approximate percentage of sessions in each bucket
 */
export function getBucketDistribution(): { bucketA: number; bucketB: number } {
  // This is a theoretical distribution - in practice it should be ~50/50
  // due to the hash function's uniform distribution properties
  return {
    bucketA: 50.0,
    bucketB: 50.0
  };
}

/**
 * Validate that a bucket assignment is valid
 */
export function isValidBucket(bucket: string): bucket is ABBucket {
  return bucket === 'A' || bucket === 'B';
}
