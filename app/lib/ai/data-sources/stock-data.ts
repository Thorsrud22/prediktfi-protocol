// app/lib/ai/data-sources/stock-data.ts
export interface StockData {
  symbol: string;
  price: number;
  marketCap: number;
  volume: number;
  priceChange: number;
  priceChangePercent: number;
  pe: number;
  eps: number;
  dividend: number;
  dividendYield: number;
  beta: number;
  high52Week: number;
  low52Week: number;
  lastUpdated: string;
}

export interface StockNews {
  title: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  source: string;
  publishedAt: string;
  url: string;
}

export interface MarketIndices {
  sp500: number;
  nasdaq: number;
  dow: number;
  vix: number; // Volatility index
  lastUpdated: string;
}

export class StockDataProvider {
  private static readonly YAHOO_FINANCE_API = 'https://query1.finance.yahoo.com/v8/finance/chart';
  private static readonly ALPHA_VANTAGE_API = 'https://www.alphavantage.co/query';
  private static readonly NEWS_API = 'https://newsapi.org/v2/everything';

  static async getStockData(symbol: string): Promise<StockData> {
    try {
      // Get basic price data from Yahoo Finance
      const priceData = await this.fetchFromYahooFinance(symbol);
      
      // Get additional metrics from Alpha Vantage (if available)
      const metricsData = await this.fetchFromAlphaVantage(symbol);
      
      return {
        symbol: symbol.toUpperCase(),
        price: priceData.price || 0,
        marketCap: priceData.marketCap || 0,
        volume: priceData.volume || 0,
        priceChange: priceData.priceChange || 0,
        priceChangePercent: priceData.priceChangePercent || 0,
        pe: metricsData.pe || 0,
        eps: metricsData.eps || 0,
        dividend: metricsData.dividend || 0,
        dividendYield: metricsData.dividendYield || 0,
        beta: metricsData.beta || 1.0,
        high52Week: priceData.high52Week || 0,
        low52Week: priceData.low52Week || 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return this.getDefaultStockData(symbol);
    }
  }

  static async getStockNews(symbol: string, limit: number = 10): Promise<StockNews[]> {
    try {
      const query = `${symbol} stock OR ${symbol} shares OR ${symbol} earnings`;
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
      console.error('Error fetching stock news:', error);
      return this.getDefaultStockNews();
    }
  }

  static async getMarketIndices(): Promise<MarketIndices> {
    try {
      const [sp500, nasdaq, dow, vix] = await Promise.all([
        this.fetchIndexData('^GSPC'),
        this.fetchIndexData('^IXIC'),
        this.fetchIndexData('^DJI'),
        this.fetchIndexData('^VIX')
      ]);
      
      return {
        sp500: sp500.price || 0,
        nasdaq: nasdaq.price || 0,
        dow: dow.price || 0,
        vix: vix.price || 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching market indices:', error);
      return this.getDefaultMarketIndices();
    }
  }

  private static async fetchFromYahooFinance(symbol: string): Promise<any> {
    const response = await fetch(`${this.YAHOO_FINANCE_API}/${symbol}`);
    
    if (!response.ok) {
      throw new Error('Yahoo Finance API request failed');
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
      throw new Error('No data found for symbol');
    }
    
    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    
    return {
      price: meta.regularMarketPrice || 0,
      marketCap: meta.marketCap || 0,
      volume: quote?.volume?.[0] || 0,
      priceChange: meta.regularMarketPrice - meta.previousClose || 0,
      priceChangePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100 || 0,
      high52Week: meta.fiftyTwoWeekHigh || 0,
      low52Week: meta.fiftyTwoWeekLow || 0
    };
  }

  private static async fetchFromAlphaVantage(symbol: string): Promise<any> {
    // This would require an API key, so we'll return default values for now
    return {
      pe: 0,
      eps: 0,
      dividend: 0,
      dividendYield: 0,
      beta: 1.0
    };
  }

  private static async fetchIndexData(symbol: string): Promise<any> {
    const response = await fetch(`${this.YAHOO_FINANCE_API}/${symbol}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${symbol} data`);
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
      throw new Error(`No data found for ${symbol}`);
    }
    
    const meta = result.meta;
    
    return {
      price: meta.regularMarketPrice || 0
    };
  }

  private static analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['bullish', 'growth', 'earnings', 'beat', 'surge', 'rally', 'upgrade', 'positive', 'strong'];
    const negativeWords = ['bearish', 'decline', 'miss', 'crash', 'fall', 'downgrade', 'negative', 'weak', 'loss'];
    
    const textLower = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private static getDefaultStockData(symbol: string): StockData {
    return {
      symbol: symbol.toUpperCase(),
      price: 0,
      marketCap: 0,
      volume: 0,
      priceChange: 0,
      priceChangePercent: 0,
      pe: 0,
      eps: 0,
      dividend: 0,
      dividendYield: 0,
      beta: 1.0,
      high52Week: 0,
      low52Week: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  private static getDefaultStockNews(): StockNews[] {
    return [
      {
        title: 'Market Update',
        summary: 'General market sentiment and trends',
        sentiment: 'neutral',
        source: 'Financial News',
        publishedAt: new Date().toISOString(),
        url: '#'
      }
    ];
  }

  private static getDefaultMarketIndices(): MarketIndices {
    return {
      sp500: 0,
      nasdaq: 0,
      dow: 0,
      vix: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}
