import React from 'react';
import ProcessTimeline from '../components/ProcessTimeline';
import LandingHero from '../components/landing/LandingHero';



import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Predikt — AI Evaluation Protocol for Web3',
  description: 'Institutional-grade AI evaluation for Web3, DeFi, and Memecoins. Real-time market signals and on-chain security verification.',
  alternates: {
    canonical: '/',
  },
}

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hero Section */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[#000000] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      <div className="absolute inset-0 -z-10 h-full w-full bg-[url('/noise.svg')] opacity-5 mix-blend-soft-light pointer-events-none" style={{ opacity: 0.035 }}></div>

      <div className="relative z-10 flex flex-col items-center pt-32 sm:pt-40 pb-10 sm:pb-12 px-3 sm:px-6">
        <LandingHero />
      </div>

      {/* Process Timeline */}
      <ProcessTimeline />
    </div>
  );
}
