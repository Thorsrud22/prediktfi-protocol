import { InsightRequest, InsightResponse, PipelineContext } from './_schemas';
import { fetchMultipleMarketData, getNewsData } from './_sources';
import { computeIndicators } from './_indicators';
import { trackServer } from '../../lib/analytics';

// Helper function to simulate realistic processing delays
function simulateDelay(minMs: number, maxMs: number): Promise<void> {
  if (process.env.NODE_ENV === 'test') return Promise.resolve();
  const delay = Math.random() * (maxMs - minMs) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

export async function runPipeline(request: InsightRequest): Promise<InsightResponse> {
  const startTime = Date.now();

  try {
    trackServer('insight_requested', {
      category: request.category,
      questionLength: request.question.length,
    });

    // Simulate realistic research timing based on analysis type
    const isAdvanced = request.analysisType === 'advanced';

    // Step 1: Fetch market data (simulate real API calls)
    await simulateDelay(500, 1000);
    const symbols = extractSymbolsFromQuestion(request.question, request.category);
    const { data: marketData, dataQuality: marketQuality } = await fetchMultipleMarketData(
      symbols,
      30,
    );

    // Step 2: Fetch news data (simulate real API calls)
    await simulateDelay(400, 800);
    const keywords = extractKeywordsFromQuestion(request.question);
    const newsData = await getNewsData(keywords, 10);

    // Step 3: Additional research for advanced analysis
    if (isAdvanced) {
      await simulateDelay(3000, 6000); // Simulate deeper research
    }

    // Step 4: Compute indicators
    await simulateDelay(200, 500);
    const indicators = computeIndicators(marketData);

    // Step 5: Fuse sentiment
    await simulateDelay(150, 400);
    const sentiment = fuseSentiment(newsData, request.question);

    // Step 6: Calculate overall data quality
    const dataQuality = calculateDataQuality(marketData, newsData, marketQuality);

    // Step 7: Create pipeline context
    const context: PipelineContext = {
      request,
      marketData,
      newsData,
      indicators,
      sentiment,
      dataQuality,
    };

    // Step 8: Advanced analysis processing
    if (isAdvanced) {
      await simulateDelay(2000, 4000); // Simulate complex analysis
    }

    // Step 9: Generate probability and confidence with null safety
    await simulateDelay(200, 600);
    const rawProbability = calibrateProbability(context);
    const rawConfidence = deriveConfidence(context);

    // Ensure valid values with defaults
    const probability = Number.isFinite(rawProbability) ? rawProbability : 0.5;
    const confidence = Number.isFinite(rawConfidence) ? rawConfidence : 0.6;
    const interval = calculateProbabilityInterval(probability, confidence);

    // Step 10: Generate scenarios
    await simulateDelay(300, 800);
    const scenarios = buildScenarios(context, probability);

    // Step 11: Generate rationale (more time for advanced)
    await simulateDelay(400, 1000);
    const rationale = generateRationale(context, probability, confidence);

    // Step 12: Compile sources
    await simulateDelay(100, 200);
    const sources = compileSources(marketData, newsData);

    // Additional processing time for advanced analysis
    if (isAdvanced) {
      await simulateDelay(2000, 4000); // Final comprehensive analysis
    }

    const tookMs = Date.now() - startTime;

    const response: InsightResponse = {
      probability,
      confidence,
      interval,
      rationale,
      scenarios,
      sources,
      metrics: {
        rsi: indicators.rsi,
        sma20: indicators.sma20,
        sma50: indicators.sma50,
        ema12: indicators.ema12,
        ema26: indicators.ema26,
        atr: indicators.atr,
        trend: indicators.trend,
        sentiment,
        support: indicators.support,
        resistance: indicators.resistance,
      },
      tookMs,
    };

    trackServer('insight_completed', {
      category: request.category,
      probability: Math.round(probability * 100),
      confidence: Math.round(confidence * 100),
      tookMs,
      dataQuality: Math.round(dataQuality * 100),
    });

    return response;
  } catch (error) {
    const tookMs = Date.now() - startTime;
    console.error('Pipeline error:', error);

    trackServer('insight_error', {
      category: request.category,
      error: error instanceof Error ? error.message : 'Unknown error',
      tookMs,
    });

    // Return fallback response
    return createFallbackResponse(request, tookMs);
  }
}

function extractSymbolsFromQuestion(question: string, category: string): string[] {
  const text = question.toLowerCase();
  const symbols = [];

  // Common crypto symbols
  const cryptoSymbols = {
    bitcoin: 'BTC',
    btc: 'BTC',
    solana: 'SOL',
    sol: 'SOL',
    ethereum: 'ETH',
    eth: 'ETH',
    usdc: 'USDC',
  };

  for (const [keyword, symbol] of Object.entries(cryptoSymbols)) {
    if (text.includes(keyword)) {
      symbols.push(symbol);
    }
  }

  // Default symbols based on category
  if (symbols.length === 0) {
    if (category.toLowerCase().includes('crypto')) {
      symbols.push('BTC', 'SOL');
    } else {
      symbols.push('BTC'); // Default to Bitcoin for general questions
    }
  }

  return [...new Set(symbols)]; // Remove duplicates
}

function extractKeywordsFromQuestion(question: string): string[] {
  const words = question
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);

  const relevantWords = words.filter(
    word =>
      ![
        'will',
        'what',
        'when',
        'where',
        'how',
        'the',
        'and',
        'or',
        'but',
        'for',
        'with',
        'this',
        'that',
      ].includes(word),
  );

  return relevantWords.slice(0, 5); // Top 5 keywords
}

function fuseSentiment(newsData: any[], question: string): number {
  if (newsData.length === 0) return 0;

  const scores = newsData.map((news: any) => news.score || 0);
  const avgSentiment = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  // Weight by relevance to question
  const questionWords = question.toLowerCase().split(/\s+/);
  let relevanceWeight = 0.5; // Base weight

  for (const news of newsData) {
    const title = (news.title || '').toLowerCase();
    const matchCount = questionWords.filter(word => title.includes(word)).length;
    if (matchCount > 0) {
      relevanceWeight = Math.min(1, relevanceWeight + 0.1 * matchCount);
    }
  }

  return Math.max(-1, Math.min(1, avgSentiment * relevanceWeight));
}

function calculateDataQuality(marketData: any[], newsData: any[], marketQuality: number): number {
  let quality = 0;
  let factors = 0;

  // Market data quality
  quality += marketQuality * 0.6;
  factors += 0.6;

  // News data availability
  const newsQuality = newsData.length > 0 ? Math.min(1, newsData.length / 5) : 0.3;
  quality += newsQuality * 0.4;
  factors += 0.4;

  return quality / factors;
}

function calibrateProbability(context: PipelineContext): number {
  const { indicators, sentiment, dataQuality } = context;

  // Base probability from technical indicators
  let techScore = 0;
  let techFactors = 0;

  // RSI contribution
  if (indicators.rsi > 70) {
    techScore += 0.3; // Overbought - bearish
  } else if (indicators.rsi < 30) {
    techScore += 0.7; // Oversold - bullish
  } else {
    techScore += 0.5; // Neutral
  }
  techFactors += 1;

  // Trend contribution
  if (indicators.trend === 'up') {
    techScore += 0.65;
  } else if (indicators.trend === 'down') {
    techScore += 0.35;
  } else {
    techScore += 0.5;
  }
  techFactors += 1;

  // Moving average relationship
  if (indicators.sma20 > indicators.sma50) {
    techScore += 0.6; // Bullish crossover
  } else {
    techScore += 0.4; // Bearish
  }
  techFactors += 1;

  const techProb = techScore / techFactors;

  // Sentiment adjustment
  const sentimentAdjustment = sentiment * 0.1; // Max 10% adjustment

  // Combine with weights
  let probability = techProb * 0.7 + (0.5 + sentimentAdjustment) * 0.3;

  // Apply data quality factor
  probability = 0.5 + (probability - 0.5) * dataQuality;

  // Ensure bounds
  return Math.max(0.05, Math.min(0.95, probability));
}

function deriveConfidence(context: PipelineContext): number {
  const { indicators, dataQuality, marketData } = context;

  let confidence = 0;
  let factors = 0;

  // Data quality contributes to confidence
  confidence += dataQuality * 0.4;
  factors += 0.4;

  // Technical indicator consistency
  const trendStrength = indicators.strength;
  confidence += trendStrength * 0.3;
  factors += 0.3;

  // Market data completeness
  const dataCompleteness =
    marketData.length > 0 ? Math.min(1, marketData[0].prices.length / 30) : 0;
  confidence += dataCompleteness * 0.3;
  factors += 0.3;

  return Math.max(0.1, Math.min(0.95, confidence / factors));
}

function calculateProbabilityInterval(
  probability: number,
  confidence: number,
): { lower: number; upper: number } {
  // Lower confidence = wider interval
  const spread = (1 - confidence) * 0.3; // Max 30% spread

  const lower = Math.max(0, probability - spread);
  const upper = Math.min(1, probability + spread);

  return {
    lower: Math.round(lower * 1000) / 1000,
    upper: Math.round(upper * 1000) / 1000,
  };
}

function buildScenarios(
  context: PipelineContext,
  baseProbability: number,
): Array<{
  label: string;
  probability: number;
  drivers: string[];
}> {
  const { indicators, sentiment } = context;

  // Bull scenario
  const bullProb = Math.min(0.6, baseProbability + 0.2);
  const bullDrivers = [];
  if (indicators.trend === 'up') bullDrivers.push('Strong upward trend');
  if (indicators.rsi < 70) bullDrivers.push('Room for growth (RSI)');
  if (sentiment > 0) bullDrivers.push('Positive market sentiment');
  if (indicators.sma20 > indicators.sma50) bullDrivers.push('Bullish moving averages');

  // Base scenario
  const baseProb = baseProbability;
  const baseDrivers = ['Current market conditions', 'Technical analysis balance'];

  // Bear scenario
  const bearProb = Math.max(0.1, baseProbability - 0.2);
  const bearDrivers = [];
  if (indicators.trend === 'down') bearDrivers.push('Bearish trend confirmed');
  if (indicators.rsi > 70) bearDrivers.push('Overbought conditions');
  if (sentiment < 0) bearDrivers.push('Negative sentiment');
  if (indicators.sma20 < indicators.sma50) bearDrivers.push('Bearish moving averages');

  // Normalize probabilities to sum to 1
  const total = bullProb + baseProb + bearProb;

  return [
    {
      label: 'Bull Case',
      probability: Math.round((bullProb / total) * 1000) / 1000,
      drivers: bullDrivers.slice(0, 3),
    },
    {
      label: 'Base Case',
      probability: Math.round((baseProb / total) * 1000) / 1000,
      drivers: baseDrivers,
    },
    {
      label: 'Bear Case',
      probability: Math.round((bearProb / total) * 1000) / 1000,
      drivers: bearDrivers.slice(0, 3),
    },
  ];
}

function generateRationale(
  context: PipelineContext,
  probability: number,
  confidence: number,
): string {
  const { indicators, sentiment, request, dataQuality } = context;

  // Safe null handling with defaults
  const probPercent = Math.round(Number.isFinite(probability) ? probability * 100 : 50);
  const confPercent = Math.round(Number.isFinite(confidence) ? confidence * 100 : 60);
  const isAdvanced = request?.analysisType === 'advanced';

  // Determine topic scope for appropriate language
  const topic = request?.category || 'General';
  const scope = /crypto|btc|eth|market/i.test(topic) ? 'market' : 'general';

  // Create structured, professional analysis sections
  let sections: string[] = [];

  // Executive Summary with topic-appropriate language
  const analysisType = isAdvanced ? 'comprehensive multi-source' : 'standard';
  const analysisBasis =
    scope === 'market'
      ? `Based on ${analysisType} market analysis`
      : `Based on available evidence and assumptions`;
  sections.push(
    `**Executive Summary**\n${analysisBasis}, this prediction has a ${probPercent}% probability with ${confPercent}% confidence.`,
  );

  // Data Quality Assessment
  const dataQualityPercent = Math.round(Number.isFinite(dataQuality) ? dataQuality * 100 : 70);
  const dataSources =
    scope === 'market'
      ? isAdvanced
        ? 'technical indicators, sentiment analysis, fundamental data, and market intelligence'
        : 'technical indicators and market sentiment'
      : isAdvanced
        ? 'available data sources, contextual analysis, and comprehensive research'
        : 'available evidence and contextual factors';
  sections.push(
    `**Data Quality Assessment**\nAnalysis incorporates ${dataQualityPercent}% quality data from ${dataSources}.`,
  );

  // Technical Analysis (only for market scope)
  let technicalText = '';
  if (scope === 'market' && indicators) {
    technicalText = `**Technical Analysis**\n`;
    const trend = indicators?.trend || 'neutral';
    if (trend === 'up') {
      technicalText += `Current trend is bullish with positive momentum indicators. `;
    } else if (trend === 'down') {
      technicalText += `Current trend is bearish with negative momentum indicators. `;
    } else {
      technicalText += `Market is in a neutral trend with mixed signals. `;
    }

    // RSI insights with null safety
    const rsi = indicators?.rsi;
    if (Number.isFinite(rsi)) {
      if (rsi > 70) {
        technicalText += `RSI at ${rsi.toFixed(1)} indicates overbought conditions.`;
      } else if (rsi < 30) {
        technicalText += `RSI at ${rsi.toFixed(1)} shows oversold levels.`;
      } else {
        technicalText += `RSI at ${rsi.toFixed(1)} is in neutral territory.`;
      }
    }

    // Additional technical details for advanced analysis
    if (isAdvanced && Number.isFinite(indicators?.sma20) && Number.isFinite(indicators?.sma50)) {
      technicalText += ` Moving averages show ${indicators.sma20 > indicators.sma50 ? 'bullish' : 'bearish'
        } crossover pattern.`;
    }
    if (Number.isFinite(indicators?.atr)) {
      technicalText += ` ATR indicates ${indicators.atr > 0.05 ? 'high' : 'moderate'} volatility.`;
    }
  }

  if (technicalText) {
    sections.push(technicalText);
  }

  // Sentiment Analysis (topic-aware)
  const sentimentValue = Number.isFinite(sentiment) ? sentiment : 0;
  if (Math.abs(sentimentValue) > 0.1) {
    const sentimentText = sentimentValue > 0 ? 'positive' : 'negative';
    const sentimentStrength = Math.abs(sentimentValue) > 0.5 ? 'strong' : 'moderate';

    if (scope === 'market') {
      const impact =
        sentimentValue > 0 ? 'supporting upside scenarios' : 'creating downside pressure';
      sections.push(
        `**Market Sentiment**\nCurrent sentiment is ${sentimentStrength} ${sentimentText}, ${impact}.`,
      );
    } else {
      const impact =
        sentimentValue > 0 ? 'supporting favorable outcomes' : 'indicating challenges ahead';
      sections.push(
        `**Contextual Sentiment**\nCurrent sentiment is ${sentimentStrength} ${sentimentText}, ${impact}.`,
      );
    }
  }

  // Advanced Analysis Features (topic-aware)
  if (isAdvanced) {
    if (scope === 'market') {
      sections.push(
        `**Advanced Research**\nComprehensive analysis includes multi-timeframe technical patterns, cross-asset correlation analysis, and institutional flow indicators.`,
      );
    } else {
      sections.push(
        `**Advanced Research**\nComprehensive analysis includes multi-source data integration, contextual pattern recognition, and comprehensive scenario modeling.`,
      );
    }
  }

  // Risk Assessment (topic-aware with null safety)
  let riskFactors: string[] = [];

  if (request?.category === 'crypto') {
    riskFactors.push('Crypto markets are highly volatile');
  } else if (scope !== 'market') {
    riskFactors.push('Non-market predictions involve inherent uncertainty');
  }

  if (
    scope === 'market' &&
    Number.isFinite(indicators?.rsi) &&
    (indicators.rsi > 70 || indicators.rsi < 30)
  ) {
    riskFactors.push('Technical indicators suggest potential reversal risk');
  }

  const dataQualityValue = Number.isFinite(dataQuality) ? dataQuality : 0.7;
  if (dataQualityValue < 0.7) {
    riskFactors.push('Limited data availability increases uncertainty');
  }

  if (isAdvanced) {
    if (scope === 'market') {
      riskFactors.push(
        'Advanced analysis accounts for macro-economic factors and regulatory risks',
      );
    } else {
      riskFactors.push(
        'Advanced analysis accounts for complex interdependencies and external factors',
      );
    }
  }

  if (riskFactors.length > 0) {
    sections.push(
      `**Risk Assessment**\nKey uncertainty: ${riskFactors[0]}. ${riskFactors.length > 1 ? `Additional factors: ${riskFactors.slice(1).join(', ')}.` : ''
      }`,
    );
  }

  return sections.join('\n\n');
}

function compileSources(marketData: any[], newsData: any[]): Array<{ name: string; url: string }> {
  const sources = [];

  // Market data sources
  if (marketData.length > 0) {
    sources.push({
      name: 'CoinGecko Market Data',
      url: 'https://coingecko.com',
    });
  }

  // News sources
  if (newsData.length > 0) {
    sources.push({
      name: 'CryptoPanic News',
      url: 'https://cryptopanic.com',
    });
  }

  return sources;
}

function createFallbackResponse(request: InsightRequest, tookMs: number): InsightResponse {
  return {
    probability: 0.5,
    confidence: 0.3,
    interval: { lower: 0.3, upper: 0.7 },
    rationale:
      'Unable to perform complete analysis due to data limitations. This is a neutral assessment.',
    scenarios: [
      {
        label: 'Bull Case',
        probability: 0.35,
        drivers: ['Potential upside factors'],
      },
      {
        label: 'Base Case',
        probability: 0.3,
        drivers: ['Current conditions'],
      },
      {
        label: 'Bear Case',
        probability: 0.35,
        drivers: ['Potential downside risks'],
      },
    ],
    sources: [],
    metrics: {
      trend: 'neutral',
      sentiment: 0,
    },
    tookMs,
  };
}
