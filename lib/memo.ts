/**
 * Memo payload generation for Solana blockchain stamping
 * Hash: sha256(`${canonical}|${deadlineISO}|${resolverRef}`)
 * Memo payload (≤180 bytes): { t:'predikt.v1', pid, h, d, w }
 */

import crypto from 'crypto';

export interface MemoPayload {
  t: 'predikt.v1';  // Type identifier
  pid: string;      // Prediction ID
  h: string;        // Hash (full 64-char hex)
  d: string;        // Deadline ISO (date only)
  // Note: Wallet verification done via transaction fee payer, not stored in memo
}

/**
 * Generate stable hash for prediction
 */
export function generatePredictionHash(
  canonical: string,
  deadlineISO: string,
  resolverRef: string
): string {
  const input = `${canonical}|${deadlineISO}|${resolverRef}`;
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Create memo payload for Solana transaction
 */
export function createMemoPayload(
  predictionId: string,
  canonical: string,
  deadline: Date,
  resolverRef: string
): MemoPayload {
  const deadlineISO = deadline.toISOString();
  const fullHash = generatePredictionHash(canonical, deadlineISO, resolverRef);
  
  const payload: MemoPayload = {
    t: 'predikt.v1',
    pid: predictionId,
    h: fullHash, // Full 64-char hash for strong verification
    d: deadlineISO.split('T')[0]  // Date only (YYYY-MM-DD)
  };
  
  return payload;
}

/**
 * Serialize memo payload to JSON string
 */
export function serializeMemoPayload(payload: MemoPayload): string {
  return JSON.stringify(payload);
}

/**
 * Parse memo payload from JSON string
 */
export function parseMemoPayload(memoJson: string): MemoPayload | null {
  try {
    const parsed = JSON.parse(memoJson);
    
    // Validate structure
    if (
      parsed.t === 'predikt.v1' &&
      typeof parsed.pid === 'string' &&
      typeof parsed.h === 'string' &&
      typeof parsed.d === 'string'
    ) {
      return parsed as MemoPayload;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Validate memo payload size (must be ≤180 bytes)
 */
export function validateMemoSize(payload: MemoPayload): boolean {
  const serialized = serializeMemoPayload(payload);
  const sizeInBytes = Buffer.byteLength(serialized, 'utf8');
  return sizeInBytes <= 180;
}

/**
 * Get memo payload size in bytes
 */
export function getMemoSize(payload: MemoPayload): number {
  const serialized = serializeMemoPayload(payload);
  return Buffer.byteLength(serialized, 'utf8');
}

/**
 * Verify prediction hash matches canonical components
 */
export function verifyPredictionHash(
  hash: string,
  canonical: string,
  deadlineISO: string,
  resolverRef: string
): boolean {
  const expectedHash = generatePredictionHash(canonical, deadlineISO, resolverRef);
  return hash === expectedHash;
}

/**
 * Generate memo for Solana transaction
 */
export function generateSolanaMemo(
  predictionId: string,
  canonical: string,
  deadline: Date,
  resolverRef: string
): {
  payload: MemoPayload;
  serialized: string;
  hash: string;
  size: number;
} {
  const payload = createMemoPayload(
    predictionId,
    canonical,
    deadline,
    resolverRef
  );
  
  const serialized = serializeMemoPayload(payload);
  const fullHash = generatePredictionHash(canonical, deadline.toISOString(), resolverRef);
  const size = getMemoSize(payload);
  
  // Validate size constraint
  if (size > 180) {
    throw new Error(`Memo payload too large: ${size} bytes (max 180)`);
  }
  
  return {
    payload,
    serialized,
    hash: fullHash,
    size
  };
}

/**
 * Extract prediction components from memo
 */
export function extractPredictionFromMemo(memoJson: string): {
  predictionId: string;
  hash: string;
  deadline: string;
} | null {
  const payload = parseMemoPayload(memoJson);
  if (!payload) return null;
  
  return {
    predictionId: payload.pid,
    hash: payload.h,
    deadline: payload.d
  };
}

/**
 * Create deterministic hash for testing
 */
export function createTestHash(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Normalize hash input for consistency
 */
export function normalizeHashInput(
  canonical: string,
  deadlineISO: string,
  resolverRef: string
): string {
  // Ensure consistent formatting
  const normalizedCanonical = canonical.trim();
  const normalizedDeadline = deadlineISO.trim();
  const normalizedResolver = resolverRef.trim();
  
  return `${normalizedCanonical}|${normalizedDeadline}|${normalizedResolver}`;
}
