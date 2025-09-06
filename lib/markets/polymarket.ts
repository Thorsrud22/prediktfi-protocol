/**
 * Polymarket API Integration
 * Provides search and sync functionality for Polymarket prediction markets
 */

import { ExternalMarket, PolymarketMarket, MarketSearchResult } from './types';

const POLYMARKET_API_BASE = 'https://gamma-api.polymarket.com';

export class PolymarketClient {
  private apiKey?: string;
  private fallbackEnabled = true;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.POLYMARKET_API_KEY;
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
        console.log('Using mock Polymarket data (no API key or API failed)');
        return this.getMockMarkets(query, limit);
      }

      return { markets: [], totalCount: 0, searchQuery: query };
    } catch (error) {
      console.error('Polymarket search error:', error);
      // Always fallback to mock data on error
      return this.getMockMarkets(query, limit);
    }
  }

  /**
   * Fetch real markets from Polymarket API
   */
  private async fetchRealMarkets(query: string, limit: number): Promise<MarketSearchResult | null> {
    try {
      const url = new URL('/markets', POLYMARKET_API_BASE);
      url.searchParams.set('limit', limit.toString());
      url.searchParams.set('active', 'true');
      
      const response = await fetch(url.toString(), {
        headers: this.getHeaders(),
        // Add timeout
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const markets = data.map((market: PolymarketMarket) => this.transformMarket(market));
      
      // Simple text matching - could be enhanced with semantic search
      const filtered = markets.filter((market: ExternalMarket) => 
        this.matchesQuery(market.question, query)
      );

      return {
        markets: filtered.slice(0, limit),
        totalCount: filtered.length,
        searchQuery: query,
      };
    } catch (error) {
      console.error('Real Polymarket API error:', error);
      return null;
    }
  }

  /**
   * Get specific market by ID
   */
  async getMarket(marketId: string): Promise<ExternalMarket | null> {
    try {
      const response = await fetch(`${POLYMARKET_API_BASE}/markets/${marketId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const market: PolymarketMarket = await response.json();
      return this.transformMarket(market);
    } catch (error) {
      console.error('Polymarket get market error:', error);
      return null;
    }
  }

  /**
   * Transform Polymarket format to our standard format
   */
  private transformMarket(market: PolymarketMarket): ExternalMarket {
    const yesOutcome = market.outcomes.find(o => o.name.toLowerCase() === 'yes');
    const noOutcome = market.outcomes.find(o => o.name.toLowerCase() === 'no');

    return {
      platform: 'POLYMARKET',
      marketId: market.id,
      question: market.question,
      yesPrice: yesOutcome ? parseFloat(yesOutcome.price) : 0.5,
      noPrice: noOutcome ? parseFloat(noOutcome.price) : 0.5,
      volume: parseFloat(market.volume || '0'),
      liquidity: parseFloat(market.liquidity || '0'),
      endDate: market.end_date_iso,
      active: market.active,
      url: `https://polymarket.com/market/${market.slug}`,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Simple text matching - could be enhanced
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
        platform: 'POLYMARKET',
        marketId: 'mock-1',
        question: 'Will Bitcoin reach $100,000 by end of 2024?',
        yesPrice: 0.65,
        noPrice: 0.35,
        volume: 125000,
        liquidity: 15000,
        endDate: '2024-12-31T23:59:59Z',
        active: true,
        url: 'https://polymarket.com/market/bitcoin-100k-2024',
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'POLYMARKET',
        marketId: 'mock-2',
        question: 'Will there be sunny weather tomorrow?',
        yesPrice: 0.72,
        noPrice: 0.28,
        volume: 8500,
        liquidity: 2000,
        endDate: '2025-09-08T23:59:59Z',
        active: true,
        url: 'https://polymarket.com/market/sunny-weather-tomorrow',
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'POLYMARKET',
        marketId: 'mock-3',
        question: 'Will the Fed raise interest rates in Q4 2024?',
        yesPrice: 0.45,
        noPrice: 0.55,
        volume: 45000,
        liquidity: 8000,
        endDate: '2024-12-31T23:59:59Z',
        active: true,
        url: 'https://polymarket.com/market/fed-rates-q4-2024',
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'POLYMARKET',
        marketId: 'mock-4',
        question: 'Will AI surpass human intelligence by 2030?',
        yesPrice: 0.25,
        noPrice: 0.75,
        volume: 75000,
        liquidity: 12000,
        endDate: '2030-12-31T23:59:59Z',
        active: true,
        url: 'https://polymarket.com/market/ai-singularity-2030',
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'POLYMARKET',
        marketId: 'mock-5',
        question: 'Will Tesla stock hit $300 by end of 2024?',
        yesPrice: 0.38,
        noPrice: 0.62,
        volume: 32000,
        liquidity: 6000,
        endDate: '2024-12-31T23:59:59Z',
        active: true,
        url: 'https://polymarket.com/market/tesla-300-2024',
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
export const polymarketClient = new PolymarketClient(process.env.POLYMARKET_API_KEY);
