// app/lib/ai/contextual-analyzer.ts
import { ClassificationResult } from './category-classifier';

export interface ContextualAnalysisResult {
  probability: number;
  confidence: number;
  rationale: string;
  dataSources: string[];
  marketContext: {
    category: string;
    analysisType: string;
    volatilityLevel: string;
    timeSensitivity: string;
    hasRealTimeData: boolean;
  };
  categorySpecificInsights: {
    keyFactors: string[];
    riskFactors: string[];
    opportunities: string[];
    marketTrends: string[];
  };
  confidenceFactors: {
    dataQuality: number;
    marketLiquidity: number;
    historicalAccuracy: number;
    uncertaintyFactors: string[];
  };
}

export class ContextualAnalyzer {
  static async analyzeByCategory(
    question: string,
    topic: string,
    horizon: string,
    classification: ClassificationResult
  ): Promise<ContextualAnalysisResult> {
    const { category, analysisType, marketContext, dataSources } = classification;

    // Get category-specific analysis
    const categoryAnalysis = await this.performCategoryAnalysis(
      question,
      topic,
      horizon,
      category,
      analysisType
    );

    // Calculate confidence factors
    const confidenceFactors = this.calculateConfidenceFactors(
      category,
      marketContext,
      categoryAnalysis
    );

    // Generate rationale based on category and analysis type
    const rationale = this.generateContextualRationale(
      category,
      analysisType,
      categoryAnalysis,
      marketContext
    );

    // Calculate final probability and confidence
    const { probability, confidence } = this.calculateFinalMetrics(
      categoryAnalysis,
      confidenceFactors,
      marketContext
    );

    return {
      probability,
      confidence,
      rationale,
      dataSources,
      marketContext: {
        category,
        analysisType,
        volatilityLevel: marketContext.volatilityLevel,
        timeSensitivity: marketContext.timeSensitivity,
        hasRealTimeData: marketContext.hasRealTimeData
      },
      categorySpecificInsights: categoryAnalysis.insights,
      confidenceFactors
    };
  }

  private static async performCategoryAnalysis(
    question: string,
    topic: string,
    horizon: string,
    category: string,
    analysisType: string
  ): Promise<{
    baseProbability: number;
    insights: {
      keyFactors: string[];
      riskFactors: string[];
      opportunities: string[];
      marketTrends: string[];
    };
  }> {
    // Category-specific analysis logic
    switch (category) {
      case 'crypto':
        return this.analyzeCrypto(question, topic, horizon, analysisType);
      case 'stocks':
        return this.analyzeStocks(question, topic, horizon, analysisType);
      case 'tech':
        return this.analyzeTech(question, topic, horizon, analysisType);
      case 'politics':
        return this.analyzePolitics(question, topic, horizon, analysisType);
      case 'sports':
        return this.analyzeSports(question, topic, horizon, analysisType);
      default:
        return this.analyzeGeneral(question, topic, horizon, analysisType);
    }
  }

  private static async analyzeCrypto(
    question: string,
    topic: string,
    horizon: string,
    analysisType: string
  ): Promise<{
    baseProbability: number;
    insights: {
      keyFactors: string[];
      riskFactors: string[];
      opportunities: string[];
      marketTrends: string[];
    };
  }> {
    // Simulate crypto analysis based on analysis type
    const baseProbability = this.getBaseProbability(question, 'crypto');
    
    const insights = {
      keyFactors: this.getCryptoKeyFactors(analysisType),
      riskFactors: this.getCryptoRiskFactors(),
      opportunities: this.getCryptoOpportunities(),
      marketTrends: this.getCryptoMarketTrends()
    };

    return { baseProbability, insights };
  }

  private static async analyzeStocks(
    question: string,
    topic: string,
    horizon: string,
    analysisType: string
  ): Promise<{
    baseProbability: number;
    insights: {
      keyFactors: string[];
      riskFactors: string[];
      opportunities: string[];
      marketTrends: string[];
    };
  }> {
    const baseProbability = this.getBaseProbability(question, 'stocks');
    
    const insights = {
      keyFactors: this.getStockKeyFactors(analysisType),
      riskFactors: this.getStockRiskFactors(),
      opportunities: this.getStockOpportunities(),
      marketTrends: this.getStockMarketTrends()
    };

    return { baseProbability, insights };
  }

  private static async analyzeTech(
    question: string,
    topic: string,
    horizon: string,
    analysisType: string
  ): Promise<{
    baseProbability: number;
    insights: {
      keyFactors: string[];
      riskFactors: string[];
      opportunities: string[];
      marketTrends: string[];
    };
  }> {
    const baseProbability = this.getBaseProbability(question, 'tech');
    
    const insights = {
      keyFactors: this.getTechKeyFactors(analysisType),
      riskFactors: this.getTechRiskFactors(),
      opportunities: this.getTechOpportunities(),
      marketTrends: this.getTechMarketTrends()
    };

    return { baseProbability, insights };
  }

  private static async analyzePolitics(
    question: string,
    topic: string,
    horizon: string,
    analysisType: string
  ): Promise<{
    baseProbability: number;
    insights: {
      keyFactors: string[];
      riskFactors: string[];
      opportunities: string[];
      marketTrends: string[];
    };
  }> {
    const baseProbability = this.getBaseProbability(question, 'politics');
    
    const insights = {
      keyFactors: this.getPoliticsKeyFactors(analysisType),
      riskFactors: this.getPoliticsRiskFactors(),
      opportunities: this.getPoliticsOpportunities(),
      marketTrends: this.getPoliticsMarketTrends()
    };

    return { baseProbability, insights };
  }

  private static async analyzeSports(
    question: string,
    topic: string,
    horizon: string,
    analysisType: string
  ): Promise<{
    baseProbability: number;
    insights: {
      keyFactors: string[];
      riskFactors: string[];
      opportunities: string[];
      marketTrends: string[];
    };
  }> {
    const baseProbability = this.getBaseProbability(question, 'sports');
    
    const insights = {
      keyFactors: this.getSportsKeyFactors(analysisType),
      riskFactors: this.getSportsRiskFactors(),
      opportunities: this.getSportsOpportunities(),
      marketTrends: this.getSportsMarketTrends()
    };

    return { baseProbability, insights };
  }

  private static async analyzeGeneral(
    question: string,
    topic: string,
    horizon: string,
    analysisType: string
  ): Promise<{
    baseProbability: number;
    insights: {
      keyFactors: string[];
      riskFactors: string[];
      opportunities: string[];
      marketTrends: string[];
    };
  }> {
    const baseProbability = this.getBaseProbability(question, 'general');
    
    const insights = {
      keyFactors: ['General market conditions', 'Historical patterns', 'Current trends'],
      riskFactors: ['Uncertainty', 'Market volatility', 'External factors'],
      opportunities: ['Market inefficiencies', 'Emerging trends', 'Strategic advantages'],
      marketTrends: ['General market direction', 'Sector performance', 'Economic indicators']
    };

    return { baseProbability, insights };
  }

  private static getBaseProbability(question: string, category: string): number {
    // Simple heuristic based on question sentiment and category
    const positiveWords = ['rise', 'increase', 'up', 'bullish', 'positive', 'growth', 'success'];
    const negativeWords = ['fall', 'decrease', 'down', 'bearish', 'negative', 'decline', 'failure'];
    
    const questionLower = question.toLowerCase();
    const positiveCount = positiveWords.filter(word => questionLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => questionLower.includes(word)).length;
    
    let baseProbability = 0.5; // Neutral starting point
    
    if (positiveCount > negativeCount) {
      baseProbability = 0.6 + (positiveCount - negativeCount) * 0.1;
    } else if (negativeCount > positiveCount) {
      baseProbability = 0.4 - (negativeCount - positiveCount) * 0.1;
    }
    
    // Category-specific adjustments
    const categoryAdjustments = {
      crypto: 0.0,    // Crypto is highly volatile, keep neutral
      stocks: 0.0,    // Stocks have historical bias, keep neutral
      tech: 0.05,     // Tech tends to be optimistic
      politics: 0.0,  // Politics is unpredictable
      sports: 0.0,    // Sports is balanced
      general: 0.0    // General is neutral
    };
    
    baseProbability += categoryAdjustments[category as keyof typeof categoryAdjustments] || 0;
    
    return Math.max(0.05, Math.min(0.95, baseProbability));
  }

  // Category-specific insight generators
  private static getCryptoKeyFactors(analysisType: string): string[] {
    const factors = {
      technical: ['Price momentum', 'Trading volume', 'Support/resistance levels', 'Technical indicators'],
      fundamental: ['Adoption rate', 'Network activity', 'Development progress', 'Regulatory environment'],
      sentiment: ['Fear & Greed Index', 'Social media sentiment', 'News sentiment', 'Community mood'],
      mixed: ['Market sentiment', 'Technical indicators', 'Fundamental metrics', 'Regulatory factors']
    };
    return factors[analysisType as keyof typeof factors] || factors.mixed;
  }

  private static getStockKeyFactors(analysisType: string): string[] {
    const factors = {
      technical: ['Chart patterns', 'Moving averages', 'Volume analysis', 'Technical indicators'],
      fundamental: ['Earnings growth', 'P/E ratio', 'Revenue trends', 'Market position'],
      sentiment: ['Analyst ratings', 'Institutional sentiment', 'News sentiment', 'Market mood'],
      mixed: ['Financial metrics', 'Market sentiment', 'Technical analysis', 'Industry trends']
    };
    return factors[analysisType as keyof typeof factors] || factors.mixed;
  }

  private static getTechKeyFactors(analysisType: string): string[] {
    const factors = {
      technical: ['Code quality', 'System performance', 'Scalability', 'Technical architecture'],
      fundamental: ['User growth', 'Revenue model', 'Market opportunity', 'Competitive advantage'],
      sentiment: ['Developer sentiment', 'User adoption', 'Community engagement', 'Media coverage'],
      mixed: ['Product quality', 'Market adoption', 'Technical innovation', 'Business model']
    };
    return factors[analysisType as keyof typeof factors] || factors.mixed;
  }

  private static getPoliticsKeyFactors(analysisType: string): string[] {
    const factors = {
      technical: ['Polling data', 'Voting patterns', 'Statistical trends', 'Demographic analysis'],
      fundamental: ['Policy positions', 'Candidate qualifications', 'Historical performance', 'Party strength'],
      sentiment: ['Public opinion', 'Media coverage', 'Voter enthusiasm', 'Social sentiment'],
      mixed: ['Polling trends', 'Policy analysis', 'Public sentiment', 'Historical patterns']
    };
    return factors[analysisType as keyof typeof factors] || factors.mixed;
  }

  private static getSportsKeyFactors(analysisType: string): string[] {
    const factors = {
      technical: ['Player statistics', 'Team performance', 'Historical matchups', 'Form analysis'],
      fundamental: ['Team strength', 'Player form', 'Strategic advantages', 'Coaching quality'],
      sentiment: ['Fan sentiment', 'Media coverage', 'Team morale', 'Psychological factors'],
      mixed: ['Team performance', 'Player statistics', 'Historical data', 'Current form']
    };
    return factors[analysisType as keyof typeof factors] || factors.mixed;
  }

  // Risk factors for each category
  private static getCryptoRiskFactors(): string[] {
    return ['Regulatory uncertainty', 'Market volatility', 'Technology risks', 'Adoption challenges'];
  }

  private static getStockRiskFactors(): string[] {
    return ['Market volatility', 'Economic conditions', 'Company-specific risks', 'Sector headwinds'];
  }

  private static getTechRiskFactors(): string[] {
    return ['Competition', 'Technology changes', 'Market adoption', 'Regulatory challenges'];
  }

  private static getPoliticsRiskFactors(): string[] {
    return ['Unpredictable events', 'Media influence', 'Voter turnout', 'External factors'];
  }

  private static getSportsRiskFactors(): string[] {
    return ['Injuries', 'Form changes', 'External factors', 'Unexpected events'];
  }

  // Opportunities for each category
  private static getCryptoOpportunities(): string[] {
    return ['Institutional adoption', 'Regulatory clarity', 'Technology advances', 'Market growth'];
  }

  private static getStockOpportunities(): string[] {
    return ['Earnings growth', 'Market expansion', 'Strategic initiatives', 'Sector recovery'];
  }

  private static getTechOpportunities(): string[] {
    return ['Market expansion', 'Technology innovation', 'User growth', 'Partnership opportunities'];
  }

  private static getPoliticsOpportunities(): string[] {
    return ['Policy changes', 'Public support', 'Strategic positioning', 'Coalition building'];
  }

  private static getSportsOpportunities(): string[] {
    return ['Player development', 'Strategic improvements', 'Team chemistry', 'Coaching changes'];
  }

  // Market trends for each category
  private static getCryptoMarketTrends(): string[] {
    return ['Institutional adoption', 'DeFi growth', 'NFT market', 'Regulatory developments'];
  }

  private static getStockMarketTrends(): string[] {
    return ['Economic recovery', 'Sector rotation', 'ESG investing', 'Technology disruption'];
  }

  private static getTechMarketTrends(): string[] {
    return ['AI advancement', 'Cloud computing', 'Mobile growth', 'Digital transformation'];
  }

  private static getPoliticsMarketTrends(): string[] {
    return ['Voter sentiment', 'Policy priorities', 'Media coverage', 'Campaign strategies'];
  }

  private static getSportsMarketTrends(): string[] {
    return ['League trends', 'Player development', 'Fan engagement', 'Media coverage'];
  }

  private static calculateConfidenceFactors(
    category: string,
    marketContext: any,
    categoryAnalysis: any
  ): {
    dataQuality: number;
    marketLiquidity: number;
    historicalAccuracy: number;
    uncertaintyFactors: string[];
  } {
    const uncertaintyFactors: string[] = [];
    
    // Data quality assessment
    let dataQuality = 0.7; // Base quality
    if (marketContext.hasRealTimeData) dataQuality += 0.2;
    if (marketContext.volatilityLevel === 'high') {
      dataQuality -= 0.1;
      uncertaintyFactors.push('High market volatility');
    }
    if (marketContext.timeSensitivity === 'high') {
      dataQuality -= 0.1;
      uncertaintyFactors.push('High time sensitivity');
    }

    // Market liquidity (higher for crypto/stocks, lower for others)
    const liquidityMap = {
      crypto: 0.8,
      stocks: 0.9,
      tech: 0.6,
      politics: 0.4,
      sports: 0.5,
      general: 0.3
    };
    const marketLiquidity = liquidityMap[category as keyof typeof liquidityMap] || 0.5;

    // Historical accuracy (simulated)
    const historicalAccuracy = 0.6 + Math.random() * 0.3; // 0.6-0.9

    // Additional uncertainty factors
    if (category === 'politics') uncertaintyFactors.push('Political unpredictability');
    if (category === 'sports') uncertaintyFactors.push('Performance variability');
    if (category === 'general') uncertaintyFactors.push('Limited data availability');

    return {
      dataQuality: Math.max(0.1, Math.min(1.0, dataQuality)),
      marketLiquidity: Math.max(0.1, Math.min(1.0, marketLiquidity)),
      historicalAccuracy: Math.max(0.1, Math.min(1.0, historicalAccuracy)),
      uncertaintyFactors
    };
  }

  private static generateContextualRationale(
    category: string,
    analysisType: string,
    categoryAnalysis: any,
    marketContext: any
  ): string {
    const { keyFactors, riskFactors, opportunities } = categoryAnalysis.insights;
    
    let rationale = `Based on ${analysisType} analysis of this ${category} prediction:\n\n`;
    
    rationale += `**Key Factors:**\n`;
    keyFactors.forEach((factor: string) => {
      rationale += `• ${factor}\n`;
    });
    
    rationale += `\n**Risk Factors:**\n`;
    riskFactors.forEach((risk: string) => {
      rationale += `• ${risk}\n`;
    });
    
    rationale += `\n**Opportunities:**\n`;
    opportunities.forEach((opportunity: string) => {
      rationale += `• ${opportunity}\n`;
    });
    
    rationale += `\n**Market Context:** ${marketContext.volatilityLevel} volatility, ${marketContext.timeSensitivity} time sensitivity`;
    
    return rationale;
  }

  private static calculateFinalMetrics(
    categoryAnalysis: any,
    confidenceFactors: any,
    marketContext: any
  ): { probability: number; confidence: number } {
    let probability = categoryAnalysis.baseProbability;
    let confidence = 0.5; // Base confidence

    // Adjust probability based on market context
    if (marketContext.volatilityLevel === 'high') {
      probability = 0.5 + (probability - 0.5) * 0.8; // Reduce extreme predictions
      confidence -= 0.1;
    }

    // Adjust confidence based on factors
    confidence += (confidenceFactors.dataQuality - 0.5) * 0.3;
    confidence += (confidenceFactors.marketLiquidity - 0.5) * 0.2;
    confidence += (confidenceFactors.historicalAccuracy - 0.5) * 0.2;

    // Reduce confidence if many uncertainty factors
    confidence -= confidenceFactors.uncertaintyFactors.length * 0.05;

    return {
      probability: Math.max(0.05, Math.min(0.95, probability)),
      confidence: Math.max(0.1, Math.min(0.9, confidence))
    };
  }
}
