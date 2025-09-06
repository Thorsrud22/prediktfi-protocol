/**
 * Kalshi API Integration
 * Provides search and sync functionality for Kalshi prediction markets
 */

import { ExternalMarket, KalshiMarket, MarketSearchResult } from './types';

const KALSHI_API_BASE = 'https://trading-api.kalshi.co/trade-api/v2';

export class KalshiClient {
  private apiKey?: string;
  private fallbackEnabled = true;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.KALSHI_API_KEY;
  }

  /**
   * Search for markets related to a question
   */
  async searchMarkets(query: string, limit: number = 10): Promise<MarketSearchResult> {
    try {
      // Try real API first if we have a key
      if (this.apiKey) {
        const realData = await this.fetchRealMarkets(query, limit);
        if (realData && realData.markets.length > 0) {
          return realData;
        }
      }

      // Fallback to mock data
      if (this.fallbackEnabled) {
        console.log('Using mock Kalshi data (no API key or API failed)');
        return this.getMockMarkets(query, limit);
      }

      return { markets: [], totalCount: 0, searchQuery: query };
    } catch (error) {
      console.error('Kalshi search error:', error);
      // Always fallback to mock data on error
      return this.getMockMarkets(query, limit);
    }
  }

  /**
   * Fetch real markets from Kalshi API
   */
  private async fetchRealMarkets(query: string, limit: number): Promise<MarketSearchResult | null> {
    try {
      const url = new URL('/markets', KALSHI_API_BASE);
      url.searchParams.set('limit', limit.toString());
      url.searchParams.set('status', 'open');
      
      const response = await fetch(url.toString(), {
        headers: this.getHeaders(),
        // Add timeout
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Kalshi API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const markets = data.markets.map((market: KalshiMarket) => this.transformMarket(market));
      
      // Simple text matching
      const filtered = markets.filter((market: ExternalMarket) => 
        this.matchesQuery(market.question, query)
      );

      return {
        markets: filtered.slice(0, limit),
        totalCount: filtered.length,
        searchQuery: query,
      };
    } catch (error) {
      console.error('Real Kalshi API error:', error);
      return null;
    }
  }

  /**
   * Get specific market by ID
   */
  async getMarket(marketId: string): Promise<ExternalMarket | null> {
    try {
      const response = await fetch(`${KALSHI_API_BASE}/markets/${marketId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const market: KalshiMarket = await response.json();
      return this.transformMarket(market);
    } catch (error) {
      console.error('Kalshi get market error:', error);
      return null;
    }
  }

  /**
   * Transform Kalshi format to our standard format
   */
  private transformMarket(market: KalshiMarket): ExternalMarket {
    // Use mid-price between bid and ask
    const yesPrice = (market.yes_ask + market.yes_bid) / 2;
    const noPrice = (market.no_ask + market.no_bid) / 2;

    return {
      platform: 'KALSHI',
      marketId: market.id,
      question: market.title,
      yesPrice: Math.max(0, Math.min(1, yesPrice)),
      noPrice: Math.max(0, Math.min(1, noPrice)),
      volume: market.volume,
      liquidity: market.open_interest,
      endDate: market.close_time,
      active: market.status === 'open',
      url: `https://kalshi.com/markets/${market.ticker_name}`,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Simple text matching
   */
  private matchesQuery(marketQuestion: string, query: string): boolean {
    const marketWords = marketQuestion.toLowerCase().split(/\s+/);
    const queryWords = query.toLowerCase().split(/\s+/);
    
    // Check if at least 30% of query words appear in market question
    const matchingWords = queryWords.filter(word => 
      marketWords.some(marketWord => 
        marketWord.includes(word) || word.includes(marketWord)
      )
    );
    
    return matchingWords.length / queryWords.length >= 0.3;
  }

  /**
   * Get mock markets for development/fallback
   */
  private getMockMarkets(query: string, limit: number): MarketSearchResult {
    const mockMarkets: ExternalMarket[] = [
      {
        platform: 'KALSHI',
        marketId: 'kalshi-1',
        question: 'Will the S&P 500 close above 5000 by end of 2024?',
        yesPrice: 0.42,
        noPrice: 0.58,
        volume: 85000,
        liquidity: 12000,
        endDate: '2024-12-31T23:59:59Z',
        active: true,
        url: 'https://kalshi.com/markets/SP500-5000-2024',
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'KALSHI',
        marketId: 'kalshi-2',
        question: 'Will inflation be above 3% in December 2024?',
        yesPrice: 0.35,
        noPrice: 0.65,
        volume: 65000,
        liquidity: 9000,
        endDate: '2024-12-31T23:59:59Z',
        active: true,
        url: 'https://kalshi.com/markets/inflation-3pct-dec-2024',
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'KALSHI',
        marketId: 'kalshi-3',
        question: 'Will there be a recession in 2024?',
        yesPrice: 0.28,
        noPrice: 0.72,
        volume: 95000,
        liquidity: 15000,
        endDate: '2024-12-31T23:59:59Z',
        active: true,
        url: 'https://kalshi.com/markets/recession-2024',
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'KALSHI',
        marketId: 'kalshi-4',
        question: 'Will oil prices exceed $100 per barrel in 2024?',
        yesPrice: 0.18,
        noPrice: 0.82,
        volume: 45000,
        liquidity: 7000,
        endDate: '2024-12-31T23:59:59Z',
        active: true,
        url: 'https://kalshi.com/markets/oil-100-2024',
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'KALSHI',
        marketId: 'kalshi-5',
        question: 'Will the unemployment rate be below 4% in Q4 2024?',
        yesPrice: 0.55,
        noPrice: 0.45,
        volume: 38000,
        liquidity: 5500,
        endDate: '2024-12-31T23:59:59Z',
        active: true,
        url: 'https://kalshi.com/markets/unemployment-4pct-q4-2024',
        lastUpdated: new Date().toISOString(),
      },
    ];

    // Simple keyword matching for demo
    const keywords = query.toLowerCase().split(/\s+/);
    const filtered = mockMarkets.filter(market =>
      keywords.some(keyword =>
        market.question.toLowerCase().includes(keyword)
      )
    );

    return {
      markets: filtered.slice(0, limit),
      totalCount: filtered.length,
      searchQuery: query,
    };
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }
}

// Default client instance
export const kalshiClient = new KalshiClient(process.env.KALSHI_API_KEY);
