import React from 'react';
import Image from 'next/image';
import ProcessTimeline from '../components/ProcessTimeline';
import { InstantLink } from '../components/InstantLink';
import HeroActions from '../components/landing/HeroActions';


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
      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center pt-32 sm:pt-44 pb-16 sm:pb-20 px-3 sm:px-6">
        <div className="text-center max-w-5xl mx-auto space-y-4 md:space-y-8">
          {/* Main Heading */}
          <h1 className="text-[28px] sm:text-5xl md:text-7xl font-black text-white leading-[0.9] tracking-tighter uppercase italic">
            Turn your idea into an{' '}
            <span className="whitespace-nowrap bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-500 bg-clip-text text-transparent">
              investor-grade answer
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base md:text-2xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed">
            Predikt is an AI-native evaluator built to stress-test AI, DeFi and emerging digital assets instead of giving you generic AI replies.
          </p>

          {/* CTA Buttons */}
          <HeroActions />

          <div className="pt-8 sm:pt-14 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-x-12 sm:gap-y-4 text-[10px] font-black uppercase tracking-[0.2em] italic text-slate-500">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              Live Market Data
            </div>
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
              Semantic Analysis
            </div>
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
              Risk Modeling
            </div>
          </div>

          {/* Stats Grid - Enhanced with Institutional Styling */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pt-16 sm:pt-24 max-w-5xl mx-auto">
            {[
              { label: 'Protocols Audited', value: `${data.stats.activePredictions.toLocaleString()}` },
              { label: 'Capital Evaluated', value: `${data.stats.totalVolume}M+` },
              { label: 'Risk Detection', value: `${data.stats.accuracyRate}%` },
              { label: 'Signals Identified', value: `${data.stats.activeCreators.toLocaleString()}` },
            ].map((stat, i) => (

              <div key={i} className="p-6 md:p-8 bg-slate-900/80 rounded-[32px] border border-white/5 flex flex-col items-center justify-center group hover:bg-slate-900 transition-all duration-500 hover:border-blue-500/20 shadow-xl">
                <div className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tighter italic group-hover:text-blue-400 transition-colors">
                  {stat.value}
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] italic text-slate-500 group-hover:text-slate-400 transition-colors text-center">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Process Timeline */}
      <ProcessTimeline />

    </div >
  );
}
