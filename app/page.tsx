import React from 'react';
import Hero from './components/Hero';
import TrendingMarkets from './components/TrendingMarkets';
import ActivityFeed from './components/ActivityFeed';
import TopCreators from './components/TopCreators';
import HomeClient from './components/HomeClient';
import Link from 'next/link';

// ISR: Revalidate every hour like PredictionSwap
export const revalidate = 3600;

// Server Component - static content pre-rendered
async function getHomeData() {
  // Simulate API fetch for stats
  return {
    stats: {
      activePredictions: 1234,
      totalVolume: 2.5,
      accuracyRate: 89,
      activeCreators: 5678,
    },
  };
}

export default async function Home() {
  const data = await getHomeData();

  return (
    <div className="min-h-screen">
      {/* Client-side logic for redirects */}
      <HomeClient data={data} />
    </div>
  );
}
