import React from 'react';
import Hero from './components/Hero';
import ProcessTimeline from './components/ProcessTimeline';
import TrendingMarkets from './components/TrendingMarkets';
import ActivityFeed from './components/ActivityFeed';
import TopCreators from './components/TopCreators';
import HomeClient from './components/HomeClient';
import Link from 'next/link';
import Image from 'next/image';

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
      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-5xl mx-auto space-y-8">
          {/* Main Heading */}
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight">
            Investor-Grade Validation for your{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Web3 Protocol
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-slate-400 leading-relaxed max-w-3xl mx-auto px-4 w-full text-balance font-light">
            Don't build in the dark. Get rigorous AI stress-testing on your tokenomics, market fit, and technical feasibility before you write a single line of code.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/studio"
              className="px-8 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 border border-blue-400/30 text-white font-semibold text-lg hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:-translate-y-1 transition-all duration-300"
            >
              Start Validation
            </Link>

            <Link
              href="/example-report"
              className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-medium text-lg hover:bg-white/10 hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
            >
              View Sample Report
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

      {/* Process Timeline */}
      <ProcessTimeline />

      {/* Client-side logic for redirects */}
      <HomeClient data={data} />
    </div>
  );
}
