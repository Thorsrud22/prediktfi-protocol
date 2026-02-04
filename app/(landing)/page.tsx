import React from 'react';
import ProcessTimeline from '../components/ProcessTimeline';
import LandingHero from '../components/landing/LandingHero';

export const dynamic = "force-static";
export const revalidate = 86400;

import { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
}

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center pt-32 sm:pt-44 pb-16 sm:pb-20 px-3 sm:px-6">
        <LandingHero />
      </div>

      {/* Process Timeline */}
      <ProcessTimeline />
    </div>
  );
}
