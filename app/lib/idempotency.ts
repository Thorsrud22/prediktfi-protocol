/**
 * Idempotency management for trading operations
 * Prevents duplicate executions using Redis or in-memory cache
 */

import { prisma } from './prisma';

interface IdempotencyRecord {
  key: string;
  result: any;
  expiresAt: Date;
}

// In-memory cache for development (use Redis in production)
const idempotencyCache = new Map<string, IdempotencyRecord>();

/**
 * Generate idempotency key for create operations
 */
export function generateCreateKey(
  walletId: string,
  base: string,
  quote: string,
  side: string,
  sizeValue: number,
  timestamp: number
): string {
  const keyData = `${walletId}:${base}:${quote}:${side}:${sizeValue}:${timestamp}`;
  return Buffer.from(keyData).toString('base64');
}

/**
 * Generate idempotency key for execute operations
 */
export function generateExecuteKey(
  intentId: string,
  timestamp: number
): string {
  const keyData = `execute:${intentId}:${timestamp}`;
  return Buffer.from(keyData).toString('base64');
}

/**
 * Check if operation is idempotent
 */
export async function checkIdempotency(
  key: string,
  operation: string
): Promise<{ isIdempotent: boolean; result?: any }> {
  try {
    // Check in-memory cache first
    const cached = idempotencyCache.get(key);
    if (cached && cached.expiresAt > new Date()) {
      return { isIdempotent: true, result: cached.result };
    }
    
    // Check database for persistent storage
    const record = await prisma.intentReceipt.findFirst({
      where: {
        notes: key // Using notes field to store idempotency key
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (record) {
      // Cache the result
      idempotencyCache.set(key, {
        key,
        result: record,
        expiresAt: new Date(Date.now() + 60 * 1000) // 1 minute TTL
      });
      
      return { isIdempotent: true, result: record };
    }
    
    return { isIdempotent: false };
  } catch (error) {
    console.error('Idempotency check failed:', error);
    return { isIdempotent: false };
  }
}

/**
 * Store idempotency result
 */
export async function storeIdempotencyResult(
  key: string,
  result: any,
  ttlSeconds: number = 60
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    
    // Store in memory cache
    idempotencyCache.set(key, {
      key,
      result,
      expiresAt
    });
    
    // Clean up expired entries periodically
    if (Math.random() < 0.1) { // 10% chance to cleanup
      cleanupExpiredEntries();
    }
  } catch (error) {
    console.error('Failed to store idempotency result:', error);
  }
}

/**
 * Clean up expired cache entries
 */
function cleanupExpiredEntries(): void {
  const now = new Date();
  for (const [key, record] of idempotencyCache.entries()) {
    if (record.expiresAt <= now) {
      idempotencyCache.delete(key);
    }
  }
}

/**
 * Validate idempotency key format
 */
export function validateIdempotencyKey(key: string): boolean {
  try {
    // Check if it's a valid base64 string
    Buffer.from(key, 'base64').toString('utf-8');
    return key.length >= 10 && key.length <= 200;
  } catch {
    return false;
  }
}

/**
 * Extract timestamp from idempotency key
 */
export function extractTimestampFromKey(key: string): number | null {
  try {
    const decoded = Buffer.from(key, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    const timestamp = parseInt(parts[parts.length - 1]);
    return isNaN(timestamp) ? null : timestamp;
  } catch {
    return null;
  }
}

/**
 * Check if key is expired based on timestamp
 */
export function isKeyExpired(key: string, maxAgeSeconds: number = 300): boolean {
  const timestamp = extractTimestampFromKey(key);
  if (!timestamp) return true;
  
  const age = Date.now() - timestamp;
  return age > maxAgeSeconds * 1000;
}

/**
 * Higher-order function for idempotency
 */
export async function withIdempotency<T>(
  request: Request,
  handler: () => Promise<T>,
  options: { required?: boolean } = {}
): Promise<T> {
  const idempotencyKey = request.headers.get('idempotency-key');
  
  if (!idempotencyKey) {
    if (options.required) {
      throw new Error('Idempotency key required');
    }
    return await handler();
  }
  
  // Check if we've already processed this request
  const check = await checkIdempotency(idempotencyKey, 'api');
  if (check.isIdempotent && check.result) {
    return check.result;
  }
  
  // Execute the handler
  const result = await handler();
  
  // Store the result for future idempotency checks
  await storeIdempotencyResult(idempotencyKey, result, 300); // 5 minutes TTL
  
  return result;
}