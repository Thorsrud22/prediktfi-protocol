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

      <div className="relative z-10 flex flex-col items-center pt-28 sm:pt-[10.625rem] pb-10 sm:pb-12 px-3 sm:px-6">
        <LandingHero />
      </div>

      {/* Process Timeline */}
      <ProcessTimeline />
    </div>
  );
}
