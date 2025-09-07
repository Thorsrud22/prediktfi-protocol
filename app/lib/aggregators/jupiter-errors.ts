/**
 * Jupiter API error classification and handling
 */

export enum JupiterErrorType {
  PRICE_CHANGED = 'PRICE_CHANGED',
  ROUTE_UNAVAILABLE = 'ROUTE_UNAVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY',
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',
  INVALID_INPUT = 'INVALID_INPUT',
  RATE_LIMITED = 'RATE_LIMITED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface JupiterError {
  type: JupiterErrorType;
  message: string;
  retryable: boolean;
  originalError: any;
}

/**
 * Classify Jupiter API errors
 */
export function classifyJupiterError(error: any): JupiterError {
  const errorMessage = error?.message || error?.toString() || '';
  const errorStr = errorMessage.toLowerCase();
  
  // Network errors
  if (errorStr.includes('fetch') || 
      errorStr.includes('network') || 
      errorStr.includes('connection') ||
      errorStr.includes('timeout') ||
      errorStr.includes('econnreset') ||
      errorStr.includes('enotfound')) {
    return {
      type: JupiterErrorType.NETWORK_ERROR,
      message: 'Network connection failed. Please check your internet connection.',
      retryable: true,
      originalError: error
    };
  }
  
  // Price changed errors
  if (errorStr.includes('price') && 
      (errorStr.includes('changed') || errorStr.includes('moved') || errorStr.includes('stale'))) {
    return {
      type: JupiterErrorType.PRICE_CHANGED,
      message: 'Price has changed since quote was generated. Please get a new quote.',
      retryable: true,
      originalError: error
    };
  }
  
  // Route unavailable errors
  if (errorStr.includes('route') && 
      (errorStr.includes('unavailable') || errorStr.includes('not found') || errorStr.includes('no route'))) {
    return {
      type: JupiterErrorType.ROUTE_UNAVAILABLE,
      message: 'No trading route available for this pair.',
      retryable: false,
      originalError: error
    };
  }
  
  // Insufficient liquidity
  if (errorStr.includes('liquidity') || 
      errorStr.includes('insufficient') ||
      errorStr.includes('outamount') && errorStr.includes('0')) {
    return {
      type: JupiterErrorType.INSUFFICIENT_LIQUIDITY,
      message: 'Insufficient liquidity for this trade size.',
      retryable: false,
      originalError: error
    };
  }
  
  // Slippage exceeded
  if (errorStr.includes('slippage') || 
      errorStr.includes('price impact') ||
      errorStr.includes('exceeded')) {
    return {
      type: JupiterErrorType.SLIPPAGE_EXCEEDED,
      message: 'Price impact exceeds slippage tolerance.',
      retryable: true,
      originalError: error
    };
  }
  
  // Rate limiting
  if (errorStr.includes('rate limit') || 
      errorStr.includes('429') ||
      errorStr.includes('too many requests')) {
    return {
      type: JupiterErrorType.RATE_LIMITED,
      message: 'Rate limit exceeded. Please wait before retrying.',
      retryable: true,
      originalError: error
    };
  }
  
  // Invalid input
  if (errorStr.includes('invalid') || 
      errorStr.includes('bad request') ||
      errorStr.includes('400')) {
    return {
      type: JupiterErrorType.INVALID_INPUT,
      message: 'Invalid input parameters.',
      retryable: false,
      originalError: error
    };
  }
  
  // Default unknown error
  return {
    type: JupiterErrorType.UNKNOWN_ERROR,
    message: errorMessage || 'Unknown Jupiter API error',
    retryable: false,
    originalError: error
  };
}

/**
 * Handle Jupiter errors with appropriate retry logic
 */
export async function handleJupiterError(
  error: any,
  retryFn?: () => Promise<any>,
  maxRetries: number = 3
): Promise<any> {
  const classifiedError = classifyJupiterError(error);
  
  // Log the error
  console.error(`Jupiter ${classifiedError.type}:`, {
    message: classifiedError.message,
    originalError: classifiedError.originalError,
    retryable: classifiedError.retryable
  });
  
  // If not retryable, throw immediately
  if (!classifiedError.retryable || !retryFn) {
    throw new Error(classifiedError.message);
  }
  
  // Retry with exponential backoff
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      return await retryFn();
    } catch (retryError) {
      const retryClassified = classifyJupiterError(retryError);
      
      if (attempt === maxRetries || !retryClassified.retryable) {
        throw new Error(retryClassified.message);
      }
      
      console.log(`Jupiter retry attempt ${attempt}/${maxRetries} failed: ${retryClassified.message}`);
    }
  }
  
  throw new Error(classifiedError.message);
}

/**
 * Check if error is retryable
 */
export function isRetryableJupiterError(error: any): boolean {
  const classified = classifyJupiterError(error);
  return classified.retryable;
}
