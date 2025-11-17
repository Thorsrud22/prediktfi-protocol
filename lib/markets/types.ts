/**
 * Types for External Market Integration
 * Currently supports Kalshi integration
 */

export interface ExternalMarket {
  platform: 'KALSHI';
  marketId: string;
  question: string;
  yesPrice: number;      // Current price for YES outcome (0-1)
  noPrice: number;       // Current price for NO outcome (0-1)
  volume: number;        // Total trading volume
  liquidity: number;     // Available liquidity
  endDate: string;       // ISO date string
  active: boolean;       // Whether market is still active
  url: string;          // Direct link to market
  lastUpdated: string;   // ISO timestamp of last sync
}

export interface MarketSearchResult {
  markets: ExternalMarket[];
  totalCount: number;
  searchQuery: string;
}

export interface MarketSyncResult {
  success: boolean;
  updatedMarkets: number;
  errors: string[];
  lastSync: string;
}

export interface KalshiMarket {
  id: string;
  title: string;
  yes_ask: number;
  yes_bid: number;
  no_ask: number;
  no_bid: number;
  volume: number;
  open_interest: number;
  close_time: string;
  status: string;
  ticker_name: string;
}

export interface MarketMatchScore {
  market: ExternalMarket;
  similarity: number;    // 0-1 score of how well it matches our insight
  reasons: string[];     // Why this market was matched
}
