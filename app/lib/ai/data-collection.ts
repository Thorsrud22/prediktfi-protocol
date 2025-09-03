// Enhanced Data Collection Service
import { TechnicalAnalysis, SentimentAnalysis, FundamentalAnalysis, DataSource } from './enhanced-types';

export class DataCollectionService {
  private static instance: DataCollectionService;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static getInstance(): DataCollectionService {
    if (!DataCollectionService.instance) {
      DataCollectionService.instance = new DataCollectionService();
    }
    return DataCollectionService.instance;
  }

  private async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMinutes: number = 5
  ): Promise<T | null> {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < (cached.ttl * 60 * 1000)) {
      return cached.data as T;
    }

    try {
      const data = await fetcher();
      this.cache.set(key, { 
        data, 
        timestamp: now, 
        ttl: ttlMinutes 
      });
      return data;
    } catch (error) {
      console.warn(`Data fetch failed for ${key}:`, error);
      return cached?.data as T || null;
    }
  }

  async getTechnicalAnalysis(symbol: string): Promise<{ data: TechnicalAnalysis | null; source: DataSource }> {
    const startTime = Date.now();
    
    const data = await this.fetchWithCache(
      `technical_${symbol}`,
      () => this.fetchCoinGeckoData(symbol),
      2 // 2 minute cache
    );

    const source: DataSource = {
      name: 'CoinGecko Pro',
      freshness: data ? Math.round((Date.now() - startTime) / (1000 * 60)) : 999,
      quality: data ? 0.85 : 0.0,
      url: 'https://api.coingecko.com'
    };

    return { data, source };
  }

  private async fetchCoinGeckoData(symbol: string): Promise<TechnicalAnalysis | null> {
    // Map symbols to CoinGecko IDs
    const symbolMap: { [key: string]: string } = {
      'btc': 'bitcoin',
      'bitcoin': 'bitcoin',
      'eth': 'ethereum', 
      'ethereum': 'ethereum',
      'sol': 'solana',
      'solana': 'solana',
      'ada': 'cardano',
      'cardano': 'cardano',
      'dot': 'polkadot',
      'polkadot': 'polkadot'
    };

    const coinId = symbolMap[symbol.toLowerCase()] || 'bitcoin';
    
    try {
      // Get current price data with extended info
      const [priceResponse, historicalResponse] = await Promise.all([
        fetch(`https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`),
        fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=30&interval=daily`)
      ]);

      if (!priceResponse.ok || !historicalResponse.ok) {
        throw new Error(`API error: ${priceResponse.status} / ${historicalResponse.status}`);
      }

      const priceData = await priceResponse.json();
      const historicalData = await historicalResponse.json();

      // Calculate technical indicators
      const prices = historicalData.prices.map((p: [number, number]) => p[1]);
      const volumes = historicalData.total_volumes.map((v: [number, number]) => v[1]);
      
      const currentPrice = priceData.market_data.current_price.usd;
      const change24h = priceData.market_data.price_change_percentage_24h || 0;
      const change7d = priceData.market_data.price_change_percentage_7d || 0;
      const change30d = priceData.market_data.price_change_percentage_30d || 0;
      const volume24h = priceData.market_data.total_volume.usd || 0;

      // Calculate volatility (standard deviation of 7-day returns)
      const volatility = this.calculateVolatility(prices.slice(-7));
      
      // Calculate moving averages
      const ma7 = this.calculateSMA(prices, 7);
      const ma30 = this.calculateSMA(prices, 30);
      const ma200 = prices.length >= 200 ? this.calculateSMA(prices, 200) : null;

      // Calculate RSI
      const rsi = this.calculateRSI(prices.slice(-14));

      // Determine trend
      let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (ma7 && ma30) {
        if (currentPrice > ma7 && ma7 > ma30 && change7d > 2) trend = 'bullish';
        else if (currentPrice < ma7 && ma7 < ma30 && change7d < -2) trend = 'bearish';
      }

      // Calculate support/resistance levels
      const support = this.calculateSupport(prices);
      const resistance = this.calculateResistance(prices);

      return {
        price: currentPrice,
        volume24h,
        change24h,
        change7d,
        change30d,
        volatility,
        support,
        resistance,
        trend,
        rsi,
        movingAverages: {
          ma7,
          ma30,
          ma200
        }
      };

    } catch (error) {
      console.error('CoinGecko fetch error:', error);
      return null;
    }
  }

  async getSentimentAnalysis(symbol: string): Promise<{ data: SentimentAnalysis | null; source: DataSource }> {
    const startTime = Date.now();
    
    const data = await this.fetchWithCache(
      `sentiment_${symbol}`,
      () => this.fetchSentimentData(symbol),
      10 // 10 minute cache
    );

    const source: DataSource = {
      name: 'Fear & Greed Index',
      freshness: Math.round((Date.now() - startTime) / (1000 * 60)),
      quality: data ? 0.75 : 0.0,
      url: 'https://api.alternative.me'
    };

    return { data, source };
  }

  private async fetchSentimentData(symbol: string): Promise<SentimentAnalysis | null> {
    try {
      // Fetch Fear & Greed Index
      const fearGreedResponse = await fetch('https://api.alternative.me/fng/');
      
      if (!fearGreedResponse.ok) {
        throw new Error(`Fear & Greed API error: ${fearGreedResponse.status}`);
      }

      const fearGreedData = await fearGreedResponse.json();
      const fearGreedIndex = parseInt(fearGreedData.data[0].value);
      
      // Determine overall sentiment
      let overallSentiment: 'fear' | 'greed' | 'neutral' = 'neutral';
      if (fearGreedIndex < 30) overallSentiment = 'fear';
      else if (fearGreedIndex > 70) overallSentiment = 'greed';

      return {
        fearGreedIndex,
        newsScore: null, // TODO: Implement news sentiment
        socialScore: null, // TODO: Implement social sentiment  
        overallSentiment
      };

    } catch (error) {
      console.error('Sentiment fetch error:', error);
      return null;
    }
  }

  async getFundamentalAnalysis(symbol: string): Promise<{ data: FundamentalAnalysis | null; source: DataSource }> {
    const startTime = Date.now();
    
    const data = await this.fetchWithCache(
      `fundamental_${symbol}`,
      () => this.fetchFundamentalData(symbol),
      15 // 15 minute cache
    );

    const source: DataSource = {
      name: 'CoinGecko Markets',
      freshness: Math.round((Date.now() - startTime) / (1000 * 60)),
      quality: data ? 0.90 : 0.0
    };

    return { data, source };
  }

  private async fetchFundamentalData(symbol: string): Promise<FundamentalAnalysis | null> {
    const symbolMap: { [key: string]: string } = {
      'btc': 'bitcoin',
      'bitcoin': 'bitcoin',
      'eth': 'ethereum',
      'ethereum': 'ethereum',
      'sol': 'solana',
      'solana': 'solana'
    };

    const coinId = symbolMap[symbol.toLowerCase()] || 'bitcoin';
    
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const marketData = data.market_data;

      return {
        marketCap: marketData.market_cap?.usd || null,
        volume24h: marketData.total_volume?.usd || 0,
        circulatingSupply: marketData.circulating_supply || null,
        maxSupply: marketData.max_supply || null,
        dominance: marketData.market_cap_rank <= 10 ? (marketData.market_cap?.usd / 2500000000000) * 100 : null, // Rough dominance calc
        correlationBTC: coinId === 'bitcoin' ? 1.0 : null // TODO: Calculate real correlation
      };

    } catch (error) {
      console.error('Fundamental fetch error:', error);
      return null;
    }
  }

  // Technical indicator calculations
  private calculateSMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    return slice.reduce((sum, price) => sum + price, 0) / period;
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const returns = prices.slice(1).map((price, i) => 
      Math.log(price / prices[i])
    );
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(365) * 100; // Annualized volatility %
  }

  private calculateRSI(prices: number[], period: number = 14): number | null {
    if (prices.length < period + 1) return null;
    
    const changes = prices.slice(1).map((price, i) => price - prices[i]);
    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? -change : 0);
    
    const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
    const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateSupport(prices: number[]): number | null {
    if (prices.length < 10) return null;
    const recentPrices = prices.slice(-20);
    return Math.min(...recentPrices) * 0.95; // 5% below recent low
  }

  private calculateResistance(prices: number[]): number | null {
    if (prices.length < 10) return null;
    const recentPrices = prices.slice(-20);
    return Math.max(...recentPrices) * 1.05; // 5% above recent high
  }
}
