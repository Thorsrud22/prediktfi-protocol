import React from 'react';
import Hero from './components/Hero';
import ProcessTimeline from './components/ProcessTimeline';
import TrendingMarkets from './components/TrendingMarkets';
import ActivityFeed from './components/ActivityFeed';
import TopCreators from './components/TopCreators';
import HomeClient from './components/HomeClient';
import Link from 'next/link';
import Image from 'next/image';
import { InstantLink } from './components/InstantLink';

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
            <InstantLink
              href="/"
              className="group flex items-center gap-2.5 rounded-full bg-slate-900/90 px-2.5 py-1.5 pr-4 ring-1 ring-inset ring-white/10 transition-all hover:ring-white/20 duration-300"
              aria-label="Predikt home"
            >
              <span className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-white/20 transition-all duration-300 group-hover:scale-110 group-hover:ring-white/30">
                <Image
                  src="/images/predikt-orb.svg"
                  alt="Predikt logo"
                  width={36}
                  height={36}
                  className="h-full w-full object-contain p-0.5 drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
                  priority
                />
                {/* Subtle rotating glow effect */}
                <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400/20 via-transparent to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
              </span>
              <span className="font-inter text-base font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">
                Predikt
              </span>
            </InstantLink>
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
