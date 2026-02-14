/**
 * URL validation and sanitization utilities
 * Handles special characters, encoding, and edge cases for creator handles and URLs
 */

export interface ValidationResult {
  isValid: boolean;
  sanitized?: string;
  error?: string;
}

const MAX_HANDLE_LENGTH = 64;
const MIN_SOLANA_SIGNATURE_LENGTH = 43;
const MAX_SOLANA_SIGNATURE_LENGTH = 88;
const MAX_URL_PARAM_LENGTH = 1000;
const DEFAULT_DISPLAY_MAX_LENGTH = 100;
const ELLIPSIS_LENGTH = 3;
const SAFE_ETAG_PATTERN = /[^a-zA-Z0-9._-]/g;
const SOLANA_BASE58_PATTERN = /^[1-9A-HJ-NP-Za-km-z]+$/;

/**
 * Validates and sanitizes creator handles
 * Allows: letters, numbers, dots, underscores, hyphens
 * Handles: URL encoding, case sensitivity, special characters
 */
export function validateCreatorHandle(handle: string): ValidationResult {
  if (!handle || typeof handle !== 'string') {
    return {
      isValid: false,
      error: 'Handle is required and must be a string'
    };
  }

  // Decode URL-encoded characters
  let decodedHandle: string;
  try {
    decodedHandle = decodeURIComponent(handle);
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL encoding in handle'
    };
  }

  // Check length limits
  if (decodedHandle.length === 0) {
    return {
      isValid: false,
      error: 'Handle cannot be empty'
    };
  }

  if (decodedHandle.length > MAX_HANDLE_LENGTH) {
    return {
      isValid: false,
      error: `Handle cannot exceed ${MAX_HANDLE_LENGTH} characters`
    };
  }

  // Check for valid characters only
  const validPattern = /^[a-zA-Z0-9._-]+$/;
  if (!validPattern.test(decodedHandle)) {
    return {
      isValid: false,
      error: 'Handle can only contain letters, numbers, dots, underscores, and hyphens',
      sanitized: decodedHandle.replace(/[^a-zA-Z0-9._-]/g, '')
    };
  }

  // Check for consecutive dots or hyphens
  if (decodedHandle.includes('..') || decodedHandle.includes('--')) {
    return {
      isValid: false,
      error: 'Handle cannot contain consecutive dots or hyphens'
    };
  }

  // Check for leading/trailing dots or hyphens
  if (decodedHandle.startsWith('.') || decodedHandle.startsWith('-') || 
      decodedHandle.endsWith('.') || decodedHandle.endsWith('-')) {
    return {
      isValid: false,
      error: 'Handle cannot start or end with dots or hyphens'
    };
  }

  return {
    isValid: true,
    sanitized: decodedHandle
  };
}

/**
 * Validates and sanitizes signature parameters
 * Used for insight signatures and transaction signatures
 */
export function validateSignature(sig: string): ValidationResult {
  if (!sig || typeof sig !== 'string') {
    return {
      isValid: false,
      error: 'Signature is required and must be a string'
    };
  }

  // Solana transaction signatures are base58 and typically 43-88 chars.
  if (sig.length < MIN_SOLANA_SIGNATURE_LENGTH || sig.length > MAX_SOLANA_SIGNATURE_LENGTH) {
    return {
      isValid: false,
      error: `Invalid signature length. Expected ${MIN_SOLANA_SIGNATURE_LENGTH}-${MAX_SOLANA_SIGNATURE_LENGTH} characters`
    };
  }

  if (!SOLANA_BASE58_PATTERN.test(sig)) {
    return {
      isValid: false,
      error: 'Invalid signature format. Expected Solana base58 signature'
    };
  }

  return {
    isValid: true,
    sanitized: sig
  };
}

/**
 * Validates URL parameters for special characters
 * Handles encoding issues and edge cases
 */
export function validateUrlParameter(param: string, paramName: string): ValidationResult {
  if (!param || typeof param !== 'string') {
    return {
      isValid: false,
      error: `${paramName} is required and must be a string`
    };
  }

  // Decode URL-encoded characters
  let decodedParam: string;
  try {
    decodedParam = decodeURIComponent(param);
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid URL encoding in ${paramName}`
    };
  }

  // Check for null bytes and other dangerous characters
  if (decodedParam.includes('\0')) {
    return {
      isValid: false,
      error: `Invalid characters detected in ${paramName}`
    };
  }

  // Check length limits
  if (decodedParam.length > MAX_URL_PARAM_LENGTH) {
    return {
      isValid: false,
      error: `${paramName} exceeds maximum length of ${MAX_URL_PARAM_LENGTH} characters`
    };
  }

  return {
    isValid: true,
    sanitized: decodedParam
  };
}

/**
 * Sanitizes text for display in OG images
 * Removes dangerous characters and limits length
 */
export function sanitizeForDisplay(text: string, maxLength: number = DEFAULT_DISPLAY_MAX_LENGTH): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove null bytes and control characters
  let sanitized = text.replace(/[\0-\x1F\x7F]/g, '');
  
  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength - ELLIPSIS_LENGTH) + '...';
  }
  
  return sanitized;
}

/**
 * Creates a safe ETag value from input
 * Ensures ETags are valid and don't contain problematic characters
 */
export function createSafeETag(input: string, prefix: string = ''): string {
  const safePrefix = prefix.replace(SAFE_ETAG_PATTERN, '');
  const safeInput = (input || '').replace(SAFE_ETAG_PATTERN, '');
  const value = safeInput || 'unknown';
  const etag = safePrefix ? `${safePrefix}-${value}` : value;
  
  return `"${etag}"`;
}
