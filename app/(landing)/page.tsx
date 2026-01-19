import React from 'react';
import Image from 'next/image';
import Aurora from '../components/ui/Aurora';
import ProcessTimeline from '../components/ProcessTimeline';
import { InstantLink } from '../components/InstantLink';
import HeroActions from '../components/landing/HeroActions';

export const dynamic = "force-static";
export const revalidate = 86400;

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Brand Pill - Fixed Top Left */}
      <div className="fixed top-3 left-4 sm:left-6 z-50">
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

      {/* Aurora Background (WebGL Shader Version) */}
      <Aurora
        colorStops={['#0F172A', '#38bdf8', '#6366f1']}
        speed={0.5}
        amplitude={1.2}
        className="fixed inset-0 -z-10 scale-[2.0] md:scale-100"
      />

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center pt-32 pb-20 px-4">
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

          <div className="pt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-400">
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




        </div>
      </div>

      {/* Process Timeline */}
      <ProcessTimeline />
    </div >
  );
}
