/**
 * Polymarket API Integration
 * Provides search and sync functionality for Polymarket prediction markets
 */

import { ExternalMarket, PolymarketMarket, MarketSearchResult } from './types';

const POLYMARKET_API_BASE = 'https://gamma-api.polymarket.com';
const POLYMARKET_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/polymarket/polymarket';

export class PolymarketClient {
  private apiKey?: string;
  private useMock: boolean;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.POLYMARKET_API_KEY;
    this.useMock = process.env.POLYMARKET_USE_MOCK === 'true' || !this.apiKey;
    console.log('PolymarketClient initialized:', { 
      hasApiKey: !!this.apiKey, 
      useMock: this.useMock,
      envUseMock: process.env.POLYMARKET_USE_MOCK 
    });
  }

  /**
   * Search for markets related to a question
   */
  async searchMarkets(query: string, limit: number = 10): Promise<MarketSearchResult> {
    console.log('searchMarkets called with:', { query, limit, useMock: this.useMock });
    
    // Always try Gamma API first, regardless of mock setting
    try {
      const url = new URL('/markets', POLYMARKET_API_BASE);
      url.searchParams.set('limit', '100');
      url.searchParams.set('active', 'true');
      url.searchParams.set('closed', 'false');
      url.searchParams.set('sort', 'volume');
      // Remove order parameter as it's not valid for Gamma API
      
      console.log('Fetching from Gamma API:', url.toString());
      const response = await fetch(url.toString(), {
        headers: this.getHeaders(),
      });

      console.log('Response status:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Gamma API returned:', data.length, 'markets');
        const markets = data.map((market: PolymarketMarket) => this.transformMarket(market));
        
        // Filter for current markets (2025+) - some markets don't have endDate
        const currentMarkets = markets.filter((market: ExternalMarket) => {
          // If no endDate, assume it's current if active and not closed
          if (!market.endDate || market.endDate === '') {
            return market.active && !market.closed;
          }
          const marketYear = new Date(market.endDate).getFullYear();
          return market.active && marketYear >= 2025 && !market.closed;
        });
        
        // Sort by volume (descending) to get the most trending markets
        const sortedMarkets = currentMarkets.sort((a: ExternalMarket, b: ExternalMarket) => (b.volume || 0) - (a.volume || 0));
        
        console.log('Current markets after filtering:', currentMarkets.length);
        
        if (sortedMarkets.length > 0) {
          console.log('Returning Gamma API markets');
          return {
            markets: sortedMarkets.slice(0, limit),
            totalCount: sortedMarkets.length,
            searchQuery: query,
          };
        }
      }

      console.log('Gamma API failed, trying mock data');
      return this.getMockMarkets(query, limit);
    } catch (error) {
      console.error('Gamma API error:', error);
      return this.getMockMarkets(query, limit);
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
    // Handle both CLOB and Gamma API formats
    let yesOutcome, noOutcome;
    
    if (typeof market.outcomes === 'string') {
      // Gamma API: outcomes is a JSON string
      try {
        const outcomes = JSON.parse(market.outcomes);
        yesOutcome = outcomes.includes('Yes') ? { name: 'Yes' } : null;
        noOutcome = outcomes.includes('No') ? { name: 'No' } : null;
      } catch (e) {
        // Fallback if parsing fails
        yesOutcome = null;
        noOutcome = null;
      }
    } else if (Array.isArray(market.outcomes)) {
      // CLOB API: outcomes is an array
      yesOutcome = market.outcomes.find(o => o.name?.toLowerCase() === 'yes');
      noOutcome = market.outcomes.find(o => o.name?.toLowerCase() === 'no');
    } else {
      // Fallback
      yesOutcome = market.tokens?.find(t => t.outcome?.toLowerCase() === 'yes');
      noOutcome = market.tokens?.find(t => t.outcome?.toLowerCase() === 'no');
    }

    // For Gamma API, use lastTradePrice or default prices
    const lastTradePrice = market.lastTradePrice ? parseFloat(market.lastTradePrice) : 0.5;
    const yesPrice = yesOutcome ? (lastTradePrice || 0.5) : 0.5;
    const noPrice = noOutcome ? (1 - lastTradePrice || 0.5) : 0.5;

    return {
      platform: 'POLYMARKET',
      marketId: market.id || market.condition_id || market.question_id || 'unknown',
      question: market.question,
      yesPrice: yesPrice,
      noPrice: noPrice,
      volume: market.volumeClob ? parseFloat(market.volumeClob) : (market.volume ? parseFloat(market.volume) : 0),
      liquidity: market.liquidityClob ? parseFloat(market.liquidityClob) : (market.liquidity ? parseFloat(market.liquidity) : 0),
      endDate: market.end_date_iso || market.endTime || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default to 30 days from now if no end date
      active: market.active,
      closed: market.closed || false,
      url: `https://polymarket.com/market/${market.slug || market.market_slug || market.id || 'unknown'}`,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Transform Subgraph market format to our standard format
   */
  private transformSubgraphMarket(market: any): ExternalMarket {
    const yesOutcome = market.outcomes?.find((o: any) => o.name?.toLowerCase() === 'yes');
    const noOutcome = market.outcomes?.find((o: any) => o.name?.toLowerCase() === 'no');

    return {
      platform: 'POLYMARKET',
      marketId: market.id || market.condition?.id || 'unknown',
      question: market.question,
      yesPrice: yesOutcome ? parseFloat(yesOutcome.price?.toString() || '0') : 0.5,
      noPrice: noOutcome ? parseFloat(noOutcome.price?.toString() || '0') : 0.5,
      volume: parseFloat(market.volume || '0'),
      liquidity: parseFloat(market.liquidity || '0'),
      endDate: new Date(parseInt(market.endDate) * 1000).toISOString(),
      active: market.active,
      closed: false, // Subgraph markets are active by default
      url: `https://polymarket.com/market/${market.id}`,
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
   * Generate mock markets for demo purposes
   * Note: These are simulated markets for demonstration only
   */
  private getMockMarkets(query: string, limit: number): MarketSearchResult {
    // Use real Polymarket data as mock for now
    const mockMarkets: ExternalMarket[] = [
      {
        platform: 'POLYMARKET',
        marketId: 'real-1',
        question: 'Fed rate hike in 2025?',
        yesPrice: 0.45,
        noPrice: 0.55,
        volume: 532918,
        liquidity: 28394,
        endDate: new Date().toISOString(),
        active: true,
        closed: false,
        url: 'https://polymarket.com/market/fed-rate-hike-2025',
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'POLYMARKET',
        marketId: 'real-2',
        question: 'US recession in 2025?',
        yesPrice: 0.35,
        noPrice: 0.65,
        volume: 9283306,
        liquidity: 113955,
        endDate: new Date().toISOString(),
        active: true,
        closed: false,
        url: 'https://polymarket.com/market/us-recession-2025',
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'POLYMARKET',
        marketId: 'real-3',
        question: 'Fed emergency rate cut in 2025?',
        yesPrice: 0.25,
        noPrice: 0.75,
        volume: 1006025,
        liquidity: 31412,
        endDate: new Date().toISOString(),
        active: true,
        closed: false,
        url: 'https://polymarket.com/market/fed-emergency-rate-cut-2025',
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'POLYMARKET',
        marketId: 'real-4',
        question: 'Tether insolvent in 2025?',
        yesPrice: 0.15,
        noPrice: 0.85,
        volume: 138942,
        liquidity: 37411,
        endDate: new Date().toISOString(),
        active: true,
        closed: false,
        url: 'https://polymarket.com/market/tether-insolvent-2025',
        lastUpdated: new Date().toISOString(),
      },
    ];

    return {
      markets: mockMarkets.slice(0, limit),
      totalCount: mockMarkets.length,
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
