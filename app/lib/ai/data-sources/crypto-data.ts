// app/lib/ai/data-sources/crypto-data.ts
export interface CryptoData {
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  fearGreedIndex: number;
  dominance: number;
  circulatingSupply: number;
  maxSupply: number;
  allTimeHigh: number;
  allTimeLow: number;
  lastUpdated: string;
}

export interface CryptoNews {
  title: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  source: string;
  publishedAt: string;
  url: string;
}

export interface CryptoMarketData {
  totalMarketCap: number;
  totalVolume24h: number;
  activeCurrencies: number;
  marketCapChange24h: number;
  dominance: {
    bitcoin: number;
    ethereum: number;
    others: number;
  };
}

export class CryptoDataProvider {
  private static readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private static readonly FEAR_GREED_API = 'https://api.alternative.me/fng/';
  private static readonly NEWS_API = 'https://newsapi.org/v2/everything';

  static async getCryptoData(symbol: string): Promise<CryptoData> {
    try {
      // Get basic price data from CoinGecko
      const priceData = await this.fetchFromCoinGecko(symbol);
      
      // Get Fear & Greed Index
      const fearGreedData = await this.fetchFearGreedIndex();
      
      // Combine data
      return {
        price: priceData.current_price || 0,
        marketCap: priceData.market_cap || 0,
        volume24h: priceData.total_volume || 0,
        priceChange24h: priceData.price_change_percentage_24h || 0,
        priceChange7d: priceData.price_change_percentage_7d_in_currency || 0,
        priceChange30d: priceData.price_change_percentage_30d_in_currency || 0,
        fearGreedIndex: fearGreedData.value || 50,
        dominance: priceData.market_cap_rank ? 100 - (priceData.market_cap_rank / 100) : 0,
        circulatingSupply: priceData.circulating_supply || 0,
        maxSupply: priceData.max_supply || 0,
        allTimeHigh: priceData.ath || 0,
        allTimeLow: priceData.atl || 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching crypto data:', error);
      return this.getDefaultCryptoData();
    }
  }

  static async getCryptoNews(symbol: string, limit: number = 10): Promise<CryptoNews[]> {
    try {
      const query = `${symbol} cryptocurrency OR ${symbol} crypto`;
      const response = await fetch(
        `${this.NEWS_API}?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${limit}&apiKey=${process.env.NEWS_API_KEY || 'demo'}`
      );
      
      if (!response.ok) {
        throw new Error('News API request failed');
      }
      
      const data = await response.json();
      
      return data.articles?.map((article: any) => ({
        title: article.title,
        summary: article.description,
        sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
        source: article.source.name,
        publishedAt: article.publishedAt,
        url: article.url
      })) || [];
    } catch (error) {
      console.error('Error fetching crypto news:', error);
      return this.getDefaultCryptoNews();
    }
  }

  static async getMarketData(): Promise<CryptoMarketData> {
    try {
      const response = await fetch(`${this.COINGECKO_API}/global`);
      
      if (!response.ok) {
        throw new Error('CoinGecko API request failed');
      }
      
      const data = await response.json();
      const globalData = data.data;
      
      return {
        totalMarketCap: globalData.total_market_cap?.usd || 0,
        totalVolume24h: globalData.total_volume?.usd || 0,
        activeCurrencies: globalData.active_cryptocurrencies || 0,
        marketCapChange24h: globalData.market_cap_change_percentage_24h_usd || 0,
        dominance: {
          bitcoin: globalData.market_cap_percentage?.btc || 0,
          ethereum: globalData.market_cap_percentage?.eth || 0,
          others: 100 - (globalData.market_cap_percentage?.btc || 0) - (globalData.market_cap_percentage?.eth || 0)
        }
      };
    } catch (error) {
      console.error('Error fetching market data:', error);
      return this.getDefaultMarketData();
    }
  }

  private static async fetchFromCoinGecko(symbol: string): Promise<any> {
    const coinId = this.getCoinGeckoId(symbol);
    const response = await fetch(
      `${this.COINGECKO_API}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
    );
    
    if (!response.ok) {
      throw new Error('CoinGecko API request failed');
    }
    
    return await response.json();
  }

  private static async fetchFearGreedIndex(): Promise<any> {
    const response = await fetch(this.FEAR_GREED_API);
    
    if (!response.ok) {
      throw new Error('Fear & Greed API request failed');
    }
    
    const data = await response.json();
    return data.data?.[0] || { value: 50 };
  }

  private static getCoinGeckoId(symbol: string): string {
    const symbolMap: { [key: string]: string } = {
      'btc': 'bitcoin',
      'bitcoin': 'bitcoin',
      'eth': 'ethereum',
      'ethereum': 'ethereum',
      'sol': 'solana',
      'solana': 'solana',
      'ada': 'cardano',
      'cardano': 'cardano',
      'matic': 'matic-network',
      'polygon': 'matic-network',
      'avax': 'avalanche-2',
      'avalanche': 'avalanche-2',
      'dot': 'polkadot',
      'polkadot': 'polkadot',
      'link': 'chainlink',
      'chainlink': 'chainlink'
    };
    
    return symbolMap[symbol.toLowerCase()] || 'bitcoin';
  }

  private static analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['bullish', 'moon', 'pump', 'surge', 'rally', 'breakthrough', 'adoption', 'growth', 'success'];
    const negativeWords = ['bearish', 'crash', 'dump', 'fall', 'decline', 'fear', 'uncertainty', 'risk', 'volatility'];
    
    const textLower = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private static getDefaultCryptoData(): CryptoData {
    return {
      price: 0,
      marketCap: 0,
      volume24h: 0,
      priceChange24h: 0,
      priceChange7d: 0,
      priceChange30d: 0,
      fearGreedIndex: 50,
      dominance: 0,
      circulatingSupply: 0,
      maxSupply: 0,
      allTimeHigh: 0,
      allTimeLow: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  private static getDefaultCryptoNews(): CryptoNews[] {
    return [
      {
        title: 'Crypto Market Update',
        summary: 'General market sentiment and trends',
        sentiment: 'neutral',
        source: 'CryptoNews',
        publishedAt: new Date().toISOString(),
        url: '#'
      }
    ];
  }

  private static getDefaultMarketData(): CryptoMarketData {
    return {
      totalMarketCap: 0,
      totalVolume24h: 0,
      activeCurrencies: 0,
      marketCapChange24h: 0,
      dominance: {
        bitcoin: 0,
        ethereum: 0,
        others: 100
      }
    };
  }
}
