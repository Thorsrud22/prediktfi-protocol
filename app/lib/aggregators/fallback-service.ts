/**
 * Aggregator Fallback Service
 * Handles Jupiter failures and falls back to simulate-only mode
 */

import { getQuote, buildSwapTransaction, JupiterQuote, JupiterSwapResponse } from './jupiter';
import { classifyJupiterError } from './jupiter-errors';

export interface FallbackResult {
  success: boolean;
  mode: 'execution' | 'simulation-only';
  quote?: JupiterQuote;
  swapResponse?: JupiterSwapResponse;
  error?: string;
  fallbackReason?: string;
  warningBanner?: {
    title: string;
    message: string;
    type: 'warning' | 'error';
  };
}

export interface FallbackConfig {
  maxRetries: number;
  retryDelayMs: number;
  fallbackThreshold: number; // Error rate threshold to trigger fallback
}

const DEFAULT_CONFIG: FallbackConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  fallbackThreshold: 0.3 // 30% error rate
};

/**
 * Get quote with fallback handling
 */
export async function getQuoteWithFallback(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: number = 50,
  config: Partial<FallbackConfig> = {}
): Promise<FallbackResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  let lastError: Error | null = null;
  let attempt = 0;
  
  while (attempt < finalConfig.maxRetries) {
    try {
      attempt++;
      
      const quote = await getQuote(inputMint, outputMint, amount, slippageBps);
      
      return {
        success: true,
        mode: 'execution',
        quote
      };
      
    } catch (error) {
      lastError = error as Error;
      console.warn(`Jupiter quote attempt ${attempt} failed:`, error);
      
      // Check if this is a retryable error
      const classifiedError = classifyJupiterError(lastError);
      if (!classifiedError.retryable) {
        break; // Don't retry non-retryable errors
      }
      
      // Wait before retry
      if (attempt < finalConfig.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelayMs * attempt));
      }
    }
  }
  
  // All attempts failed, fall back to simulation-only
  return createSimulationOnlyFallback(lastError, 'Jupiter API unavailable');
}

/**
 * Build swap transaction with fallback handling
 */
export async function buildSwapWithFallback(
  quote: JupiterQuote,
  userPublicKey: string,
  options: {
    wrapAndUnwrapSol?: boolean;
    prioritizationFeeLamports?: number;
  } = {},
  config: Partial<FallbackConfig> = {}
): Promise<FallbackResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  let lastError: Error | null = null;
  let attempt = 0;
  
  while (attempt < finalConfig.maxRetries) {
    try {
      attempt++;
      
      const swapResponse = await buildSwapTransaction(quote, userPublicKey, options);
      
      return {
        success: true,
        mode: 'execution',
        quote,
        swapResponse
      };
      
    } catch (error) {
      lastError = error as Error;
      console.warn(`Jupiter swap attempt ${attempt} failed:`, error);
      
      // Check if this is a retryable error
      const classifiedError = classifyJupiterError(lastError);
      if (!classifiedError.retryable) {
        break; // Don't retry non-retryable errors
      }
      
      // Wait before retry
      if (attempt < finalConfig.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelayMs * attempt));
      }
    }
  }
  
  // All attempts failed, fall back to simulation-only
  return createSimulationOnlyFallback(lastError, 'Jupiter swap failed');
}

/**
 * Create simulation-only fallback result
 */
function createSimulationOnlyFallback(error: Error | null, reason: string): FallbackResult {
  const errorMessage = error?.message || 'Unknown error';
  
  return {
    success: false,
    mode: 'simulation-only',
    error: errorMessage,
    fallbackReason: reason,
    warningBanner: {
      title: '⚠️ Aggregator Unavailable',
      message: `Jupiter is currently unavailable (${reason}). Trade will be simulated only.`,
      type: 'warning'
    }
  };
}

/**
 * Check if we should use fallback mode based on recent error rates
 */
export async function shouldUseFallbackMode(): Promise<boolean> {
  // In a real implementation, this would check recent error rates
  // For now, we'll use a simple random check for demo purposes
  const errorRate = Math.random();
  return errorRate > 0.8; // 20% chance of fallback mode
}

/**
 * Get fallback status for UI display
 */
export function getFallbackStatus(): {
  isActive: boolean;
  message: string;
  type: 'info' | 'warning' | 'error';
} {
  // In a real implementation, this would check actual system status
  const isActive = Math.random() > 0.9; // 10% chance of active fallback
  
  if (isActive) {
    return {
      isActive: true,
      message: 'Jupiter aggregator is experiencing issues. All trades are simulation-only.',
      type: 'warning'
    };
  }
  
  return {
    isActive: false,
    message: 'All systems operational',
    type: 'info'
  };
}

