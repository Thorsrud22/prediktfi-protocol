import React from 'react';
import Aurora from '../components/ui/Aurora';

export const dynamic = "force-static";
export const revalidate = 86400;

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Aurora Background (WebGL Shader Version) */}
      <Aurora
        colorStops={['#0F172A', '#38bdf8', '#6366f1']}
        speed={0.5}
        amplitude={1.2}
        className="fixed inset-0 -z-10"
      />

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
            Predikt is an AI-native evaluator built to stress-test AI, DeFi and memecoin ideas instead of giving you generic AI replies.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <div
              className="px-8 py-4 rounded-full bg-slate-700/50 text-slate-300 font-semibold text-lg cursor-default border border-slate-600 inline-flex items-center justify-center select-none"
            >
              Coming soon
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
