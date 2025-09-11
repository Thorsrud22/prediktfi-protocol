/**
 * URL validation and sanitization utilities
 * Handles special characters, encoding, and edge cases for creator handles and URLs
 */

export interface ValidationResult {
  isValid: boolean;
  sanitized?: string;
  error?: string;
}

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

  if (decodedHandle.length > 64) {
    return {
      isValid: false,
      error: 'Handle cannot exceed 64 characters'
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

  // Check length (base64 encoded signatures are typically 88 characters)
  if (sig.length < 32 || sig.length > 128) {
    return {
      isValid: false,
      error: 'Invalid signature length'
    };
  }

  // Check for valid base64 characters
  const base64Pattern = /^[A-Za-z0-9+/=]+$/;
  if (!base64Pattern.test(sig)) {
    return {
      isValid: false,
      error: 'Invalid signature format. Only base64 characters allowed'
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
  if (decodedParam.includes('\0') || decodedParam.includes('\u0000')) {
    return {
      isValid: false,
      error: `Invalid characters detected in ${paramName}`
    };
  }

  // Check length limits
  if (decodedParam.length > 1000) {
    return {
      isValid: false,
      error: `${paramName} exceeds maximum length of 1000 characters`
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
export function sanitizeForDisplay(text: string, maxLength: number = 100): string {
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
    sanitized = sanitized.substring(0, maxLength - 3) + '...';
  }
  
  return sanitized;
}

/**
 * Creates a safe ETag value from input
 * Ensures ETags are valid and don't contain problematic characters
 */
export function createSafeETag(input: string, prefix: string = ''): string {
  if (!input) {
    return `"${prefix}unknown"`;
  }

  // Remove problematic characters for ETags
  const safeInput = input.replace(/[^a-zA-Z0-9._-]/g, '');
  const etag = prefix ? `${prefix}-${safeInput}` : safeInput;
  
  return `"${etag}"`;
}
