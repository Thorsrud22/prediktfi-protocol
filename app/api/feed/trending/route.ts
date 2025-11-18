import { NextResponse } from 'next/server';

export async function GET() {
  // Mock trending data until real API is implemented
  const mockTrendingData = [
    {
      id: 1,
      title: "Bitcoin Price Prediction",
      category: "Crypto",
      trend: "bullish",
      confidence: 85,
      timeframe: "24h"
    },
    {
      id: 2,
      title: "Stock Market Analysis",
      category: "Stocks", 
      trend: "neutral",
      confidence: 72,
      timeframe: "1w"
    },
    {
      id: 3,
      title: "AI Technology Forecast",
      category: "Tech",
      trend: "bullish", 
      confidence: 91,
      timeframe: "1m"
    }
  ];

  return NextResponse.json({
    success: true,
    data: mockTrendingData,
    timestamp: new Date().toISOString()
  });
}