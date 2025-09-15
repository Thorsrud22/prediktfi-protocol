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
  
  try {
    const template = templates[id as keyof typeof templates];
    
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    console.log(`🔍 Analyzing template ${id}: ${template.title}`);
    
    // Use AI analyzer for real analysis
    const analysis = await analyzer.analyzePrediction(
      template.description,
      template.category,
      template.timeframe
    );

    return NextResponse.json(analysis, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
    
  } catch (error) {
    console.error('Analysis failed:', error);
    
    // Return fallback analysis if AI fails
    const template = templates[id as keyof typeof templates];
    const fallbackAnalysis = {
      confidence: 50,
      factors: ['Limited data available', 'Using fallback analysis'],
      recommendation: 'Neutral' as const,
      reasoning: 'Analysis service temporarily unavailable. Using baseline assessment with available historical data.',
      dataPoints: 0,
      riskLevel: 'Medium' as const,
      timeHorizon: template?.timeframe || '24h',
      lastUpdated: new Date().toISOString()
    };
    
    return NextResponse.json(fallbackAnalysis);
  }
}