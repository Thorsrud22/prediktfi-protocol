// Advanced Analysis Engine
import { DataCollectionService } from './data-collection';
import { 
  AdvancedAnalysis, 
  RiskFactor, 
  Scenario, 
  TechnicalAnalysis, 
  SentimentAnalysis, 
  FundamentalAnalysis 
} from './enhanced-types';

export class AnalysisEngine {
  private dataService: DataCollectionService;

  constructor() {
    this.dataService = DataCollectionService.getInstance();
  }

  async performAdvancedAnalysis(
    symbol: string, 
    question: string, 
    horizon: string,
    progressCallback?: (status: string, progress: number) => void
  ): Promise<AdvancedAnalysis> {
    const startTime = Date.now();
    
    try {
      // Phase 1: Data Collection (0-40%)
      progressCallback?.("Collecting market data...", 10);
      
      const [technicalResult, sentimentResult, fundamentalResult] = await Promise.all([
        this.dataService.getTechnicalAnalysis(symbol),
        this.dataService.getSentimentAnalysis(symbol),
        this.dataService.getFundamentalAnalysis(symbol)
      ]);

      progressCallback?.("Analyzing technical indicators...", 40);

      // Phase 2: Technical Analysis (40-60%)
      const technicalScore = this.analyzeTechnicalFactors(technicalResult.data, horizon);
      
      progressCallback?.("Processing sentiment data...", 60);

      // Phase 3: Sentiment Analysis (60-75%)
      const sentimentScore = this.analyzeSentimentFactors(sentimentResult.data);
      
      progressCallback?.("Calculating risk scenarios...", 75);

      // Phase 4: Risk Assessment (75-90%)
      const risks = this.identifyRiskFactors(
        technicalResult.data, 
        sentimentResult.data, 
        fundamentalResult.data
      );

      progressCallback?.("Generating scenarios...", 90);

      // Phase 5: Scenario Generation (90-95%)
      const scenarios = this.generateScenarios(
        technicalScore,
        sentimentScore,
        technicalResult.data,
        horizon,
        question
      );

      progressCallback?.("Finalizing analysis...", 95);

      // Phase 6: Final Calculation (95-100%)
      const overallProbability = this.calculateOverallProbability(
        technicalScore,
        sentimentScore,
        risks
      );

      const confidence = this.calculateConfidence(
        technicalResult.data,
        sentimentResult.data,
        fundamentalResult.data
      );

      const dataQuality = this.calculateDataQuality([
        technicalResult.source,
        sentimentResult.source,
        fundamentalResult.source
      ]);

      progressCallback?.("Analysis complete!", 100);

      return {
        probability: Math.round(overallProbability * 100) / 100,
        confidence: Math.round(confidence * 100) / 100,
        scenarios,
        technical: technicalResult.data!,
        sentiment: sentimentResult.data!,
        fundamental: fundamentalResult.data!,
        risks,
        dataSources: [
          technicalResult.source,
          sentimentResult.source,
          fundamentalResult.source
        ],
        methodology: this.generateMethodologyExplanation(technicalScore, sentimentScore),
        processingTimeMs: Date.now() - startTime,
        dataQuality: Math.round(dataQuality * 100) / 100
      };

    } catch (error) {
      console.error('Analysis engine error:', error);
      throw error;
    }
  }

  private analyzeTechnicalFactors(technical: TechnicalAnalysis | null, horizon: string): number {
    if (!technical) return 0.5; // Neutral if no data

    let score = 0.5; // Start neutral

    // Price trend analysis
    if (technical.change24h > 5) score += 0.15;
    else if (technical.change24h > 2) score += 0.08;
    else if (technical.change24h < -5) score -= 0.15;
    else if (technical.change24h < -2) score -= 0.08;

    // Moving average signals
    if (technical.movingAverages.ma7 && technical.movingAverages.ma30) {
      const currentPrice = technical.price;
      
      // Golden cross / death cross
      if (currentPrice > technical.movingAverages.ma7 && 
          technical.movingAverages.ma7 > technical.movingAverages.ma30) {
        score += 0.12; // Bullish
      } else if (currentPrice < technical.movingAverages.ma7 && 
                 technical.movingAverages.ma7 < technical.movingAverages.ma30) {
        score -= 0.12; // Bearish
      }
    }

    // RSI analysis
    if (technical.rsi !== null) {
      if (technical.rsi > 70) score -= 0.08; // Overbought
      else if (technical.rsi < 30) score += 0.08; // Oversold
      else if (technical.rsi >= 45 && technical.rsi <= 55) score += 0.03; // Neutral strength
    }

    // Volatility adjustment
    if (technical.volatility > 80) {
      score += (Math.random() - 0.5) * 0.15; // High volatility = more uncertainty
    } else if (technical.volatility < 30) {
      score += (Math.random() - 0.5) * 0.05; // Low volatility = more predictable
    }

    // Support/resistance levels
    if (technical.support && technical.resistance) {
      const currentPrice = technical.price;
      const range = technical.resistance - technical.support;
      const position = (currentPrice - technical.support) / range;
      
      if (position > 0.8) score -= 0.06; // Near resistance
      else if (position < 0.2) score += 0.06; // Near support
    }

    // Horizon adjustments
    if (horizon.includes('24h') || horizon.includes('1d')) {
      // Short term: recent momentum matters more
      if (technical.change24h > 0) score += 0.05;
      else score -= 0.05;
    } else if (horizon.includes('week') || horizon.includes('month')) {
      // Longer term: trend and fundamentals matter more
      if (technical.trend === 'bullish') score += 0.08;
      else if (technical.trend === 'bearish') score -= 0.08;
    }

    return Math.max(0.05, Math.min(0.95, score));
  }

  private analyzeSentimentFactors(sentiment: SentimentAnalysis | null): number {
    if (!sentiment) return 0.5; // Neutral if no data

    let score = 0.5;

    // Fear & Greed Index
    if (sentiment.fearGreedIndex !== null) {
      if (sentiment.fearGreedIndex > 75) score += 0.12; // Extreme greed
      else if (sentiment.fearGreedIndex > 55) score += 0.06; // Greed
      else if (sentiment.fearGreedIndex < 25) score -= 0.12; // Extreme fear
      else if (sentiment.fearGreedIndex < 45) score -= 0.06; // Fear
    }

    // News sentiment (when implemented)
    if (sentiment.newsScore !== null) {
      score += sentiment.newsScore * 0.08;
    }

    // Social sentiment (when implemented)
    if (sentiment.socialScore !== null) {
      score += sentiment.socialScore * 0.05;
    }

    return Math.max(0.05, Math.min(0.95, score));
  }

  private identifyRiskFactors(
    technical: TechnicalAnalysis | null,
    sentiment: SentimentAnalysis | null,
    fundamental: FundamentalAnalysis | null
  ): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // Technical risks
    if (technical) {
      if (technical.volatility > 100) {
        risks.push({
          type: 'technical',
          description: 'Extremely high volatility increases prediction uncertainty',
          impact: 'high',
          likelihood: 0.8
        });
      }

      if (technical.rsi && technical.rsi > 80) {
        risks.push({
          type: 'technical',
          description: 'Severely overbought conditions may trigger correction',
          impact: 'medium',
          likelihood: 0.6
        });
      }

      if (technical.volume24h < 1000000) {
        risks.push({
          type: 'market',
          description: 'Low trading volume may amplify price movements',
          impact: 'medium',
          likelihood: 0.5
        });
      }
    }

    // Sentiment risks
    if (sentiment) {
      if (sentiment.fearGreedIndex && sentiment.fearGreedIndex > 85) {
        risks.push({
          type: 'market',
          description: 'Extreme greed sentiment often precedes market corrections',
          impact: 'high',
          likelihood: 0.7
        });
      }

      if (sentiment.fearGreedIndex && sentiment.fearGreedIndex < 15) {
        risks.push({
          type: 'market',
          description: 'Extreme fear may lead to continued selling pressure',
          impact: 'medium',
          likelihood: 0.6
        });
      }
    }

    // Market structure risks
    risks.push({
      type: 'regulatory',
      description: 'Regulatory announcements can cause sudden price movements',
      impact: 'high',
      likelihood: 0.3
    });

    risks.push({
      type: 'market',
      description: 'Major whale transactions can impact price significantly',
      impact: 'medium',
      likelihood: 0.4
    });

    return risks;
  }

  private generateScenarios(
    technicalScore: number,
    sentimentScore: number,
    technical: TechnicalAnalysis | null,
    horizon: string,
    question: string
  ): Scenario[] {
    const baseProb = (technicalScore + sentimentScore) / 2;
    const currentPrice = technical?.price || 0;

    // Calculate price targets based on volatility and support/resistance
    const volatilityFactor = technical ? Math.min(technical.volatility / 100, 0.5) : 0.2;
    
    const scenarios: Scenario[] = [
      {
        name: 'pessimistic',
        probability: Math.max(0.05, baseProb - 0.25),
        description: this.generateScenarioDescription('pessimistic', technical, horizon),
        targetPrice: currentPrice * (1 - volatilityFactor * 0.8),
        timeframe: horizon,
        keyFactors: this.getPessimisticFactors(technical)
      },
      {
        name: 'likely',
        probability: baseProb,
        description: this.generateScenarioDescription('likely', technical, horizon),
        targetPrice: currentPrice * (1 + (baseProb - 0.5) * volatilityFactor),
        timeframe: horizon,
        keyFactors: this.getLikelyFactors(technical)
      },
      {
        name: 'optimistic',
        probability: Math.min(0.95, baseProb + 0.25),
        description: this.generateScenarioDescription('optimistic', technical, horizon),
        targetPrice: currentPrice * (1 + volatilityFactor * 1.2),
        timeframe: horizon,
        keyFactors: this.getOptimisticFactors(technical)
      }
    ];

    return scenarios;
  }

  private calculateOverallProbability(
    technicalScore: number,
    sentimentScore: number,
    risks: RiskFactor[]
  ): number {
    // Weighted combination
    let probability = (technicalScore * 0.6) + (sentimentScore * 0.4);

    // Risk adjustment
    const highRisks = risks.filter(r => r.impact === 'high');
    const riskAdjustment = highRisks.reduce((adj, risk) => adj + (risk.likelihood * 0.1), 0);
    
    // Apply risk adjustment (reduce confidence in extreme scenarios)
    if (probability > 0.7) probability -= riskAdjustment;
    else if (probability < 0.3) probability += riskAdjustment;

    return Math.max(0.05, Math.min(0.95, probability));
  }

  private calculateConfidence(
    technical: TechnicalAnalysis | null,
    sentiment: SentimentAnalysis | null,
    fundamental: FundamentalAnalysis | null
  ): number {
    let confidence = 0.5;

    // Data availability boosts confidence
    if (technical) confidence += 0.2;
    if (sentiment) confidence += 0.15;
    if (fundamental) confidence += 0.15;

    // Data quality factors
    if (technical && technical.volume24h > 10000000) confidence += 0.1; // High volume
    if (technical && technical.volatility < 50) confidence += 0.05; // Low volatility
    if (sentiment && sentiment.fearGreedIndex !== null) confidence += 0.05;

    return Math.max(0.1, Math.min(0.9, confidence));
  }

  private calculateDataQuality(sources: any[]): number {
    const validSources = sources.filter(s => s.quality > 0);
    if (validSources.length === 0) return 0.1;
    
    const avgQuality = validSources.reduce((sum, s) => sum + s.quality, 0) / validSources.length;
    const freshnessBonus = validSources.every(s => s.freshness < 10) ? 0.1 : 0;
    
    return Math.min(1.0, avgQuality + freshnessBonus);
  }

  private generateMethodologyExplanation(technicalScore: number, sentimentScore: number): string {
    const techWeight = Math.round(technicalScore * 100);
    const sentWeight = Math.round(sentimentScore * 100);
    
    return `Analysis combines technical indicators (${techWeight}% bullish signals) with market sentiment (${sentWeight}% positive sentiment). Multiple timeframes and risk factors considered for comprehensive evaluation.`;
  }

  private generateScenarioDescription(scenario: 'optimistic' | 'likely' | 'pessimistic', technical: TechnicalAnalysis | null, horizon: string): string {
    const timeframe = horizon.includes('24h') ? 'short-term' : horizon.includes('week') ? 'medium-term' : 'longer-term';
    
    switch (scenario) {
      case 'optimistic':
        return `Best-case ${timeframe} scenario with strong momentum and positive market conditions.`;
      case 'pessimistic':
        return `Worst-case ${timeframe} scenario with negative sentiment and technical weakness.`;
      case 'likely':
        return `Most probable ${timeframe} outcome based on current technical and fundamental conditions.`;
    }
  }

  private getPessimisticFactors(technical: TechnicalAnalysis | null): string[] {
    return [
      'Technical breakdown below support',
      'Negative market sentiment',
      'High volatility environment'
    ];
  }

  private getLikelyFactors(technical: TechnicalAnalysis | null): string[] {
    return [
      'Current technical trend continuation',
      'Normal market volatility',
      'Balanced risk-reward scenario'
    ];
  }

  private getOptimisticFactors(technical: TechnicalAnalysis | null): string[] {
    return [
      'Strong technical breakout',
      'Positive sentiment catalysts',
      'Momentum acceleration'
    ];
  }
}
