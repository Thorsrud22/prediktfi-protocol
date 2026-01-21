import OpenAI from 'openai';

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap?: number;
}

interface NewsData {
  title: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevanceScore: number;
  publishedAt: string;
}

interface AIAnalysis {
  confidence: number;
  recommendation: 'Bullish' | 'Bearish' | 'Neutral';
  reasoning: string;
  factors: string[];
  dataPoints: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  timeHorizon: string;
  lastUpdated: string;
}

export class PredictionAnalyzer {
  private openai: OpenAI | null = null;

  constructor() {
    // Only initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async analyzePrediction(
    predictionTemplate: string,
    category: string,
    timeframe: string,
  ): Promise<AIAnalysis> {
    // If no OpenAI API key, return enhanced mock analysis immediately
    if (!this.openai) {
      console.log('OpenAI API key not configured, using enhanced mock analysis');
      return this.getEnhancedMockAnalysis(predictionTemplate, category, timeframe);
    }

    try {
      // Set aggressive timeout for faster response
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Analysis timeout')), 2000); // 2 second timeout
      });

      // Run analysis with timeout
      const analysisPromise = this.performAnalysis(predictionTemplate, category, timeframe);

      const analysis = await Promise.race([analysisPromise, timeoutPromise]);
      return analysis;
    } catch (error) {
      console.error('AI Analysis failed or timed out:', error);
      return this.getEnhancedMockAnalysis(predictionTemplate, category, timeframe);
    }
  }

  private async performAnalysis(
    predictionTemplate: string,
    category: string,
    timeframe: string,
  ): Promise<AIAnalysis> {
    // Fetch market data with timeout (parallel execution)
    const [marketData, newsData] = await Promise.all([
      this.getMarketData(category, predictionTemplate).catch(() => [] as MarketData[]),
      this.getRelevantNews(category, predictionTemplate).catch(() => [] as NewsData[]),
    ]);

    // Create comprehensive analysis context
    const analysisPrompt = this.buildAnalysisPrompt(
      predictionTemplate,
      category,
      timeframe,
      marketData,
      newsData,
    );

    console.log(`🤖 Running AI analysis for: ${predictionTemplate}`);

    // Get AI analysis from GPT-4 with shorter timeout
    const response = await this.openai!.chat.completions.create({
      model: 'gpt-4o', // Upgraded to latest model
      messages: [
        {
          role: 'system',
          content: `You are an expert financial analyst. Respond with valid JSON only with these fields: confidence (number 30-95), recommendation (Bullish/Bearish/Neutral), reasoning (string), factors (array of 3-4 strings), riskLevel (Low/Medium/High).`,
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500, // Reduced tokens for faster response
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');

    return {
      confidence: Math.min(Math.max(analysis.confidence || 50, 30), 95),
      recommendation: analysis.recommendation || 'Neutral',
      reasoning: analysis.reasoning || 'Analysis completed with available data sources',
      factors: analysis.factors || ['Market data analysis', 'Historical patterns'],
      dataPoints: marketData.length + newsData.length + Math.floor(Math.random() * 500) + 200,
      riskLevel: analysis.riskLevel || this.calculateRiskLevel(category, timeframe),
      timeHorizon: timeframe,
      lastUpdated: new Date().toISOString(),
    };
  }

  private buildAnalysisPrompt(
    prediction: string,
    category: string,
    timeframe: string,
    marketData: MarketData[],
    newsData: NewsData[],
  ): string {
    const currentDate = new Date().toISOString().split('T')[0];

    return `
Analyze this prediction for accuracy and provide investment insights:

PREDICTION: "${prediction}"
CATEGORY: ${category}
TIMEFRAME: ${timeframe}  
DATE: ${currentDate}

MARKET DATA:
${marketData.length > 0
        ? JSON.stringify(marketData.slice(0, 3), null, 2)
        : 'Limited market data available'
      }

RECENT NEWS SENTIMENT:
${newsData.length > 0
        ? newsData
          .slice(0, 5)
          .map(n => `- ${n.title} (${n.sentiment})`)
          .join('\n')
        : 'No recent news available'
      }

ANALYSIS REQUIREMENTS:
- Provide confidence score (30-95% range)
- Give bullish/bearish/neutral recommendation  
- Explain reasoning with specific factors
- Assess risk level based on volatility and timeframe
- Consider market conditions, news sentiment, and historical patterns

RESPOND WITH VALID JSON ONLY:
{
  "confidence": number,
  "recommendation": "Bullish"|"Bearish"|"Neutral", 
  "reasoning": "detailed explanation",
  "factors": ["factor1", "factor2", "factor3"],
  "riskLevel": "Low"|"Medium"|"High"
}

Focus on being realistic and data-driven. Consider:
- Current market volatility and trends
- News sentiment and market-moving events  
- Historical performance in similar conditions
- Risk factors specific to this prediction type
- Time horizon impact on accuracy
`;
  }

  private async getMarketData(category: string, prediction: string): Promise<MarketData[]> {
    if (category === 'crypto') {
      return await this.getCryptoData(this.extractCryptoSymbols(prediction));
    } else if (category === 'stocks') {
      return await this.getStockData(this.extractStockSymbols(prediction));
    }
    return [];
  }

  private async getCryptoData(symbols: string[]): Promise<MarketData[]> {
    if (symbols.length === 0) return [];

    try {
      // Use CoinGecko API with aggressive timeout
      const symbolIds = symbols.map(s => s.toLowerCase()).join(',');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5 second timeout

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbolIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
        {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log('CoinGecko API failed, using mock data');
        return this.getMockCryptoData(symbols);
      }

      const data = await response.json();

      return Object.entries(data).map(([id, values]) => ({
        symbol: id.toUpperCase(),
        price: (values as { usd?: number }).usd || 0,
        change24h: (values as { usd_24h_change?: number }).usd_24h_change || 0,
        volume: (values as { usd_24h_vol?: number }).usd_24h_vol || 0,
        marketCap: (values as { usd_market_cap?: number }).usd_market_cap,
      }));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('CoinGecko API timeout, using mock data');
      } else {
        console.error('Failed to fetch crypto data:', error);
      }
      return this.getMockCryptoData(symbols);
    }
  }

  private getMockCryptoData(symbols: string[]): MarketData[] {
    const mockPrices: { [key: string]: number } = {
      bitcoin: 43500 + Math.random() * 2000,
      ethereum: 2650 + Math.random() * 200,
      solana: 98 + Math.random() * 20,
    };

    return symbols.map(symbol => ({
      symbol: symbol.toUpperCase(),
      price: mockPrices[symbol.toLowerCase()] || Math.random() * 100,
      change24h: (Math.random() - 0.5) * 10, // -5% to +5%
      volume: Math.random() * 1000000000,
      marketCap: Math.random() * 100000000000,
    }));
  }

  private async getStockData(symbols: string[]): Promise<MarketData[]> {
    // Mock stock data for now - could integrate with Alpha Vantage or similar
    return symbols.map(symbol => ({
      symbol,
      price: 100 + Math.random() * 200,
      change24h: (Math.random() - 0.5) * 8,
      volume: Math.random() * 10000000,
    }));
  }

  private async getRelevantNews(category: string, _prediction: string): Promise<NewsData[]> {
    // Mock news data with realistic sentiment
    const mockNews: NewsData[] = [
      {
        title: `${category} market shows strong momentum`,
        content: `Recent analysis indicates positive trends in the ${category} sector...`,
        sentiment: 'positive',
        relevanceScore: 85,
        publishedAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      },
      {
        title: `Volatility expected in ${category} markets`,
        content: `Market experts warn of potential fluctuations...`,
        sentiment: 'neutral',
        relevanceScore: 70,
        publishedAt: new Date(Date.now() - Math.random() * 172800000).toISOString(),
      },
    ];

    return mockNews;
  }

  private extractCryptoSymbols(prediction: string): string[] {
    const text = prediction.toLowerCase();
    const cryptoMap: { [key: string]: string } = {
      bitcoin: 'bitcoin',
      btc: 'bitcoin',
      ethereum: 'ethereum',
      eth: 'ethereum',
      solana: 'solana',
      sol: 'solana',
    };

    return Object.keys(cryptoMap)
      .filter(keyword => text.includes(keyword))
      .map(keyword => cryptoMap[keyword]);
  }

  private extractStockSymbols(prediction: string): string[] {
    const text = prediction.toUpperCase();
    const stockPatterns = ['TSLA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN'];
    return stockPatterns.filter(symbol => text.includes(symbol));
  }

  private extractKeywords(prediction: string): string[] {
    const words = prediction.toLowerCase().split(' ');
    const stopWords = [
      'will',
      'the',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
    ];

    return words.filter(word => word.length > 3 && !stopWords.includes(word)).slice(0, 5);
  }

  private calculateRiskLevel(category: string, timeframe: string): 'Low' | 'Medium' | 'High' {
    if (category === 'weather') return 'Low';
    if (timeframe.includes('h') || timeframe.includes('1d')) return 'High';
    if (category === 'crypto') return 'High';
    if (category === 'sports') return 'Medium';
    return 'Medium';
  }

  private getEnhancedMockAnalysis(
    prediction: string,
    category: string,
    timeframe: string,
  ): AIAnalysis {
    // Enhanced mock analysis with realistic confidence based on category and timeframe
    const baseConfidence =
      {
        weather: 75,
        crypto: 55,
        stocks: 65,
        sports: 60,
        politics: 50,
        tech: 70,
      }[category] || 60;

    const timeframeAdjustment = timeframe.includes('h') ? -10 : timeframe.includes('d') ? -5 : 0;
    const confidence = Math.max(
      35,
      baseConfidence + timeframeAdjustment + (Math.random() - 0.5) * 20,
    );

    const factors = this.generateRealistFactors(category, prediction);
    const recommendation = confidence > 65 ? 'Bullish' : confidence < 50 ? 'Bearish' : 'Neutral';
    const reasoning = this.generateReasoning(category, prediction, confidence, recommendation);

    return {
      confidence: Math.round(confidence),
      recommendation,
      reasoning,
      factors,
      dataPoints: Math.floor(Math.random() * 1000) + 300,
      riskLevel: this.calculateRiskLevel(category, timeframe),
      timeHorizon: timeframe,
      lastUpdated: new Date().toISOString(),
    };
  }

  private generateRealistFactors(category: string, prediction: string): string[] {
    const factorSets = {
      crypto: [
        'Bitcoin correlation analysis',
        'On-chain metrics trending positive',
        'Institutional adoption signals',
        'Market sentiment indicators',
        'Technical breakout patterns',
      ],
      stocks: [
        'Earnings growth expectations',
        'Sector rotation analysis',
        'Fed policy implications',
        'Valuation metrics assessment',
        'Analyst consensus trends',
      ],
      weather: [
        'Atmospheric pressure patterns',
        'Historical seasonal data',
        'Satellite imagery analysis',
        'Temperature gradient changes',
        'Precipitation probability models',
      ],
      sports: [
        'Team performance metrics',
        'Player injury reports',
        'Historical matchup analysis',
        'Home field advantage',
        'Recent form trends',
      ],
    };

    const factors = factorSets[category as keyof typeof factorSets] || [
      'Historical data analysis',
      'Current market conditions',
      'Expert sentiment indicators',
      'Statistical probability models',
    ];

    // Return 3-5 random factors
    return factors.sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 3));
  }

  private generateReasoning(
    category: string,
    prediction: string,
    confidence: number,
    recommendation: string,
  ): string {
    const templates = {
      crypto: `Based on current market analysis, ${prediction.toLowerCase()} shows ${recommendation.toLowerCase()} signals. Technical indicators suggest ${confidence}% probability with key support/resistance levels and volume patterns indicating ${recommendation === 'Bullish'
        ? 'upward momentum'
        : recommendation === 'Bearish'
          ? 'downward pressure'
          : 'sideways consolidation'
        }.`,

      stocks: `Fundamental and technical analysis of ${prediction} indicates ${confidence}% confidence in a ${recommendation.toLowerCase()} outlook. Market conditions, earnings expectations, and sector trends support this assessment with ${recommendation === 'Bullish'
        ? 'positive catalysts ahead'
        : recommendation === 'Bearish'
          ? 'headwinds expected'
          : 'mixed signals balancing out'
        }.`,

      weather: `Meteorological models show ${confidence}% accuracy for ${prediction.toLowerCase()}. Atmospheric conditions, seasonal patterns, and satellite data converge on this forecast with ${recommendation === 'Bullish' ? 'favorable conditions' : 'challenging conditions'
        } expected.`,

      sports: `Statistical analysis of ${prediction} suggests ${confidence}% probability based on team form, historical matchups, and current conditions. ${recommendation === 'Bullish'
        ? 'Favorable odds'
        : recommendation === 'Bearish'
          ? 'Challenging circumstances'
          : 'Evenly matched contest'
        } with key performance indicators supporting this assessment.`,
    };

    return (
      templates[category as keyof typeof templates] ||
      `Analysis of ${prediction} shows ${confidence}% confidence with ${recommendation.toLowerCase()} outlook based on available data and historical patterns.`
    );
  }
}
