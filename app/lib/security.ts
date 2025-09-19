/**
 * Security utilities for CSRF protection and input validation
 */

import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * CSRF Protection
 */
export function validateCSRF(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  
  // Allow same-origin requests
  if (origin && host && origin.includes(host)) {
    return true;
  }
  
  // Allow referer from same domain
  if (referer && host && referer.includes(host)) {
    return true;
  }
  
  // In development, be more permissive
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  return false;
}

/**
 * Input validation schemas
 */
interface ValidationRule {
  type: 'string' | 'boolean' | 'object';
  maxLength?: number;
  required: boolean;
  enum?: string[];
  pattern?: RegExp;
}

type ValidationSchema = Record<string, ValidationRule>;

export const AlertRuleSchema: ValidationSchema = {
  name: { type: 'string', maxLength: 100, required: true },
  ruleJson: { type: 'object', required: true },
  target: { type: 'string', maxLength: 500, required: false },
  enabled: { type: 'boolean', required: false }
};

export const StrategySchema: ValidationSchema = {
  name: { type: 'string', maxLength: 100, required: true },
  kind: { type: 'string', enum: ['risk', 'rebalance', 'momentum'], required: true },
  enabled: { type: 'boolean', required: false }
};

export const WalletSchema: ValidationSchema = {
  address: { type: 'string', pattern: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, required: true },
  chain: { type: 'string', enum: ['solana'], required: true }
};

/**
 * Validate input against schema
 */
export function validateInput(data: any, schema: ValidationSchema): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const [field, rules] of Object.entries(schema) as [string, ValidationRule][]) {
    const value = data[field];
    
    // Check required fields
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`${field} is required`);
      continue;
    }
    
    // Skip validation for optional fields that are not present
    if (!rules.required && (value === undefined || value === null)) {
      continue;
    }
    
    // Type validation
    if (rules.type === 'string' && typeof value !== 'string') {
      errors.push(`${field} must be a string`);
    } else if (rules.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`${field} must be a boolean`);
    } else if (rules.type === 'object' && typeof value !== 'object') {
      errors.push(`${field} must be an object`);
    }
    
    // String length validation
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must be no more than ${rules.maxLength} characters`);
      }
    }
    
    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
    }
    
    // Pattern validation
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors.push(`${field} format is invalid`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Generate HMAC signature for webhook payloads
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifyWebhookSignature(
  payload: string, 
  signature: string, 
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Validate webhook URL
 */
export function validateWebhookURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}
