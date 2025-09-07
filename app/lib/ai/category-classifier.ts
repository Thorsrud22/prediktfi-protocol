// app/lib/ai/category-classifier.ts
export interface ClassificationResult {
  category: 'crypto' | 'stocks' | 'tech' | 'politics' | 'sports' | 'general';
  confidence: number;
  dataSources: string[];
  analysisType: 'technical' | 'fundamental' | 'sentiment' | 'mixed';
  keywords: string[];
  marketContext: {
    hasRealTimeData: boolean;
    volatilityLevel: 'low' | 'medium' | 'high';
    timeSensitivity: 'low' | 'medium' | 'high';
  };
}

export class CategoryClassifier {
  private static readonly CRYPTO_KEYWORDS = [
    'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'cardano', 'ada',
    'crypto', 'cryptocurrency', 'blockchain', 'defi', 'nft', 'token',
    'binance', 'coinbase', 'kraken', 'uniswap', 'pancakeswap',
    'hodl', 'moon', 'diamond hands', 'fomo', 'fud'
  ];

  private static readonly STOCK_KEYWORDS = [
    'stock', 'stocks', 'equity', 'equities', 'nasdaq', 'nyse', 's&p',
    'tesla', 'apple', 'microsoft', 'google', 'amazon', 'meta', 'nvidia',
    'earnings', 'dividend', 'p/e ratio', 'market cap', 'ipo', 'merger',
    'bull market', 'bear market', 'recession', 'inflation'
  ];

  private static readonly TECH_KEYWORDS = [
    'ai', 'artificial intelligence', 'machine learning', 'gpt', 'chatgpt',
    'openai', 'google', 'microsoft', 'apple', 'meta', 'nvidia',
    'startup', 'unicorn', 'ipo', 'funding', 'venture capital',
    'software', 'hardware', 'cloud', 'saas', 'api', 'platform'
  ];

  private static readonly POLITICS_KEYWORDS = [
    'election', 'president', 'congress', 'senate', 'house', 'democrat',
    'republican', 'biden', 'trump', 'harris', 'pence', 'governor',
    'policy', 'legislation', 'bill', 'law', 'regulation', 'tax',
    'immigration', 'healthcare', 'climate', 'energy', 'defense'
  ];

  private static readonly SPORTS_KEYWORDS = [
    'football', 'soccer', 'basketball', 'baseball', 'hockey', 'tennis',
    'golf', 'olympics', 'world cup', 'championship', 'playoff',
    'nfl', 'nba', 'mlb', 'nhl', 'fifa', 'uefa', 'ncaa',
    'player', 'team', 'coach', 'draft', 'trade', 'contract'
  ];

  static classifyQuestion(question: string, topic?: string): ClassificationResult {
    const fullText = `${topic || ''} ${question}`.toLowerCase();
    
    // Count keyword matches for each category
    const cryptoScore = this.countKeywordMatches(fullText, this.CRYPTO_KEYWORDS);
    const stockScore = this.countKeywordMatches(fullText, this.STOCK_KEYWORDS);
    const techScore = this.countKeywordMatches(fullText, this.TECH_KEYWORDS);
    const politicsScore = this.countKeywordMatches(fullText, this.POLITICS_KEYWORDS);
    const sportsScore = this.countKeywordMatches(fullText, this.SPORTS_KEYWORDS);

    // Determine primary category
    const scores = {
      crypto: cryptoScore,
      stocks: stockScore,
      tech: techScore,
      politics: politicsScore,
      sports: sportsScore,
      general: 0
    };

    const maxScore = Math.max(...Object.values(scores));
    const primaryCategory = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as keyof typeof scores || 'general';

    // Calculate confidence based on score distribution
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const confidence = totalScore > 0 ? maxScore / totalScore : 0.1;

    // Determine analysis type based on category and keywords
    const analysisType = this.determineAnalysisType(primaryCategory, fullText);

    // Get relevant data sources
    const dataSources = this.getDataSources(primaryCategory);

    // Extract relevant keywords
    const keywords = this.extractKeywords(fullText, primaryCategory);

    // Determine market context
    const marketContext = this.determineMarketContext(primaryCategory, fullText);

    return {
      category: primaryCategory,
      confidence: Math.min(0.95, Math.max(0.1, confidence)),
      dataSources,
      analysisType,
      keywords,
      marketContext
    };
  }

  private static countKeywordMatches(text: string, keywords: string[]): number {
    return keywords.reduce((count, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  private static determineAnalysisType(category: string, text: string): 'technical' | 'fundamental' | 'sentiment' | 'mixed' {
    const technicalKeywords = ['price', 'chart', 'technical', 'indicator', 'trend', 'support', 'resistance', 'volume'];
    const fundamentalKeywords = ['earnings', 'revenue', 'profit', 'growth', 'valuation', 'pe ratio', 'market cap'];
    const sentimentKeywords = ['sentiment', 'mood', 'fear', 'greed', 'optimism', 'pessimism', 'bullish', 'bearish'];

    const technicalScore = this.countKeywordMatches(text, technicalKeywords);
    const fundamentalScore = this.countKeywordMatches(text, fundamentalKeywords);
    const sentimentScore = this.countKeywordMatches(text, sentimentKeywords);

    if (category === 'crypto' || category === 'stocks') {
      if (technicalScore > fundamentalScore && technicalScore > sentimentScore) return 'technical';
      if (fundamentalScore > technicalScore && fundamentalScore > sentimentScore) return 'fundamental';
      if (sentimentScore > technicalScore && sentimentScore > fundamentalScore) return 'sentiment';
    }

    if (category === 'tech') return 'fundamental';
    if (category === 'politics') return 'sentiment';
    if (category === 'sports') return 'mixed';

    return 'mixed';
  }

  private static getDataSources(category: string): string[] {
    const dataSourceMap = {
      crypto: ['CoinGecko', 'Fear & Greed Index', 'CryptoNews', 'TradingView', 'CoinMarketCap'],
      stocks: ['Yahoo Finance', 'Alpha Vantage', 'Financial News', 'MarketWatch', 'Bloomberg'],
      tech: ['GitHub', 'Hacker News', 'TechCrunch', 'Product Hunt', 'Stack Overflow'],
      politics: ['News APIs', 'Politico', 'Reuters', 'AP News', 'BBC News'],
      sports: ['ESPN', 'Sports News', 'Team Stats', 'Player Stats', 'League Data'],
      general: ['Wikipedia', 'Google Trends', 'News APIs', 'General Knowledge', 'Web Search']
    };

    return dataSourceMap[category as keyof typeof dataSourceMap] || dataSourceMap.general;
  }

  private static extractKeywords(text: string, category: string): string[] {
    const allKeywords = [
      ...this.CRYPTO_KEYWORDS,
      ...this.STOCK_KEYWORDS,
      ...this.TECH_KEYWORDS,
      ...this.POLITICS_KEYWORDS,
      ...this.SPORTS_KEYWORDS
    ];

    const foundKeywords = allKeywords.filter(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      return regex.test(text);
    });

    return foundKeywords.slice(0, 10); // Limit to top 10 keywords
  }

  private static determineMarketContext(
    category: string, 
    text: string
  ): { hasRealTimeData: boolean; volatilityLevel: 'low' | 'medium' | 'high'; timeSensitivity: 'low' | 'medium' | 'high' } {
    const hasRealTimeData = ['crypto', 'stocks', 'tech'].includes(category);
    
    const volatilityKeywords = ['volatile', 'volatility', 'crash', 'surge', 'spike', 'drop', 'rally'];
    const volatilityScore = this.countKeywordMatches(text, volatilityKeywords);
    const volatilityLevel = volatilityScore > 2 ? 'high' : volatilityScore > 0 ? 'medium' : 'low';

    const timeKeywords = ['today', 'tomorrow', 'this week', 'this month', 'urgent', 'breaking', 'live'];
    const timeScore = this.countKeywordMatches(text, timeKeywords);
    const timeSensitivity = timeScore > 2 ? 'high' : timeScore > 0 ? 'medium' : 'low';

    return {
      hasRealTimeData,
      volatilityLevel,
      timeSensitivity
    };
  }

  // Helper method to get category-specific analysis prompts
  static getCategoryPrompt(category: string, analysisType: string): string {
    const prompts = {
      crypto: {
        technical: "Analyze technical indicators, price patterns, and market structure for this cryptocurrency prediction.",
        fundamental: "Evaluate the fundamental value, adoption metrics, and long-term viability of this cryptocurrency.",
        sentiment: "Assess market sentiment, fear/greed levels, and community mood around this cryptocurrency.",
        mixed: "Provide a comprehensive analysis combining technical, fundamental, and sentiment factors for this cryptocurrency."
      },
      stocks: {
        technical: "Analyze technical indicators, chart patterns, and trading volume for this stock prediction.",
        fundamental: "Evaluate financial metrics, earnings potential, and company fundamentals for this stock.",
        sentiment: "Assess market sentiment, analyst opinions, and investor confidence around this stock.",
        mixed: "Provide a comprehensive analysis combining technical, fundamental, and sentiment factors for this stock."
      },
      tech: {
        technical: "Analyze technical implementation, code quality, and system architecture for this tech prediction.",
        fundamental: "Evaluate business model, market opportunity, and competitive positioning for this tech company.",
        sentiment: "Assess developer sentiment, user adoption, and community engagement around this tech product.",
        mixed: "Provide a comprehensive analysis combining technical, fundamental, and sentiment factors for this tech prediction."
      },
      politics: {
        technical: "Analyze polling data, voting patterns, and statistical trends for this political prediction.",
        fundamental: "Evaluate policy positions, candidate qualifications, and historical voting records.",
        sentiment: "Assess public opinion, media coverage, and voter enthusiasm around this political issue.",
        mixed: "Provide a comprehensive analysis combining polling data, policy analysis, and sentiment factors for this political prediction."
      },
      sports: {
        technical: "Analyze player statistics, team performance metrics, and historical matchups for this sports prediction.",
        fundamental: "Evaluate team strength, player form, and strategic advantages for this sports prediction.",
        sentiment: "Assess fan sentiment, media coverage, and psychological factors affecting this sports prediction.",
        mixed: "Provide a comprehensive analysis combining statistics, team analysis, and sentiment factors for this sports prediction."
      },
      general: {
        technical: "Analyze available data, trends, and patterns for this general prediction.",
        fundamental: "Evaluate underlying factors, causes, and logical reasoning for this general prediction.",
        sentiment: "Assess public opinion, media coverage, and social sentiment around this general topic.",
        mixed: "Provide a comprehensive analysis combining data analysis, logical reasoning, and sentiment factors for this general prediction."
      }
    };

    return prompts[category as keyof typeof prompts]?.[analysisType as keyof typeof prompts[keyof typeof prompts]] || 
           "Provide a comprehensive analysis for this prediction.";
  }
}
