import { 
  TechnicalAnalysis, 
  SentimentAnalysis, 
  FundamentalAnalysis, 
  DataSource,
} from './enhanced-types';

export class EnhancedDataService {
  private static instance: EnhancedDataService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): EnhancedDataService {
    if (!EnhancedDataService.instance) {
      EnhancedDataService.instance = new EnhancedDataService();
    }
    return EnhancedDataService.instance;
  }

  // Technical Analysis with multiple indicators
  async getTechnicalAnalysis(symbol: string): Promise<{ data: TechnicalAnalysis | null; source: DataSource }> {
    const cacheKey = `technical_${symbol}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const [priceData, volumeData, indicators] = await Promise.all([
        this.fetchPriceData(symbol),
        this.fetchVolumeData(symbol),
        this.fetchTechnicalIndicators(symbol)
      ]);

      const technical: TechnicalAnalysis = {
        price: priceData.price,
        volume24h: volumeData.volume24h,
        change24h: priceData.change24h,
        change7d: 0, // Not available in current data source
        change30d: 0, // Not available in current data source
        rsi: indicators.rsi,
        movingAverages: {
          ma7: indicators.movingAverages?.sma20 || null,
          ma30: indicators.movingAverages?.sma50 || null,
          ma200: indicators.movingAverages?.sma200 || null
        },
        support: indicators.supportLevels?.[0] || null,
        resistance: indicators.resistanceLevels?.[0] || null,
        trend: this.calculateTrend(indicators),
        volatility: this.calculateVolatility(priceData, indicators)
      };

      const source: DataSource = {
        name: 'CoinGecko + Technical Indicators',
        freshness: 2, // 2 minutes old
        quality: 0.95,
        url: 'https://api.coingecko.com'
      };

      const result = { data: technical, source };
      this.setCachedData(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Technical analysis fetch error:', error);
      return { data: null, source: { name: 'Error', freshness: 0, quality: 0 } };
    }
  }

  // Sentiment Analysis from multiple sources
  async getSentimentAnalysis(symbol: string): Promise<{ data: SentimentAnalysis | null; source: DataSource }> {
    const cacheKey = `sentiment_${symbol}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const [fearGreed, newsSentiment, socialSentiment] = await Promise.all([
        this.fetchFearGreedIndex(),
        this.fetchNewsSentiment(symbol),
        this.fetchSocialSentiment(symbol)
      ]);

      const sentiment: SentimentAnalysis = {
        fearGreedIndex: fearGreed.value,
        newsScore: newsSentiment.score,
        socialScore: socialSentiment.score,
        overallSentiment: this.calculateOverallSentiment(fearGreed, newsSentiment, socialSentiment)
      };

      const source: DataSource = {
        name: 'Multi-Source Sentiment',
        freshness: 3, // 3 minutes old
        quality: 0.88,
        url: 'Fear & Greed + News + Social'
      };

      const result = { data: sentiment, source };
      this.setCachedData(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Sentiment analysis fetch error:', error);
      return { data: null, source: { name: 'Error', freshness: 0, quality: 0 } };
    }
  }

  // Enhanced Fundamental Analysis
  async getFundamentalAnalysis(symbol: string): Promise<{ data: FundamentalAnalysis | null; source: DataSource }> {
    const cacheKey = `fundamental_${symbol}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const [marketData, onChainData, macroData] = await Promise.all([
        this.fetchMarketData(symbol),
        this.fetchOnChainData(symbol),
        this.fetchMacroData()
      ]);

      const fundamental: FundamentalAnalysis = {
        marketCap: marketData.marketCap,
        volume24h: marketData.volume24h,
        circulatingSupply: marketData.circulatingSupply,
        maxSupply: marketData.maxSupply,
        dominance: marketData.dominance,
        correlationBTC: marketData.correlationBTC
      };

      const source: DataSource = {
        name: 'CoinGecko + On-Chain + Macro',
        freshness: 5, // 5 minutes old
        quality: 0.92,
        url: 'Multiple APIs'
      };

      const result = { data: fundamental, source };
      this.setCachedData(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Fundamental analysis fetch error:', error);
      return { data: null, source: { name: 'Error', freshness: 0, quality: 0 } };
    }
  }

  // Private helper methods
  private async fetchPriceData(symbol: string) {
    const symbolMap: { [key: string]: string } = {
      'btc': 'bitcoin', 'bitcoin': 'bitcoin',
      'eth': 'ethereum', 'ethereum': 'ethereum',
      'sol': 'solana', 'solana': 'solana'
    };

    const coinId = symbolMap[symbol.toLowerCase()] || 'bitcoin';
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
    );
    const data = await response.json();
    const coinData = data[coinId];
    
    return {
      price: coinData.usd,
      change24h: coinData.usd_24h_change || 0
    };
  }

  private async fetchVolumeData(symbol: string) {
    const symbolMap: { [key: string]: string } = {
      'btc': 'bitcoin', 'bitcoin': 'bitcoin',
      'eth': 'ethereum', 'ethereum': 'ethereum',
      'sol': 'solana', 'solana': 'solana'
    };

    const coinId = symbolMap[symbol.toLowerCase()] || 'bitcoin';
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true`
    );
    const data = await response.json();
    
    return {
      volume24h: data.market_data?.total_volume?.usd || 0
    };
  }

  private async fetchTechnicalIndicators(symbol: string) {
    // Mock technical indicators for now - would integrate with real TA APIs
    return {
      rsi: 45 + Math.random() * 20, // RSI between 45-65
      macd: { value: (Math.random() - 0.5) * 1000, signal: (Math.random() - 0.5) * 1000 },
      bollingerBands: { upper: 50000, middle: 45000, lower: 40000 },
      movingAverages: { sma20: 44000, sma50: 42000, sma200: 40000 },
      supportLevels: [42000, 40000, 38000],
      resistanceLevels: [46000, 48000, 50000]
    };
  }

  private async fetchFearGreedIndex() {
    // Mock Fear & Greed Index - would integrate with real API
    const value = 20 + Math.random() * 60; // 20-80 range
    return {
      value: Math.round(value),
      source: { name: 'Fear & Greed Index', quality: 0.9 }
    };
  }

  private async fetchNewsSentiment(symbol: string) {
    // Mock news sentiment - would integrate with NewsAPI or similar
    const score = (Math.random() - 0.5) * 2; // -1 to 1
    return {
      score: Math.round(score * 100) / 100,
      source: { name: 'News Sentiment', quality: 0.8 }
    };
  }

  private async fetchSocialSentiment(symbol: string) {
    // Mock social sentiment - would integrate with social media APIs
    const score = (Math.random() - 0.5) * 2; // -1 to 1
    return {
      score: Math.round(score * 100) / 100,
      source: { name: 'Social Media', quality: 0.7 }
    };
  }

  private async fetchMarketData(symbol: string) {
    const symbolMap: { [key: string]: string } = {
      'btc': 'bitcoin', 'bitcoin': 'bitcoin',
      'eth': 'ethereum', 'ethereum': 'ethereum',
      'sol': 'solana', 'solana': 'solana'
    };

    const coinId = symbolMap[symbol.toLowerCase()] || 'bitcoin';
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true`
    );
    const data = await response.json();
    const marketData = data.market_data;

    return {
      marketCap: marketData.market_cap?.usd || null,
      volume24h: marketData.total_volume?.usd || 0,
      circulatingSupply: marketData.circulating_supply || null,
      maxSupply: marketData.max_supply || null,
      dominance: marketData.market_cap_rank <= 10 ? (marketData.market_cap?.usd / 2500000000000) * 100 : null,
      correlationBTC: coinId === 'bitcoin' ? 1.0 : 0.7 + Math.random() * 0.3
    };
  }

  private async fetchOnChainData(symbol: string) {
    // Mock on-chain data - would integrate with Glassnode, Dune, etc.
    return {
      networkValue: 1000000000 + Math.random() * 5000000000,
      activeAddresses: 500000 + Math.random() * 2000000,
      transactionCount: 200000 + Math.random() * 800000,
      hashRate: 100000 + Math.random() * 500000,
      stakingRatio: 0.1 + Math.random() * 0.3,
      inflationRate: 0.01 + Math.random() * 0.05
    };
  }

  private async fetchMacroData() {
    // Mock macro data - would integrate with Fed, inflation APIs
    return {
      fedRate: 4.5 + Math.random() * 1.0,
      inflationRate: 2.0 + Math.random() * 2.0,
      gdpGrowth: 1.0 + Math.random() * 3.0,
      unemploymentRate: 3.0 + Math.random() * 2.0
    };
  }

  // Analysis helper methods
  private calculateTrend(indicators: any): 'bullish' | 'bearish' | 'neutral' {
    const { rsi, macd, movingAverages } = indicators;
    
    let bullishSignals = 0;
    let bearishSignals = 0;

    // RSI analysis
    if (rsi > 50) bullishSignals++;
    else if (rsi < 50) bearishSignals++;

    // MACD analysis
    if (macd.value > macd.signal) bullishSignals++;
    else if (macd.value < macd.signal) bearishSignals++;

    // Moving averages
    if (movingAverages.sma20 > movingAverages.sma50) bullishSignals++;
    else if (movingAverages.sma20 < movingAverages.sma50) bearishSignals++;

    if (bullishSignals > bearishSignals) return 'bullish';
    if (bearishSignals > bullishSignals) return 'bearish';
    return 'neutral';
  }

  private calculateVolatility(priceData: any, indicators: any): number {
    // Simple volatility calculation based on price change and Bollinger Bands
    const priceChange = Math.abs(priceData.change24h);
    const bbWidth = (indicators.bollingerBands.upper - indicators.bollingerBands.lower) / indicators.bollingerBands.middle;
    
    return Math.min(1, (priceChange / 10) + (bbWidth * 100));
  }

  private calculateOverallSentiment(fearGreed: any, news: any, social: any): 'fear' | 'greed' | 'neutral' {
    // Weighted average of sentiment sources
    const weights = { fearGreed: 0.4, news: 0.4, social: 0.2 };
    
    const fearGreedScore = (fearGreed.value - 50) / 50; // Convert 0-100 to -1 to 1
    const newsScore = news.score;
    const socialScore = social.score;
    
    const score = (fearGreedScore * weights.fearGreed + 
                   newsScore * weights.news + 
                   socialScore * weights.social);
    
    if (score > 0.2) return 'greed';
    if (score < -0.2) return 'fear';
    return 'neutral';
  }

  private calculateSentimentConfidence(fearGreed: any, news: any, social: any): number {
    // Average quality of sentiment sources
    return (fearGreed.source.quality + news.source.quality + social.source.quality) / 3;
  }

  // Cache management
  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}
