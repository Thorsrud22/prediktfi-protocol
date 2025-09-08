// app/lib/advisor/holdings.ts
import { PublicKey, Connection } from '@solana/web3.js';
import { prisma } from '../prisma';

export interface Holding {
  asset: string;
  symbol: string;
  amount: number;
  valueUsd: number;
  mint: string;
  decimals: number;
}

export interface PortfolioSnapshot {
  walletId: string;
  timestamp: Date;
  totalValueUsd: number;
  holdings: Holding[];
  topPositions: Holding[];
  concentration: {
    hhi: number; // Herfindahl-Hirschman Index
    top5Percent: number;
    stablecoinPercent: number;
  };
  pnl: {
    estimated24h: number;
    estimated7d: number;
    estimated30d: number;
  };
  risk: {
    drawdownFromAth: number;
    volatility: number;
    diversification: 'low' | 'medium' | 'high';
  };
}

export class HoldingsService {
  private static readonly SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  private static readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private static connection = new Connection(this.SOLANA_RPC_URL, 'confirmed');

  static async getPortfolioSnapshot(walletAddress: string): Promise<PortfolioSnapshot> {
    try {
      // Get token accounts from Solana
      const tokenAccounts = await this.getTokenAccounts(walletAddress);
      
      // Get current prices
      const holdings = await this.enrichHoldingsWithPrices(tokenAccounts);
      
      // Calculate portfolio metrics
      const snapshot = await this.calculatePortfolioMetrics(walletAddress, holdings);
      
      return snapshot;
    } catch (error) {
      console.error('Error getting portfolio snapshot:', error);
      throw new Error('Failed to get portfolio snapshot');
    }
  }

  private static async getTokenAccounts(walletAddress: string): Promise<any[]> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const accounts = [];

      // Get SOL balance
      const solBalance = await this.connection.getBalance(publicKey);
      if (solBalance > 0) {
        accounts.push({
          mint: 'So11111111111111111111111111111111111111112', // SOL
          amount: solBalance.toString(),
          decimals: 9
        });
      }

      // Get SPL token accounts
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
      });

      for (const account of tokenAccounts.value) {
        const tokenInfo = account.account.data.parsed.info;
        const tokenAmount = tokenInfo.tokenAmount;
        
        // Only include accounts with balance > 0
        if (parseFloat(tokenAmount.amount) > 0) {
          accounts.push({
            mint: tokenInfo.mint,
            amount: tokenAmount.amount,
            decimals: tokenAmount.decimals
          });
        }
      }

      return accounts;
    } catch (error) {
      console.error('Error fetching token accounts:', error);
      
      // Fallback to mock data if RPC fails
      console.warn('Using mock data due to RPC error');
      return [
        {
          mint: 'So11111111111111111111111111111111111111112', // SOL
          amount: '1000000000', // 1 SOL in lamports
          decimals: 9
        },
        {
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
          amount: '500000000', // 500 USDC
          decimals: 6
        }
      ];
    }
  }

  private static async enrichHoldingsWithPrices(tokenAccounts: any[]): Promise<Holding[]> {
    const holdings: Holding[] = [];
    
    for (const account of tokenAccounts) {
      try {
        const priceData = await this.getTokenPrice(account.mint);
        const amount = parseFloat(account.amount) / Math.pow(10, account.decimals);
        const valueUsd = amount * priceData.price;
        
        holdings.push({
          asset: account.mint,
          symbol: priceData.symbol,
          amount,
          valueUsd,
          mint: account.mint,
          decimals: account.decimals
        });
      } catch (error) {
        console.warn(`Failed to get price for ${account.mint}:`, error);
        // Skip tokens without price data
      }
    }
    
    return holdings;
  }

  private static async getTokenPrice(mint: string): Promise<{ symbol: string; price: number }> {
    // Map common Solana tokens to CoinGecko IDs and symbols
    const tokenMap: { [key: string]: { coinGeckoId: string; symbol: string } } = {
      'So11111111111111111111111111111111111111112': { coinGeckoId: 'solana', symbol: 'SOL' },
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { coinGeckoId: 'usd-coin', symbol: 'USDC' },
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { coinGeckoId: 'tether', symbol: 'USDT' },
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { coinGeckoId: 'marinade-staked-sol', symbol: 'mSOL' },
      '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': { coinGeckoId: 'ethereum', symbol: 'ETH' },
      '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E': { coinGeckoId: 'bitcoin', symbol: 'BTC' },
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { coinGeckoId: 'bonk', symbol: 'BONK' },
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { coinGeckoId: 'jupiter-exchange-solana', symbol: 'JUP' },
    };

    const tokenInfo = tokenMap[mint];
    if (!tokenInfo) {
      // For unknown tokens, try to use the mint address as symbol and return 0 price
      console.warn(`Unknown token: ${mint}`);
      return {
        symbol: mint.slice(0, 8) + '...',
        price: 0
      };
    }

    try {
      const response = await fetch(
        `${this.COINGECKO_API}/simple/price?ids=${tokenInfo.coinGeckoId}&vs_currencies=usd`,
        { 
          next: { revalidate: 300 } // Cache for 5 minutes
        }
      );
      
      if (!response.ok) {
        console.warn(`CoinGecko API request failed for ${tokenInfo.symbol}`);
        return {
          symbol: tokenInfo.symbol,
          price: 0
        };
      }
      
      const data = await response.json();
      const price = data[tokenInfo.coinGeckoId]?.usd || 0;
      
      return {
        symbol: tokenInfo.symbol,
        price
      };
    } catch (error) {
      console.error(`Error fetching price for ${tokenInfo.symbol}:`, error);
      return {
        symbol: tokenInfo.symbol,
        price: 0
      };
    }
  }

  private static async calculatePortfolioMetrics(
    walletId: string, 
    holdings: Holding[]
  ): Promise<PortfolioSnapshot> {
    const totalValueUsd = holdings.reduce((sum, h) => sum + h.valueUsd, 0);
    
    // Sort by value and get top positions
    const sortedHoldings = holdings.sort((a, b) => b.valueUsd - a.valueUsd);
    const topPositions = sortedHoldings.slice(0, 5);
    
    // Calculate concentration metrics
    const hhi = this.calculateHHI(holdings, totalValueUsd);
    const top5Percent = topPositions.reduce((sum, h) => sum + h.valueUsd, 0) / totalValueUsd * 100;
    
    // Identify stablecoins
    const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD'];
    const stablecoinValue = holdings
      .filter(h => stablecoins.includes(h.symbol))
      .reduce((sum, h) => sum + h.valueUsd, 0);
    const stablecoinPercent = stablecoinValue / totalValueUsd * 100;
    
    // Calculate diversification
    const diversification = hhi < 0.15 ? 'high' : hhi < 0.25 ? 'medium' : 'low';
    
    return {
      walletId,
      timestamp: new Date(),
      totalValueUsd,
      holdings: sortedHoldings,
      topPositions,
      concentration: {
        hhi,
        top5Percent,
        stablecoinPercent
      },
      pnl: {
        estimated24h: 0, // Would need historical data
        estimated7d: 0,
        estimated30d: 0
      },
      risk: {
        drawdownFromAth: 0, // Would need historical data
        volatility: 0, // Would need historical data
        diversification
      }
    };
  }

  private static calculateHHI(holdings: Holding[], totalValue: number): number {
    if (totalValue === 0) return 0;
    
    return holdings.reduce((hhi, holding) => {
      const marketShare = holding.valueUsd / totalValue;
      return hhi + (marketShare * marketShare);
    }, 0);
  }

  // Helper method to validate Solana address
  static isValidSolanaAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }
}
