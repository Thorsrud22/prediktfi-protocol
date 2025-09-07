/**
 * Smart Defaults for P2A Trading
 * Calculates conservative position sizes based on wallet balance
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

export interface WalletBalance {
  sol: number;
  usdc: number;
  totalValueUsd: number;
}

export interface SmartDefaults {
  recommendedSizePct: number;
  recommendedSizeUsd: number;
  maxSafeSizePct: number;
  maxSafeSizeUsd: number;
  rationale: string;
}

export class SmartDefaultsCalculator {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Calculate smart defaults based on wallet balance
   */
  async calculateDefaults(
    walletAddress: string,
    side: 'BUY' | 'SELL'
  ): Promise<SmartDefaults> {
    try {
      const balance = await this.getWalletBalance(walletAddress);
      return this.calculateSizeDefaults(balance, side);
    } catch (error) {
      console.error('Failed to calculate smart defaults:', error);
      // Return conservative fallback defaults
      return this.getFallbackDefaults();
    }
  }

  /**
   * Get wallet balance for SOL and USDC
   */
  private async getWalletBalance(walletAddress: string): Promise<WalletBalance> {
    const publicKey = new PublicKey(walletAddress);
    
    // Get SOL balance
    const solBalance = await this.connection.getBalance(publicKey);
    const sol = solBalance / 1e9; // Convert lamports to SOL

    // Get USDC balance (assuming USDC mint address)
    const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC mint
    const usdcTokenAccount = await getAssociatedTokenAddress(usdcMint, publicKey);
    
    let usdc = 0;
    try {
      const usdcAccountInfo = await this.connection.getTokenAccountBalance(usdcTokenAccount);
      usdc = parseFloat(usdcAccountInfo.value.amount) / 1e6; // USDC has 6 decimals
    } catch {
      // USDC account doesn't exist or has no balance
      usdc = 0;
    }

    // Calculate total value in USD (simplified pricing)
    const solPriceUsd = 100; // This should be fetched from a price API
    const totalValueUsd = (sol * solPriceUsd) + usdc;

    return {
      sol,
      usdc,
      totalValueUsd
    };
  }

  /**
   * Calculate size defaults based on wallet balance
   */
  private calculateSizeDefaults(
    balance: WalletBalance,
    side: 'BUY' | 'SELL'
  ): SmartDefaults {
    const { totalValueUsd, sol, usdc } = balance;

    // Conservative sizing based on total portfolio value
    let recommendedSizePct: number;
    let recommendedSizeUsd: number;
    let maxSafeSizePct: number;
    let maxSafeSizeUsd: number;
    let rationale: string;

    if (totalValueUsd < 100) {
      // Very small portfolio - very conservative
      recommendedSizePct = 2;
      recommendedSizeUsd = Math.min(totalValueUsd * 0.02, 10);
      maxSafeSizePct = 5;
      maxSafeSizeUsd = Math.min(totalValueUsd * 0.05, 25);
      rationale = 'Small portfolio detected. Using very conservative 2% sizing.';
    } else if (totalValueUsd < 1000) {
      // Small portfolio - conservative
      recommendedSizePct = 3;
      recommendedSizeUsd = Math.min(totalValueUsd * 0.03, 50);
      maxSafeSizePct = 7;
      maxSafeSizeUsd = Math.min(totalValueUsd * 0.07, 100);
      rationale = 'Small portfolio detected. Using conservative 3% sizing.';
    } else if (totalValueUsd < 10000) {
      // Medium portfolio - moderate
      recommendedSizePct = 4;
      recommendedSizeUsd = Math.min(totalValueUsd * 0.04, 200);
      maxSafeSizePct = 8;
      maxSafeSizeUsd = Math.min(totalValueUsd * 0.08, 500);
      rationale = 'Medium portfolio detected. Using moderate 4% sizing.';
    } else {
      // Large portfolio - can be more aggressive
      recommendedSizePct = 5;
      recommendedSizeUsd = Math.min(totalValueUsd * 0.05, 1000);
      maxSafeSizePct = 10;
      maxSafeSizeUsd = Math.min(totalValueUsd * 0.10, 2000);
      rationale = 'Large portfolio detected. Using 5% sizing with higher limits.';
    }

    // Adjust for BUY vs SELL
    if (side === 'BUY') {
      // For BUY orders, ensure we have enough USDC
      const maxUsdcSize = usdc * 0.8; // Use max 80% of USDC balance
      recommendedSizeUsd = Math.min(recommendedSizeUsd, maxUsdcSize);
      maxSafeSizeUsd = Math.min(maxSafeSizeUsd, maxUsdcSize);
      
      if (usdc < recommendedSizeUsd) {
        rationale += ` Limited by USDC balance (${usdc.toFixed(2)} USDC available).`;
      }
    } else {
      // For SELL orders, ensure we have enough SOL
      const maxSolSize = sol * 0.8; // Use max 80% of SOL balance
      const maxSolUsd = maxSolSize * 100; // Assuming $100 SOL price
      recommendedSizeUsd = Math.min(recommendedSizeUsd, maxSolUsd);
      maxSafeSizeUsd = Math.min(maxSafeSizeUsd, maxSolUsd);
      
      if (sol < (recommendedSizeUsd / 100)) {
        rationale += ` Limited by SOL balance (${sol.toFixed(4)} SOL available).`;
      }
    }

    return {
      recommendedSizePct,
      recommendedSizeUsd,
      maxSafeSizePct,
      maxSafeSizeUsd,
      rationale
    };
  }

  /**
   * Fallback defaults when balance calculation fails
   */
  private getFallbackDefaults(): SmartDefaults {
    return {
      recommendedSizePct: 2,
      recommendedSizeUsd: 50,
      maxSafeSizePct: 5,
      maxSafeSizeUsd: 100,
      rationale: 'Using conservative fallback defaults. Please verify your wallet balance.'
    };
  }

  /**
   * Get quick size suggestions for UI
   */
  getQuickSizeSuggestions(totalValueUsd: number): Array<{
    label: string;
    pct: number;
    usd: number;
    description: string;
  }> {
    const suggestions = [
      {
        label: 'Conservative',
        pct: 2,
        usd: Math.min(totalValueUsd * 0.02, 25),
        description: 'Very safe, minimal risk'
      },
      {
        label: 'Moderate',
        pct: 4,
        usd: Math.min(totalValueUsd * 0.04, 100),
        description: 'Balanced risk/reward'
      },
      {
        label: 'Aggressive',
        pct: 8,
        usd: Math.min(totalValueUsd * 0.08, 500),
        description: 'Higher risk, higher potential'
      }
    ];

    return suggestions.filter(s => s.usd >= 10); // Only show suggestions with at least $10
  }
}

/**
 * Utility function to get smart defaults
 */
export async function getSmartDefaults(
  walletAddress: string,
  side: 'BUY' | 'SELL',
  connection: Connection
): Promise<SmartDefaults> {
  const calculator = new SmartDefaultsCalculator(connection);
  return calculator.calculateDefaults(walletAddress, side);
}
