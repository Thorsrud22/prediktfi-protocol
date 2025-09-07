/**
 * Jupiter aggregator integration for Solana swaps
 * Handles quote fetching and transaction building
 */

import { classifyJupiterError, handleJupiterError, JupiterErrorType } from './jupiter-errors';

export interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: {
    amount: string;
    feeBps: number;
  };
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      inAmount: string;
      outputMint: string;
      outAmount: string;
      notEnoughLiquidity: boolean;
      minInAmount?: string;
      minOutAmount?: string;
      priceImpactPct: string;
    };
    percent: number;
  }>;
  contextSlot?: number;
  timeTaken?: number;
}

export interface JupiterSwapRequest {
  quoteResponse: JupiterQuote;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
  useSharedAccounts?: boolean;
  feeAccount?: string;
  trackingAccount?: string;
  computeUnitPriceMicroLamports?: number;
  prioritizationFeeLamports?: number;
  asLegacyTransaction?: boolean;
}

export interface JupiterSwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: number;
  computeUnitPriceMicroLamports?: number;
}

// Token mint addresses for Solana
const TOKEN_MINTS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  ETH: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // Wrapped ETH on Solana
  BTC: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E'  // Wrapped BTC on Solana
} as const;

const JUPITER_BASE_URL = process.env.JUPITER_BASE_URL || 'https://quote-api.jup.ag';

/**
 * Get token mint address
 */
export function getTokenMint(symbol: string): string {
  const mint = TOKEN_MINTS[symbol as keyof typeof TOKEN_MINTS];
  if (!mint) {
    throw new Error(`Unsupported token: ${symbol}`);
  }
  return mint;
}

/**
 * Get quote from Jupiter
 */
export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: number = 50
): Promise<JupiterQuote> {
  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount,
      slippageBps: slippageBps.toString(),
      onlyDirectRoutes: 'false',
      asLegacyTransaction: 'false'
    });
    
    const response = await fetch(`${JUPITER_BASE_URL}/v6/quote?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Predikt/1.0'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`Jupiter API error: ${response.status} ${response.statusText} - ${errorText}`);
      const classifiedError = classifyJupiterError(error);
      throw new Error(classifiedError.message);
    }
    
    const quote = await response.json() as JupiterQuote;
    
    // Validate quote
    if (!quote.outAmount || quote.outAmount === '0') {
      const error = new Error('No liquidity available for this trade');
      const classifiedError = classifyJupiterError(error);
      throw new Error(classifiedError.message);
    }
    
    return quote;
  } catch (error) {
    console.error('Jupiter quote error:', error);
    const classifiedError = classifyJupiterError(error);
    throw new Error(`Failed to get quote: ${classifiedError.message}`);
  }
}

/**
 * Build swap transaction
 */
export async function buildSwapTransaction(
  quote: JupiterQuote,
  userPublicKey: string,
  options: {
    wrapAndUnwrapSol?: boolean;
    prioritizationFeeLamports?: number;
  } = {}
): Promise<JupiterSwapResponse> {
  try {
    const swapRequest: JupiterSwapRequest = {
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol: options.wrapAndUnwrapSol ?? true,
      useSharedAccounts: true,
      asLegacyTransaction: false,
      prioritizationFeeLamports: options.prioritizationFeeLamports || 0
    };
    
    const response = await fetch(`${JUPITER_BASE_URL}/v6/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Predikt/1.0'
      },
      body: JSON.stringify(swapRequest)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`Jupiter swap error: ${response.status} ${response.statusText} - ${errorText}`);
      const classifiedError = classifyJupiterError(error);
      throw new Error(classifiedError.message);
    }
    
    const swapResponse = await response.json() as JupiterSwapResponse;
    
    if (!swapResponse.swapTransaction) {
      const error = new Error('No transaction returned from Jupiter');
      const classifiedError = classifyJupiterError(error);
      throw new Error(classifiedError.message);
    }
    
    return swapResponse;
  } catch (error) {
    console.error('Jupiter swap build error:', error);
    const classifiedError = classifyJupiterError(error);
    throw new Error(`Failed to build swap transaction: ${classifiedError.message}`);
  }
}

/**
 * Calculate trade size in token units
 */
export function calculateTradeSize(
  portfolioValueUsd: number,
  sizePct: number,
  tokenPriceUsd: number
): string {
  const tradeValueUsd = portfolioValueUsd * (sizePct / 100);
  const tokenAmount = tradeValueUsd / tokenPriceUsd;
  
  // Convert to lamports for SOL (9 decimals) or token units for others
  const decimals = 9; // Most Solana tokens use 9 decimals
  return Math.floor(tokenAmount * Math.pow(10, decimals)).toString();
}

/**
 * Estimate slippage based on trade size and liquidity
 */
export function estimateSlippage(
  tradeSizeUsd: number,
  liquidityUsd: number,
  baseSlippageBps: number = 10
): number {
  // Simple slippage estimation based on trade size vs liquidity
  const liquidityRatio = tradeSizeUsd / liquidityUsd;
  
  if (liquidityRatio > 0.1) { // > 10% of liquidity
    return Math.min(baseSlippageBps * (1 + liquidityRatio * 5), 500); // Max 5%
  }
  
  return baseSlippageBps;
}

/**
 * Get market data for a token pair
 */
export async function getMarketData(
  base: string,
  quote: string
): Promise<{
  price: number;
  liquidityUsd: number;
  volume24h: number;
}> {
  try {
    // For now, return mock data
    // In production, integrate with CoinGecko or other price feeds
    const mockPrices = {
      'SOL': 100,
      'ETH': 2000,
      'BTC': 45000
    };
    
    const mockLiquidity = {
      'SOL': 10000000, // $10M
      'ETH': 5000000,  // $5M
      'BTC': 2000000   // $2M
    };
    
    return {
      price: mockPrices[base as keyof typeof mockPrices] || 100,
      liquidityUsd: mockLiquidity[base as keyof typeof mockLiquidity] || 1000000,
      volume24h: 1000000 // $1M daily volume
    };
  } catch (error) {
    console.error('Market data error:', error);
    throw new Error('Failed to get market data');
  }
}

/**
 * Validate token pair for Jupiter
 */
export function validateTokenPair(base: string, quote: string): boolean {
  const supportedTokens = Object.keys(TOKEN_MINTS);
  return supportedTokens.includes(base) && supportedTokens.includes(quote);
}
