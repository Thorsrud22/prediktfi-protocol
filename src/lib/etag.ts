/**
 * ETag generation utility
 * Creates weak ETags for cache validation
 */

import crypto from 'crypto';

/**
 * Generate a weak ETag for the given payload
 * Uses SHA1 hash of JSON stringified payload
 */
export function makeEtag(payload: unknown): string {
  const jsonString = JSON.stringify(payload);
  const hash = crypto.createHash('sha1').update(jsonString).digest('base64url');
  return `W/"${hash}"`;
}

/**
 * Check if an ETag matches another ETag
 * Handles weak ETags by comparing the hash part
 */
export function etagMatches(etag1: string, etag2: string): boolean {
  if (!etag1 || !etag2) return false;
  
  // Extract hash from weak ETags
  const extractHash = (etag: string) => {
    const match = etag.match(/W\/"(.+)"/);
    return match ? match[1] : etag;
  };
  
  return extractHash(etag1) === extractHash(etag2);
}
