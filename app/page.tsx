import React from 'react';
// import Hero from './components/Hero';
// import TrendingMarkets from './components/TrendingMarkets';
// import ActivityFeed from './components/ActivityFeed';
// import TopCreators from './components/TopCreators';
import HomeClient from './components/HomeClient';
// import Link from 'next/link';
import Aurora from './components/ui/Aurora';

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
    <div className="relative min-h-screen">
      {/* Aurora Background */}
      <Aurora
        colorStops={['#0ea5e9', '#3b82f6', '#8b5cf6']} // Blue to purple gradient
        amplitude={1.2}
        blend={0.6}
        speed={0.8}
        className="fixed inset-0 -z-10"
      />

      {/* Gradient overlay for better text readability */}
      {/* Gradient overlay removed for performance */}

      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-5xl mx-auto space-y-8">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Turn your idea into an{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              investor-grade answer
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
            PrediktFi is an AI-native evaluator built to stress-test AI, DeFi and memecoin ideas instead of giving you generic AI replies.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              disabled
              className="px-8 py-4 rounded-full bg-slate-700/50 text-slate-300 font-semibold text-lg cursor-not-allowed border border-slate-600"
            >
              Coming soon
            </button>
            {/* Secondary CTA Removed for Landing Mode */}
          </div>

          {/* Stats removed to keep it simple and static-looking */}
        </div>
      </div>

      {/* Client-side logic for redirects (if any remaining) */}
      <HomeClient data={data} />
    </div>
  );
}
