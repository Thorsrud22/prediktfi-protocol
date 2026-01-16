import React from 'react';
import Image from 'next/image';
import Aurora from '../components/ui/Aurora';
import ProcessTimeline from '../components/ProcessTimeline';
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

          <div className="pt-8">
            <div className="inline-flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-slate-400 uppercase tracking-widest">
                Official Contract Address
              </span>
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm">
                <code className="font-mono text-slate-300">
                  Pending Launch...
                </code>
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
                CA will be updated here immediately after launch to prevent scams. Verify the address before buying.
              </p>
            </div>
          </div>

          <div className="pt-12 w-full max-w-4xl mx-auto">
            <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-500/10 aspect-video">
              <video
                className="w-full h-full object-cover rounded-xl scale-[1.035]"
                controls
                playsInline
                autoPlay
                muted
                loop
                src="/demo-video.mov"
                poster="/images/video-poster.png"
              >
                <source src="/demo-video.mov" type="video/quicktime" />
                <source src="/demo-video.mov" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <p className="text-sm text-slate-400 mt-4 font-medium">
              Watch the AI Evaluator in action (Pre-alpha footage)
            </p>
          </div>
        </div>
      </div>

      {/* Process Timeline */}
      <ProcessTimeline />
    </div>
  );
}
