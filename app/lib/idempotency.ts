/**
 * Idempotency middleware for API endpoints
 * Ensures that identical requests with the same Idempotency-Key return the same response
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';

const IDEMPOTENCY_TTL_HOURS = 24;

export interface IdempotencyOptions {
  required?: boolean; // Whether Idempotency-Key is required
}

/**
 * Checks for existing idempotent response
 * Returns the cached response if found, null otherwise
 */
export async function checkIdempotency(
  request: NextRequest,
  options: IdempotencyOptions = {}
): Promise<NextResponse | null> {
  const idempotencyKey = request.headers.get('idempotency-key');
  
  // If idempotency key is required but missing
  if (options.required && !idempotencyKey) {
    return NextResponse.json(
      { error: 'Idempotency-Key header required' },
      { status: 400 }
    );
  }
  
  // If no idempotency key provided and not required, skip check
  if (!idempotencyKey) {
    return null;
  }
  
  try {
    // Clean up expired keys first
    await cleanupExpiredKeys();
    
    // Look for existing response
    const existing = await prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey }
    });
    
    if (existing) {
      // Check if expired
      if (existing.expiresAt < new Date()) {
        // Delete expired key
        await prisma.idempotencyKey.delete({
          where: { id: existing.id }
        });
        return null;
      }
      
      // Return cached response
      const cachedResponse = JSON.parse(existing.response);
      return NextResponse.json(cachedResponse.body, {
        status: cachedResponse.status,
        headers: cachedResponse.headers
      });
    }
    
    return null;
  } catch (error) {
    console.error('Idempotency check failed:', error);
    // Don't fail the request, just skip idempotency
    return null;
  }
}

/**
 * Stores response for future idempotent requests
 */
export async function storeIdempotentResponse(
  request: NextRequest,
  response: NextResponse
): Promise<void> {
  const idempotencyKey = request.headers.get('idempotency-key');
  
  if (!idempotencyKey) {
    return;
  }
  
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + IDEMPOTENCY_TTL_HOURS);
    
    // Get response data
    const responseClone = response.clone();
    const body = await responseClone.json().catch(() => ({}));
    
    const cachedResponse = {
      body,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    };
    
    await prisma.idempotencyKey.upsert({
      where: { key: idempotencyKey },
      create: {
        key: idempotencyKey,
        response: JSON.stringify(cachedResponse),
        expiresAt
      },
      update: {
        response: JSON.stringify(cachedResponse),
        expiresAt
      }
    });
  } catch (error) {
    console.error('Failed to store idempotent response:', error);
    // Don't fail the request
  }
}

/**
 * Cleanup expired idempotency keys
 * Called periodically to prevent database bloat
 */
async function cleanupExpiredKeys(): Promise<void> {
  try {
    await prisma.idempotencyKey.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Failed to cleanup expired idempotency keys:', error);
  }
}

/**
 * Wrapper function for easy use in API routes
 */
export async function withIdempotency<T>(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  options: IdempotencyOptions = { required: true }
): Promise<NextResponse> {
  // Check for cached response
  const cachedResponse = await checkIdempotency(request, options);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Execute handler
  const response = await handler();
  
  // Store response for future requests
  if (response.ok) {
    await storeIdempotentResponse(request, response);
  }
  
  return response;
}
