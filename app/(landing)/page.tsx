import React from 'react';
import Image from 'next/image';
import Aurora from '../components/ui/Aurora';
import { InstantLink } from '../components/InstantLink';

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
        className="fixed inset-0 -z-10 scale-[2.0] blur-2xl md:scale-100 md:blur-none"
      />

      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
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
            Predikt is an AI-native evaluator built to stress-test AI, DeFi and memecoin ideas instead of giving you generic AI replies.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <div
              className="px-6 py-3 md:px-8 md:py-4 rounded-full bg-slate-700/50 text-slate-300 font-semibold text-lg cursor-default border border-slate-600 inline-flex items-center justify-center select-none"
            >
              Coming soon
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <svg
              className="w-6 h-6 text-slate-500/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* How it works Section */}
      <section className="relative z-10 py-24 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">How it works</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              From raw idea to investor-grade analysis in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 ring-1 ring-blue-500/20 group-hover:ring-blue-500/40 transition-all duration-300 group-hover:bg-blue-500/20">
                <span className="text-2xl">⚡️</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">1. Submit Idea</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Paste a tweet, a whitepaper link, or just type out your raw concept. We handle the context.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 ring-1 ring-cyan-500/20 group-hover:ring-cyan-500/40 transition-all duration-300 group-hover:bg-cyan-500/20">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">2. AI Stress-Test</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Our agent swarm analyzes market data, tokenomics, and sentiment to find holes in the logic.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-6 ring-1 ring-teal-500/20 group-hover:ring-teal-500/40 transition-all duration-300 group-hover:bg-teal-500/20">
                <span className="text-2xl">💎</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">3. Get Rated</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Receive a clear score (0-100) and a detailed analysis of the project's viability and risks.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
