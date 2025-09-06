import { 
  AdvancedAnalysis, 
  TechnicalAnalysis, 
  SentimentAnalysis, 
  FundamentalAnalysis,
  Scenario,
  RiskFactor,
  DataSource
} from './enhanced-types';
import { EnhancedDataService } from './enhanced-data-service';

export class AdvancedAnalysisEngine {
  private dataService: EnhancedDataService;

  constructor() {
    this.dataService = EnhancedDataService.getInstance();
  }

  // Helper function to simulate realistic processing delays
  private simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  async performAdvancedAnalysis(
    symbol: string, 
    question: string, 
    horizon: string,
    progressCallback?: (status: string, progress: number) => void
  ): Promise<AdvancedAnalysis> {
    const startTime = Date.now();
    
    try {
      // Phase 1: Data Collection (0-40%) - Simulate real API delays
      progressCallback?.("🔍 Collecting market data from multiple sources...", 5);
      await this.simulateDelay(2000, 4000);
      
      const [technicalResult, sentimentResult, fundamentalResult] = await Promise.all([
        this.dataService.getTechnicalAnalysis(symbol),
        this.dataService.getSentimentAnalysis(symbol),
        this.dataService.getFundamentalAnalysis(symbol)
      ]);

      progressCallback?.("📊 Analyzing technical indicators and patterns...", 15);
      await this.simulateDelay(1500, 3000);

      // Phase 2: Technical Analysis (25-50%)
      const technicalScore = this.analyzeTechnicalFactors(technicalResult.data, horizon);
      
      progressCallback?.("😊 Processing sentiment data from news and social media...", 30);
      await this.simulateDelay(1000, 2500);

      // Phase 3: Sentiment Analysis (40-60%)
      const sentimentScore = this.analyzeSentimentFactors(sentimentResult.data);
      
      progressCallback?.("🏗️ Evaluating fundamentals and market conditions...", 45);
      await this.simulateDelay(2000, 4000);

      // Phase 4: Fundamental Analysis (55-70%)
      const fundamentalScore = this.analyzeFundamentalFactors(fundamentalResult.data);
      
      progressCallback?.("⚠️ Calculating risk scenarios and market volatility...", 60);
      await this.simulateDelay(1500, 3000);

      // Phase 5: Risk Assessment (70-85%)
      const risks = this.identifyRiskFactors(
        technicalResult.data, 
        sentimentResult.data, 
        fundamentalResult.data
      );

      progressCallback?.("🎯 Generating probability scenarios and outcomes...", 75);
      await this.simulateDelay(1000, 2500);

      // Phase 6: Scenario Generation (85-95%)
      const scenarios = this.generateScenarios(
        technicalScore,
        sentimentScore,
        fundamentalScore,
        technicalResult.data,
        horizon,
        question
      );

      progressCallback?.("✨ Finalizing comprehensive analysis...", 90);
      await this.simulateDelay(1000, 2000);

      // Phase 7: Final Calculation (95-100%)
      const overallProbability = this.calculateOverallProbability(
        technicalScore,
        sentimentScore,
        fundamentalScore,
        risks
      );

      const confidence = this.calculateConfidence(
        technicalResult.data,
        sentimentResult.data,
        fundamentalResult.data
      );

      const dataQuality = this.calculateDataQuality(
        technicalResult.source,
        sentimentResult.source,
        fundamentalResult.source
      );

      const processingTime = Date.now() - startTime;

      const analysis: AdvancedAnalysis = {
        probability: overallProbability,
        confidence: confidence,
        scenarios: scenarios,
        technical: technicalResult.data,
        sentiment: sentimentResult.data,
        fundamental: fundamentalResult.data,
        risks: risks,
        dataSources: [technicalResult.source, sentimentResult.source, fundamentalResult.source],
        methodology: this.generateMethodology(technicalScore, sentimentScore, fundamentalScore),
        processingTimeMs: processingTime,
        dataQuality: dataQuality
      };

      progressCallback?.("✅ Analysis complete!", 100);
      return analysis;

    } catch (error) {
      console.error('Advanced analysis failed:', error);
      throw new Error('Analysis failed: ' + error.message);
    }
  }

  // Technical Analysis Scoring
  private analyzeTechnicalFactors(technical: TechnicalAnalysis | null, horizon: string): number {
    if (!technical) return 0.5;

    let score = 0.5; // Base score

    // RSI Analysis
    if (technical.rsi < 30) score += 0.1; // Oversold - bullish
    else if (technical.rsi > 70) score -= 0.1; // Overbought - bearish
    else if (technical.rsi > 40 && technical.rsi < 60) score += 0.05; // Neutral - stable

    // MACD Analysis
    if (technical.macd.value > technical.macd.signal) score += 0.1; // Bullish crossover
    else if (technical.macd.value < technical.macd.signal) score -= 0.1; // Bearish crossover

    // Moving Averages
    if (technical.movingAverages.sma20 > technical.movingAverages.sma50) score += 0.1;
    else if (technical.movingAverages.sma20 < technical.movingAverages.sma50) score -= 0.1;

    // Trend Analysis
    if (technical.trend === 'bullish') score += 0.15;
    else if (technical.trend === 'bearish') score -= 0.15;

    // Volatility Adjustment
    if (technical.volatility > 0.7) score += (Math.random() - 0.5) * 0.2; // High volatility = more uncertainty
    else if (technical.volatility < 0.3) score += 0.05; // Low volatility = more predictable

    // Horizon Adjustment
    if (horizon.includes('24h') || horizon.includes('1d')) {
      // Short term: trend continuation more likely
      if (technical.change24h > 2) score += 0.1;
      else if (technical.change24h < -2) score -= 0.1;
    } else if (horizon.includes('week') || horizon.includes('month')) {
      // Longer term: mean reversion tendency
      if (technical.change24h > 5) score -= 0.05; // Overextended
      else if (technical.change24h < -5) score += 0.05; // Oversold
    }

    return Math.max(0.05, Math.min(0.95, score));
  }

  // Sentiment Analysis Scoring
  private analyzeSentimentFactors(sentiment: SentimentAnalysis | null): number {
    if (!sentiment) return 0.5;

    let score = 0.5; // Base score

    // Fear & Greed Index
    if (sentiment.fearGreedIndex < 25) score += 0.2; // Extreme fear - contrarian bullish
    else if (sentiment.fearGreedIndex > 75) score -= 0.2; // Extreme greed - contrarian bearish
    else if (sentiment.fearGreedIndex > 40 && sentiment.fearGreedIndex < 60) score += 0.05; // Neutral

    // News Sentiment
    score += sentiment.newsSentiment * 0.15;

    // Social Sentiment
    score += sentiment.socialSentiment * 0.1;

    // Overall Sentiment
    score += sentiment.overallSentiment * 0.2;

    return Math.max(0.05, Math.min(0.95, score));
  }

  // Fundamental Analysis Scoring
  private analyzeFundamentalFactors(fundamental: FundamentalAnalysis | null): number {
    if (!fundamental) return 0.5;

    let score = 0.5; // Base score

    // Market Cap Analysis
    if (fundamental.marketCap && fundamental.marketCap > 1000000000000) score += 0.1; // Large cap stability
    else if (fundamental.marketCap && fundamental.marketCap < 1000000000) score -= 0.05; // Small cap volatility

    // Volume Analysis
    if (fundamental.volume24h > 1000000000) score += 0.05; // High volume = interest
    else if (fundamental.volume24h < 10000000) score -= 0.05; // Low volume = lack of interest

    // Network Value Analysis
    if (fundamental.networkValue > 50000000000) score += 0.1; // Strong network value
    else if (fundamental.networkValue < 1000000000) score -= 0.1; // Weak network value

    // Active Addresses
    if (fundamental.activeAddresses > 1000000) score += 0.05; // High activity
    else if (fundamental.activeAddresses < 100000) score -= 0.05; // Low activity

    // Staking Ratio (for PoS coins)
    if (fundamental.stakingRatio > 0.5) score += 0.05; // High staking = confidence
    else if (fundamental.stakingRatio < 0.1) score -= 0.05; // Low staking = uncertainty

    // Macro Environment
    if (fundamental.macroEnvironment.fedRate < 3) score += 0.05; // Low rates = risk on
    else if (fundamental.macroEnvironment.fedRate > 6) score -= 0.05; // High rates = risk off

    return Math.max(0.05, Math.min(0.95, score));
  }

  // Risk Factor Identification
  private identifyRiskFactors(
    technical: TechnicalAnalysis | null,
    sentiment: SentimentAnalysis | null,
    fundamental: FundamentalAnalysis | null
  ): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // Technical Risks
    if (technical) {
      if (technical.volatility > 0.8) {
        risks.push({
          type: 'technical',
          description: 'Extremely high volatility indicates unstable market conditions',
          impact: 'high',
          probability: 0.7
        });
      }
      
      if (technical.rsi > 80) {
        risks.push({
          type: 'technical',
          description: 'Overbought conditions suggest potential for correction',
          impact: 'medium',
          probability: 0.6
        });
      }
    }

    // Sentiment Risks
    if (sentiment) {
      if (sentiment.fearGreedIndex > 80) {
        risks.push({
          type: 'sentiment',
          description: 'Extreme greed in market may lead to correction',
          impact: 'high',
          probability: 0.6
        });
      }
      
      if (sentiment.overallSentiment < -0.5) {
        risks.push({
          type: 'sentiment',
          description: 'Negative sentiment across all sources',
          impact: 'medium',
          probability: 0.7
        });
      }
    }

    // Fundamental Risks
    if (fundamental) {
      if (fundamental.macroEnvironment.fedRate > 5) {
        risks.push({
          type: 'macro',
          description: 'High interest rates may reduce risk appetite',
          impact: 'high',
          probability: 0.8
        });
      }
      
      if (fundamental.inflationRate > 4) {
        risks.push({
          type: 'macro',
          description: 'High inflation may impact asset valuations',
          impact: 'medium',
          probability: 0.6
        });
      }
    }

    return risks;
  }

  // Scenario Generation
  private generateScenarios(
    technicalScore: number,
    sentimentScore: number,
    fundamentalScore: number,
    technical: TechnicalAnalysis | null,
    horizon: string,
    question: string
  ): Scenario[] {
    const baseProbability = (technicalScore + sentimentScore + fundamentalScore) / 3;
    
    const scenarios: Scenario[] = [
      {
        name: 'optimistic',
        probability: Math.min(0.95, baseProbability + 0.2),
        description: this.generateOptimisticScenario(technical, horizon, question),
        timeframe: horizon,
        keyFactors: this.getOptimisticFactors(technicalScore, sentimentScore, fundamentalScore)
      },
      {
        name: 'likely',
        probability: baseProbability,
        description: this.generateLikelyScenario(technical, horizon, question),
        timeframe: horizon,
        keyFactors: this.getLikelyFactors(technicalScore, sentimentScore, fundamentalScore)
      },
      {
        name: 'pessimistic',
        probability: Math.max(0.05, baseProbability - 0.2),
        description: this.generatePessimisticScenario(technical, horizon, question),
        timeframe: horizon,
        keyFactors: this.getPessimisticFactors(technicalScore, sentimentScore, fundamentalScore)
      }
    ];

    return scenarios;
  }

  private generateOptimisticScenario(technical: TechnicalAnalysis | null, horizon: string, question: string): string {
    const factors = [];
    if (technical?.trend === 'bullish') factors.push('strong bullish momentum');
    if (technical?.rsi < 50) factors.push('oversold conditions');
    if (technical?.volatility < 0.5) factors.push('stable market conditions');
    
    return `In the most optimistic scenario, ${factors.join(', ')} would drive significant positive movement. This outcome assumes all favorable conditions align and market sentiment remains positive.`;
  }

  private generateLikelyScenario(technical: TechnicalAnalysis | null, horizon: string, question: string): string {
    const factors = [];
    if (technical?.trend === 'neutral') factors.push('balanced market conditions');
    if (technical?.rsi > 40 && technical?.rsi < 60) factors.push('neutral technical indicators');
    
    return `The most likely scenario reflects current market conditions with ${factors.join(', ')}. This represents a balanced view based on available data and historical patterns.`;
  }

  private generatePessimisticScenario(technical: TechnicalAnalysis | null, horizon: string, question: string): string {
    const factors = [];
    if (technical?.trend === 'bearish') factors.push('bearish momentum');
    if (technical?.rsi > 70) factors.push('overbought conditions');
    if (technical?.volatility > 0.7) factors.push('high volatility');
    
    return `In the pessimistic scenario, ${factors.join(', ')} would lead to negative movement. This outcome considers potential downside risks and adverse market conditions.`;
  }

  private getOptimisticFactors(technical: number, sentiment: number, fundamental: number): string[] {
    const factors = [];
    if (technical > 0.6) factors.push('Strong technical indicators');
    if (sentiment > 0.6) factors.push('Positive market sentiment');
    if (fundamental > 0.6) factors.push('Solid fundamentals');
    return factors;
  }

  private getLikelyFactors(technical: number, sentiment: number, fundamental: number): string[] {
    const factors = [];
    if (technical > 0.4 && technical < 0.7) factors.push('Mixed technical signals');
    if (sentiment > 0.4 && sentiment < 0.7) factors.push('Neutral sentiment');
    if (fundamental > 0.4 && fundamental < 0.7) factors.push('Stable fundamentals');
    return factors;
  }

  private getPessimisticFactors(technical: number, sentiment: number, fundamental: number): string[] {
    const factors = [];
    if (technical < 0.4) factors.push('Weak technical indicators');
    if (sentiment < 0.4) factors.push('Negative sentiment');
    if (fundamental < 0.4) factors.push('Concerning fundamentals');
    return factors;
  }

  // Overall Probability Calculation
  private calculateOverallProbability(
    technicalScore: number,
    sentimentScore: number,
    fundamentalScore: number,
    risks: RiskFactor[]
  ): number {
    // Weighted average of all factors
    const weights = { technical: 0.4, sentiment: 0.3, fundamental: 0.3 };
    let baseProbability = (technicalScore * weights.technical + 
                          sentimentScore * weights.sentiment + 
                          fundamentalScore * weights.fundamental);

    // Adjust for high-impact risks
    const highImpactRisks = risks.filter(r => r.impact === 'high' && r.probability > 0.6);
    if (highImpactRisks.length > 0) {
      baseProbability -= 0.1 * highImpactRisks.length;
    }

    return Math.max(0.05, Math.min(0.95, baseProbability));
  }

  // Confidence Calculation
  private calculateConfidence(
    technical: TechnicalAnalysis | null,
    sentiment: SentimentAnalysis | null,
    fundamental: FundamentalAnalysis | null
  ): number {
    let confidence = 0.5; // Base confidence

    // Data availability
    if (technical) confidence += 0.2;
    if (sentiment) confidence += 0.2;
    if (fundamental) confidence += 0.1;

    // Data quality indicators
    if (technical?.volatility < 0.5) confidence += 0.05; // Low volatility = more predictable
    if (sentiment?.confidence > 0.8) confidence += 0.05; // High sentiment confidence

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  // Data Quality Calculation
  private calculateDataQuality(
    technicalSource: DataSource,
    sentimentSource: DataSource,
    fundamentalSource: DataSource
  ): number {
    const sources = [technicalSource, sentimentSource, fundamentalSource];
    const avgQuality = sources.reduce((sum, source) => sum + source.quality, 0) / sources.length;
    const avgFreshness = sources.reduce((sum, source) => sum + (source.freshness < 10 ? 1 : 0.5), 0) / sources.length;
    
    return (avgQuality + avgFreshness) / 2;
  }

  // Methodology Generation
  private generateMethodology(technical: number, sentiment: number, fundamental: number): string {
    const methods = [];
    
    if (technical > 0.4) methods.push('technical analysis');
    if (sentiment > 0.4) methods.push('sentiment analysis');
    if (fundamental > 0.4) methods.push('fundamental analysis');
    
    return `This analysis combines ${methods.join(', ')} to provide a comprehensive assessment. The methodology weights technical factors at 40%, sentiment at 30%, and fundamentals at 30% to arrive at the final probability.`;
  }
}
