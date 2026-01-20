import React from 'react';
import Image from 'next/image';
import ProcessTimeline from '../components/ProcessTimeline';
import { InstantLink } from '../components/InstantLink';
import HeroActions from '../components/landing/HeroActions';
import LandingPill from '../components/landing/LandingPill';

export const dynamic = "force-static";
export const revalidate = 86400;

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
      {/* Brand Pill - Fixed Top Left (Only shown if NOT authenticated, to avoid double pill) */}
      {/* We use a simple CSS hide via sibling selector or similar if we can't use hooks. 
          But since this is a server component, we need a Client Component wrapper or just CSS based on body class? 
          Actually, ShellWrapper wraps this. We can't easily suppress this form parent.
          Let's verify if we can make this a client component or use a specialized client wrapper for the pill.
          For now, I'll switch this file to 'use client' or import a client component for the pill.
          Let's make a new client component for the LandingPill to handle visibility.
      */}
      <LandingPill />

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center pt-32 sm:pt-44 pb-16 sm:pb-20 px-5 sm:px-6">
        <div className="text-center max-w-5xl mx-auto space-y-4 md:space-y-8">
          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-7xl font-bold text-white leading-tight">
            Turn your idea into an{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              investor-grade answer
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base md:text-2xl text-slate-300 max-w-3xl mx-auto">
            Predikt is an AI-native evaluator built to stress-test AI, DeFi and emerging digital assets instead of giving you generic AI replies.
          </p>

          {/* CTA Buttons */}
          <HeroActions />

          <div className="pt-8 sm:pt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-x-8 sm:gap-y-4 text-sm font-medium text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              Live Market Data
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
              Deep Semantic Analysis
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]" />
              Risk Modeling
            </div>
          </div>

          {/* Stats Grid - Restored from backup */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 max-w-4xl mx-auto opacity-80 hover:opacity-100 transition-opacity duration-500">
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

    </div >
  );
}
