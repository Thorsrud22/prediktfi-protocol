/**
 * Intent executor for trading operations
 * Handles Jupiter transaction building and execution
 */

import { buildSwapTransaction, getQuote, getTokenMint } from '../aggregators/jupiter';
import { ExecutionResult } from './receipts';
import { Intent, Guards, Size } from './schema';

export interface ExecutionContext {
  intent: Intent;
  walletPublicKey: string;
  slippageBps: number;
  prioritizationFeeLamports?: number;
}

/**
 * Execute trading intent
 */
export async function executeIntent(
  context: ExecutionContext
): Promise<ExecutionResult> {
  try {
    const { intent, walletPublicKey, slippageBps, prioritizationFeeLamports } = context;

    // Re-validate guards before execution
    const guards: Guards =
      typeof intent.guardsJson === 'string'
        ? JSON.parse(intent.guardsJson)
        : (intent.guardsJson as Guards);
    const now = new Date();
    const expiresAt = new Date(guards.expiresAt);
    
    if (expiresAt <= now) {
      throw new Error('Intent has expired');
    }
    
    // Get fresh quote
    const inputMint = intent.side === 'BUY' ? getTokenMint(intent.quote) : getTokenMint(intent.base);
    const outputMint = intent.side === 'BUY' ? getTokenMint(intent.base) : getTokenMint(intent.quote);
    
    // Calculate trade size (simplified for now)
    const tradeSize = calculateTradeSize(intent);
    
    const quote = await getQuote(
      inputMint,
      outputMint,
      tradeSize,
      slippageBps
    );
    
    // Check if price has moved significantly
    const priceImpact = parseFloat(quote.priceImpactPct);
    if (priceImpact > guards.maxSlippageBps / 100) {
      throw new Error(`Price impact ${priceImpact.toFixed(2)}% exceeds limit of ${guards.maxSlippageBps / 100}%`);
    }
    
    // Build transaction
    const swapResponse = await buildSwapTransaction(
      quote,
      walletPublicKey,
      {
        wrapAndUnwrapSol: true,
        prioritizationFeeLamports
      }
    );
    
    // For now, return the transaction for signing
    // In a real implementation, this would be signed and broadcast
    const txSig = `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate realized metrics
    const realizedPrice = parseFloat(quote.outAmount) / parseFloat(quote.inAmount);
    const feesUsd = calculateFees(quote);
    const actualSlippageBps = Math.round(priceImpact * 100);
    
    return {
      txSig,
      blockTime: new Date(),
      realizedPrice,
      feesUsd,
      slippageBps: actualSlippageBps,
      route: quote.routePlan.map(route => route.swapInfo.label),
      actualSlippageBps
    };
  } catch (error) {
    console.error('Execution error:', error);
    throw new Error(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate trade size from intent
 */
function calculateTradeSize(intent: Intent): string {
  const size =
    typeof intent.sizeJson === 'string'
      ? (JSON.parse(intent.sizeJson) as Size)
      : (intent.sizeJson as unknown as Size);
  
  // For now, return a mock size
  // In production, this would calculate based on wallet balance
  const mockSizes = {
    'SOL': '1000000000', // 1 SOL in lamports
    'ETH': '1000000000', // 1 ETH
    'BTC': '100000000'   // 0.1 BTC
  };
  
  return mockSizes[intent.base as keyof typeof mockSizes] || '1000000000';
}

/**
 * Calculate fees from quote
 */
function calculateFees(quote: any): number {
  try {
    // Platform fee
    const platformFee = quote.platformFee?.amount || '0';
    const platformFeeUsd = parseFloat(platformFee) * 0.000001; // Rough conversion
    
    // Network fee
    const networkFeeUsd = 0.00025; // Solana transaction fee
    
    return platformFeeUsd + networkFeeUsd;
  } catch {
    return 0.001; // Default fee estimate
  }
}

/**
 * Validate execution context
 */
export function validateExecutionContext(context: ExecutionContext): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!context.intent) {
    errors.push('Intent is required');
  }
  
  if (!context.walletPublicKey) {
    errors.push('Wallet public key is required');
  }
  
  if (context.slippageBps < 0 || context.slippageBps > 1000) {
    errors.push('Slippage must be between 0 and 1000 basis points');
  }
  
  if (context.prioritizationFeeLamports && context.prioritizationFeeLamports < 0) {
    errors.push('Prioritization fee must be non-negative');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if execution is safe
 */
export async function isExecutionSafe(
  intent: Intent,
  currentMarketData: {
    price: number;
    liquidityUsd: number;
    volume24h: number;
  }
): Promise<{
  safe: boolean;
  warnings: string[];
  errors: string[];
}> {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  try {
    const guards: Guards =
      typeof intent.guardsJson === 'string'
        ? JSON.parse(intent.guardsJson)
        : (intent.guardsJson as Guards);
    
    // Check expiry
    const expiresAt = new Date(guards.expiresAt);
    const now = new Date();
    if (expiresAt <= now) {
      errors.push('Intent has expired');
    }
    
    // Check liquidity
    if (currentMarketData.liquidityUsd < guards.minLiqUsd) {
      errors.push(`Insufficient liquidity: $${currentMarketData.liquidityUsd.toLocaleString()} < $${guards.minLiqUsd.toLocaleString()}`);
    }
    
    // Check if market is volatile (high volume relative to liquidity)
    const volatilityRatio = currentMarketData.volume24h / currentMarketData.liquidityUsd;
    if (volatilityRatio > 2) {
      warnings.push('High market volatility detected');
    }
    
    return {
      safe: errors.length === 0,
      warnings,
      errors
    };
  } catch (error) {
    return {
      safe: false,
      warnings: [],
      errors: ['Failed to validate execution safety']
    };
  }
}

/**
 * Get execution status
 */
export function getExecutionStatus(txSig: string): 'pending' | 'confirmed' | 'failed' {
  // Mock implementation
  // In production, this would check the blockchain
  return 'confirmed';
}

/**
 * Estimate execution time
 */
export function estimateExecutionTime(): number {
  // Solana block time is ~400ms, add network latency
  return 2000; // 2 seconds
}
