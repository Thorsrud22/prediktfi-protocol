import { NextResponse } from 'next/server';
import { PredictionAnalyzer } from '@/lib/ai/prediction-analyzer';

// Template data mapping for AI analysis
const templates = {
  '1': {
    title: 'Bitcoin Price Movement',
    category: 'crypto',
    description: 'Bitcoin will reach $50,000 by end of January 2025',
    timeframe: '24h'
  },
  '2': {
    title: 'Tesla Stock Performance', 
    category: 'stocks',
    description: 'Tesla stock will outperform S&P 500 this week',
    timeframe: '1w'
  },
  '3': {
    title: 'Premier League Match',
    category: 'sports',
    description: 'Manchester United will beat Liverpool 2-1',
    timeframe: '90m'
  },
  '4': {
    title: 'Weather Forecast Accuracy',
    category: 'weather', 
    description: 'It will rain in London tomorrow with over 5mm precipitation',
    timeframe: '24h'
  },
  '5': {
    title: 'Ethereum Gas Fees',
    category: 'crypto',
    description: 'Ethereum average gas fees will drop below 30 gwei this week',
    timeframe: '1w'
  },
  '6': {
    title: 'Apple Stock Earnings',
    category: 'stocks',
    description: 'Apple will beat earnings expectations by 5%+',
    timeframe: '1m'
  },
  '7': {
    title: 'Champions League',
    category: 'sports',
    description: 'Real Madrid will advance to the finals',
    timeframe: '2m'
  },
  '8': {
    title: 'Technology Trend',
    category: 'tech',
    description: 'AI chip demand will increase by 40% this quarter',
    timeframe: '3m'
  }
};

const analyzer = new PredictionAnalyzer();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const analyses: Record<string, any> = {
    '1': {
      confidence: 73,
      factors: [
        'Market sentiment: Positive',
        'Trading volume: High',
        'Technical indicators: Bullish',
        'News sentiment: Neutral',
      ],
      recommendation: 'Bullish' as const,
      reasoning:
        'Based on current market trends, increased institutional adoption, and positive technical indicators including RSI and MACD signals, there is a strong likelihood of upward price movement in the next 24 hours. However, macroeconomic factors and potential regulatory news could impact this prediction.',
      dataPoints: 847,
      lastUpdated: new Date().toISOString(),
    },
    '2': {
      confidence: 45,
      factors: [
        'Earnings report pending',
        'Market volatility: High',
        'Sector performance: Mixed',
        'Analyst sentiment: Cautious',
      ],
      recommendation: 'Neutral' as const,
      reasoning:
        'Mixed signals in the market with upcoming earnings report creating uncertainty. Technical analysis shows consolidation pattern with potential for breakout in either direction. Recent production updates have been positive, but broader market conditions remain challenging.',
      dataPoints: 523,
      lastUpdated: new Date().toISOString(),
    },
    '3': {
      confidence: 82,
      factors: [
        'Team form: Excellent',
        'Head-to-head record: Favorable',
        'Player injuries: Minimal',
        'Home advantage: Strong',
      ],
      recommendation: 'Bullish' as const,
      reasoning:
        'Strong statistical analysis supports the home team advantage with recent form being exceptional. Key players are fit and available, and historical matchup data strongly favors this outcome. Weather conditions are optimal for play.',
      dataPoints: 342,
      lastUpdated: new Date().toISOString(),
    },
    '4': {
      confidence: 65,
      factors: [
        'Weather patterns: Unstable',
        'Humidity levels: High',
        'Barometric pressure: Dropping',
        'Historical data: 70% accuracy',
      ],
      recommendation: 'Neutral' as const,
      reasoning:
        'Meteorological models show converging low-pressure systems with increased likelihood of precipitation. However, local microclimate factors and rapid weather pattern changes introduce uncertainty. Historical accuracy in this region is moderate.',
      dataPoints: 1205,
      lastUpdated: new Date().toISOString(),
    },
    '5': {
      confidence: 58,
      factors: [
        'Network congestion: Rising',
        'DeFi activity: High',
        'Gas optimization: Improving',
        'Layer 2 adoption: Growing',
      ],
      recommendation: 'Bearish' as const,
      reasoning:
        'Increasing network activity and DeFi usage typically correlate with higher gas prices. However, ongoing optimizations and Layer 2 scaling solutions may mitigate some congestion. The prediction has moderate confidence due to competing factors.',
      dataPoints: 1032,
      lastUpdated: new Date().toISOString(),
    },
    '6': {
      confidence: 71,
      factors: [
        'Training data quality: High',
        'Model architecture: Advanced',
        'Benchmark history: Strong',
        'Research backing: Solid',
      ],
      recommendation: 'Bullish' as const,
      reasoning:
        'Analysis of model performance indicators, training methodologies, and benchmark test patterns suggests strong likelihood of superior performance. Recent research publications and architectural improvements support this prediction.',
      dataPoints: 628,
      lastUpdated: new Date().toISOString(),
    },
    '7': {
      confidence: 39,
      factors: [
        'Polling volatility: Very High',
        'Recent events impact: Unknown',
        'Margin of error: Large',
        'Historical accuracy: Moderate',
      ],
      recommendation: 'Neutral' as const,
      reasoning:
        'Political polling predictions have inherent uncertainty due to rapidly changing public opinion, sampling biases, and external events. Current data shows high volatility with no clear directional trend emerging from the analysis.',
      dataPoints: 2145,
      lastUpdated: new Date().toISOString(),
    },
    '8': {
      confidence: 67,
      factors: [
        'TVL growth rate: Accelerating',
        'Protocol innovations: Strong',
        'Market adoption: Growing',
        'Competition: Intense',
      ],
      recommendation: 'Bullish' as const,
      reasoning:
        'DeFi protocol analysis shows positive momentum in total value locked growth, driven by innovative features and increasing market adoption. Competitive landscape remains intense, but fundamental metrics suggest continued growth trajectory.',
      dataPoints: 891,
      lastUpdated: new Date().toISOString(),
    },
  };

  // Default to first analysis if template not found
  const analysis = analyses[id] || analyses['1'];

  // Simulate API processing time
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

  return NextResponse.json(analysis, {
    headers: {
      'Cache-Control': 'public, max-age=60', // Cache for 1 minute
    },
  });
}
