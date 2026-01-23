
import React from 'react';
import Image from 'next/image';
import ProcessTimeline from '../components/ProcessTimeline';
import { InstantLink } from '../components/InstantLink';
import HeroActions from '../components/landing/HeroActions';


export const dynamic = "force-static";
export const revalidate = 86400;

export default async function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center pt-32 sm:pt-44 pb-16 sm:pb-20 px-3 sm:px-6">
        <div className="text-center max-w-5xl mx-auto space-y-4 md:space-y-8">
          {/* Main Heading */}
          <h1 className="flex flex-col items-center justify-center font-black text-white leading-[0.9] uppercase italic">
            <span className="text-base sm:text-2xl tracking-[0.2em] text-slate-300 font-bold not-italic mb-2 sm:mb-4">
              Turn your idea into an
            </span>
            <span className="text-[27px] sm:text-6xl md:text-7xl tracking-tighter bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent filter drop-shadow-2xl pr-2">
              investor-grade answer
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-sm md:text-2xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed">
            Get brutally honest feedback on your project idea with live market data and expert-level analysis.
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

        </div>
      </div>

      {/* Process Timeline */}
      <ProcessTimeline />

    </div >
  );
}
