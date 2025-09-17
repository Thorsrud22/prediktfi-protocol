import { NextResponse } from 'next/server';

export async function GET() {
  // Mock prediction templates - replace with real database queries later
  const templates = [
    {
      id: '1',
      category: 'crypto',
      title: 'Bitcoin Price Movement',
      description:
        'Predict BTC price direction in the next 24 hours based on market sentiment and technical indicators',
      timeframe: '24 hours',
      difficulty: 'Medium' as const,
      potentialReward: 2.5,
    },
    {
      id: '2',
      category: 'stocks',
      title: 'Tesla Stock Performance',
      description:
        'Will TSLA outperform the S&P 500 this week? Consider earnings, production updates, and market trends',
      timeframe: '1 week',
      difficulty: 'Hard' as const,
      potentialReward: 5.0,
    },
    {
      id: '3',
      category: 'sports',
      title: 'Premier League Match Outcome',
      description: 'Predict the outcome of upcoming Premier League matches with detailed analysis',
      timeframe: '90 minutes',
      difficulty: 'Easy' as const,
      potentialReward: 1.2,
    },
    {
      id: '4',
      category: 'weather',
      title: 'Weather Forecast Accuracy',
      description: 'Will it rain in major cities tomorrow? Test meteorological prediction skills',
      timeframe: '24 hours',
      difficulty: 'Easy' as const,
      potentialReward: 0.8,
    },
    {
      id: '5',
      category: 'crypto',
      title: 'Ethereum Network Activity',
      description: 'Predict ETH gas prices and network congestion over the next week',
      timeframe: '1 week',
      difficulty: 'Hard' as const,
      potentialReward: 3.2,
    },
    {
      id: '6',
      category: 'tech',
      title: 'AI Model Performance',
      description: 'Predict which AI model will perform better on benchmark tests this month',
      timeframe: '1 month',
      difficulty: 'Medium' as const,
      potentialReward: 4.1,
    },
    {
      id: '7',
      category: 'politics',
      title: 'Election Polling Trends',
      description: 'Predict changes in political polling numbers based on recent events',
      timeframe: '2 weeks',
      difficulty: 'Hard' as const,
      potentialReward: 6.5,
    },
    {
      id: '8',
      category: 'crypto',
      title: 'DeFi Protocol Growth',
      description: 'Which DeFi protocol will see the highest TVL growth this quarter?',
      timeframe: '3 months',
      difficulty: 'Medium' as const,
      potentialReward: 3.8,
    },
  ];

  return NextResponse.json(templates, {
    headers: {
      'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
    },
  });
}
