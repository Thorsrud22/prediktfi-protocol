import React from 'react';
import Hero from './components/Hero';
import TrendingMarkets from './components/TrendingMarkets';
import ActivityFeed from './components/ActivityFeed';
import TopCreators from './components/TopCreators';
import HomeClient from './components/HomeClient';
import Link from 'next/link';
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
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900 -z-[9]" />

      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-5xl mx-auto space-y-8">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Institutional-Grade Validation for your{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Web3 Protocol
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
            Don't build in the dark. Get rigorous AI stress-testing on your tokenomics, market fit, and technical feasibility before you write a single line of code.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/studio"
              className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
            >
              Start Validation
            </Link>
            <Link
              href="/feed"
              className="px-8 py-4 rounded-full border-2 border-slate-600 bg-slate-900/50 backdrop-blur-sm text-slate-100 font-semibold text-lg hover:bg-slate-800/50 hover:border-slate-500 transition-all duration-300"
            >
              View Case Studies
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                {data.stats.activePredictions.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">Protocols Audited</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                {data.stats.totalVolume}M+
              </div>
              <div className="text-sm text-slate-400">Capital Saved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                {data.stats.accuracyRate}%
              </div>
              <div className="text-sm text-slate-400">Risk Detection</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                {data.stats.activeCreators.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">Risk Factors Identified</div>
            </div>
          </div>
        </div>
      </div>

      {/* Client-side logic for redirects */}
      <HomeClient data={data} />
    </div>
  );
}
