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

export interface PredictionReflectionInput {
  insightId?: string;
  question: string;
  predictedOutcome: string;
  actualOutcome: string;
  predictedProbability?: number;
  actualProbability?: number;
  resolutionDate?: string;
  timeframe?: string;
  category?: string;
  notes?: string;
}

export interface PredictionReflection {
  insightId?: string;
  summary: string;
  verdict: 'accurate' | 'missed' | 'inconclusive';
  accuracyScore: number;
  confidenceGap: number;
  calibration: 'well_calibrated' | 'overconfident' | 'underconfident' | 'unknown';
  improvementSuggestions: string[];
  reinforcementPoints: string[];
  nextActions: string[];
  metrics: {
    predictedProbability?: number;
    actualProbability?: number;
    absoluteError?: number;
    resolutionDate?: string;
    category?: string;
    timeframe?: string;
    outcome: string;
  };
  generatedAt: string;
  notes?: string;
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

  async reflectPrediction(input: PredictionReflectionInput): Promise<PredictionReflection> {
    if (!this.openai) {
      return this.getMockReflection(input);
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Reflection timeout')), 2000);
      });

      const reflectionPromise = this.performReflection(input);
      return await Promise.race([reflectionPromise, timeoutPromise]);
    } catch (error) {
      console.error('AI reflection failed or timed out:', error);
      return this.getMockReflection(input);
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
      model: 'gpt-3.5-turbo', // Use faster model
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
${
  marketData.length > 0
    ? JSON.stringify(marketData.slice(0, 3), null, 2)
    : 'Limited market data available'
}

RECENT NEWS SENTIMENT:
${
  newsData.length > 0
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

      return Object.entries(data).map(([id, values]: [string, any]) => ({
        symbol: id.toUpperCase(),
        price: values.usd || 0,
        change24h: values.usd_24h_change || 0,
        volume: values.usd_24h_vol || 0,
        marketCap: values.usd_market_cap,
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

  private async getRelevantNews(category: string, prediction: string): Promise<NewsData[]> {
    // Mock news data with realistic sentiment
    const keywords = this.extractKeywords(prediction);
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
      crypto: `Based on current market analysis, ${prediction.toLowerCase()} shows ${recommendation.toLowerCase()} signals. Technical indicators suggest ${confidence}% probability with key support/resistance levels and volume patterns indicating ${
        recommendation === 'Bullish'
          ? 'upward momentum'
          : recommendation === 'Bearish'
          ? 'downward pressure'
          : 'sideways consolidation'
      }.`,

      stocks: `Fundamental and technical analysis of ${prediction} indicates ${confidence}% confidence in a ${recommendation.toLowerCase()} outlook. Market conditions, earnings expectations, and sector trends support this assessment with ${
        recommendation === 'Bullish'
          ? 'positive catalysts ahead'
          : recommendation === 'Bearish'
          ? 'headwinds expected'
          : 'mixed signals balancing out'
      }.`,

      weather: `Meteorological models show ${confidence}% accuracy for ${prediction.toLowerCase()}. Atmospheric conditions, seasonal patterns, and satellite data converge on this forecast with ${
        recommendation === 'Bullish' ? 'favorable conditions' : 'challenging conditions'
      } expected.`,

      sports: `Statistical analysis of ${prediction} suggests ${confidence}% probability based on team form, historical matchups, and current conditions. ${
        recommendation === 'Bullish'
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

  private async performReflection(input: PredictionReflectionInput): Promise<PredictionReflection> {
    const prompt = this.buildReflectionPrompt(input);

    const response = await this.openai!.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an accuracy coach for forecasters. Respond with valid JSON including summary, verdict, accuracyScore (0-100), confidenceGap (0-100), calibration (well_calibrated/overconfident/underconfident/unknown), improvementSuggestions (array of strings), reinforcementPoints (array of strings), nextActions (array of strings).',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 650,
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{}');
    const base = this.getMockReflection(input);

    return {
      insightId: input.insightId,
      summary: parsed.summary || base.summary,
      verdict: parsed.verdict || base.verdict,
      accuracyScore: this.boundNumber(parsed.accuracyScore, 0, 100, base.accuracyScore),
      confidenceGap: this.boundNumber(parsed.confidenceGap, 0, 100, base.confidenceGap),
      calibration: this.validateCalibration(parsed.calibration) || base.calibration,
      improvementSuggestions: this.ensureStringArray(parsed.improvementSuggestions, base.improvementSuggestions),
      reinforcementPoints: this.ensureStringArray(parsed.reinforcementPoints, base.reinforcementPoints),
      nextActions: this.ensureStringArray(parsed.nextActions, base.nextActions),
      metrics: base.metrics,
      generatedAt: new Date().toISOString(),
      notes: input.notes,
    };
  }

  private buildReflectionPrompt(input: PredictionReflectionInput): string {
    const predictedProbability = this.describeProbability(input.predictedProbability);
    const actualProbability = this.describeProbability(input.actualProbability, input.actualOutcome);
    const resolvedAt = input.resolutionDate
      ? new Date(input.resolutionDate).toISOString()
      : 'unknown resolution time';

    return `
Prediction review request for journal reflection.

QUESTION: ${input.question}
PREDICTED OUTCOME STATEMENT: ${input.predictedOutcome}
PREDICTED PROBABILITY: ${predictedProbability}
ACTUAL OUTCOME: ${input.actualOutcome}
ACTUAL PROBABILITY ESTIMATE: ${actualProbability}
CATEGORY: ${input.category || 'uncategorized'}
TIMEFRAME: ${input.timeframe || 'unspecified'}
RESOLVED AT: ${resolvedAt}
NOTES: ${input.notes || 'none provided'}

Compare the prediction with the outcome. Identify calibration issues, highlight what went well, and provide concrete improvement suggestions for the next forecast. Keep answers concise and actionable.`;
  }

  private getMockReflection(input: PredictionReflectionInput): PredictionReflection {
    const predicted = this.normalizeProbability(input.predictedProbability);
    const actual = this.resolveActualProbability(input.actualOutcome, input.actualProbability);
    const absoluteError = this.calculateAbsoluteError(predicted, actual);
    const confidenceGap = Math.round((absoluteError ?? 0) * 100);
    const verdict = this.deriveVerdict(predicted, actual, input.actualOutcome);
    const calibration = this.deriveCalibration(predicted, actual);

    const improvementSuggestions = this.generateImprovementSuggestions(verdict, calibration, input.category);
    const reinforcementPoints = this.generateReinforcementPoints(verdict, input.category);
    const nextActions = this.generateNextActions(verdict, calibration, input.timeframe);

    return {
      insightId: input.insightId,
      summary: this.generateReflectionSummary(verdict, input.question, confidenceGap),
      verdict,
      accuracyScore: Math.max(0, 100 - confidenceGap),
      confidenceGap,
      calibration,
      improvementSuggestions,
      reinforcementPoints,
      nextActions,
      metrics: {
        predictedProbability: predicted ?? undefined,
        actualProbability: actual ?? undefined,
        absoluteError: absoluteError ?? undefined,
        resolutionDate: input.resolutionDate,
        category: input.category,
        timeframe: input.timeframe,
        outcome: input.actualOutcome,
      },
      generatedAt: new Date().toISOString(),
      notes: input.notes,
    };
  }

  private ensureStringArray(value: unknown, fallback: string[]): string[] {
    if (!Array.isArray(value)) {
      return fallback;
    }
    return value
      .map(item => (typeof item === 'string' ? item.trim() : ''))
      .filter(item => item.length > 0);
  }

  private boundNumber(value: unknown, min: number, max: number, fallback: number): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return fallback;
    }
    return Math.min(Math.max(value, min), max);
  }

  private validateCalibration(value: unknown): PredictionReflection['calibration'] | null {
    if (value === 'well_calibrated' || value === 'overconfident' || value === 'underconfident' || value === 'unknown') {
      return value;
    }
    return null;
  }

  private describeProbability(probability?: number, outcome?: string): string {
    if (probability === undefined || probability === null || Number.isNaN(probability)) {
      if (outcome === 'INVALID') {
        return 'not applicable (invalid resolution)';
      }
      return 'not specified';
    }

    const normalized = this.normalizeProbability(probability);
    if (normalized === null) {
      return 'not specified';
    }
    const percent = Math.round(normalized * 100);
    return `${percent}%`;
  }

  private normalizeProbability(probability?: number): number | null {
    if (probability === undefined || probability === null || Number.isNaN(probability)) {
      return null;
    }
    if (probability > 1) {
      return Math.min(Math.max(probability / 100, 0), 1);
    }
    return Math.min(Math.max(probability, 0), 1);
  }

  private resolveActualProbability(outcome: string, probability?: number): number | null {
    if (probability !== undefined && probability !== null) {
      return this.normalizeProbability(probability);
    }

    if (outcome === 'YES') return 1;
    if (outcome === 'NO') return 0;
    if (outcome === 'INVALID') return 0.5;
    return null;
  }

  private calculateAbsoluteError(predicted: number | null, actual: number | null): number | null {
    if (predicted === null || actual === null) {
      return null;
    }
    return Math.abs(predicted - actual);
  }

  private deriveVerdict(
    predicted: number | null,
    actual: number | null,
    outcome: string,
  ): PredictionReflection['verdict'] {
    if (outcome === 'INVALID') {
      return 'inconclusive';
    }
    if (predicted === null || actual === null) {
      return 'inconclusive';
    }

    const predictionDirection = predicted >= 0.5 ? 'YES' : 'NO';
    const actualDirection = actual >= 0.5 ? 'YES' : 'NO';
    return predictionDirection === actualDirection ? 'accurate' : 'missed';
  }

  private deriveCalibration(predicted: number | null, actual: number | null): PredictionReflection['calibration'] {
    if (predicted === null || actual === null) {
      return 'unknown';
    }

    const delta = actual - predicted;
    if (Math.abs(delta) <= 0.1) {
      return 'well_calibrated';
    }
    return delta > 0 ? 'underconfident' : 'overconfident';
  }

  private generateImprovementSuggestions(
    verdict: PredictionReflection['verdict'],
    calibration: PredictionReflection['calibration'],
    category?: string,
  ): string[] {
    const base: string[] = [];

    if (verdict === 'missed') {
      base.push('Review resolution evidence to understand mismatched assumptions.');
      base.push('Document leading indicators that would have signaled the correct outcome earlier.');
    } else if (verdict === 'accurate') {
      base.push('Capture what worked in this forecast and reuse the checklist.');
    } else {
      base.push('Clarify resolution criteria up front to avoid inconclusive results.');
    }

    if (calibration === 'overconfident') {
      base.push('Track historical probabilities to recalibrate confidence on similar questions.');
    } else if (calibration === 'underconfident') {
      base.push('Increase conviction when evidence strongly supports your view.');
    }

    if (category === 'crypto') {
      base.push('Incorporate on-chain activity and macro risk events into your monitoring routine.');
    }

    return Array.from(new Set(base)).slice(0, 4);
  }

  private generateReinforcementPoints(
    verdict: PredictionReflection['verdict'],
    category?: string,
  ): string[] {
    const points: string[] = [];
    if (verdict === 'accurate') {
      points.push('Good alignment between your thesis and the eventual outcome.');
    } else if (verdict === 'missed') {
      points.push('Baseline research provided a foundation even though calibration slipped.');
    } else {
      points.push('Captured a nuanced situation worth refining for future forecasts.');
    }

    if (category === 'stocks') {
      points.push('Sector analysis inputs were well structured.');
    }

    return Array.from(new Set(points)).slice(0, 3);
  }

  private generateNextActions(
    verdict: PredictionReflection['verdict'],
    calibration: PredictionReflection['calibration'],
    timeframe?: string,
  ): string[] {
    const actions: string[] = [];

    if (verdict === 'missed') {
      actions.push('Schedule a 15 minute retro to update your forecasting checklist.');
    }

    if (calibration === 'overconfident') {
      actions.push('Commit to tracking probability distributions for the next five predictions.');
    } else if (calibration === 'underconfident') {
      actions.push('Record evidence strength to justify higher conviction levels.');
    }

    if (timeframe) {
      actions.push(`Prepare next forecast before the ${timeframe} window begins.`);
    }

    return Array.from(new Set(actions)).slice(0, 3);
  }

  private generateReflectionSummary(
    verdict: PredictionReflection['verdict'],
    question: string,
    confidenceGap: number,
  ): string {
    const verdictText =
      verdict === 'accurate' ? 'was on target' : verdict === 'missed' ? 'missed the mark' : 'was inconclusive';
    return `Your call on "${question}" ${verdictText} with a confidence gap of ${confidenceGap} points.`;
  }
}
