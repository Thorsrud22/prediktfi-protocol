'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the PredictionMarketInterface to avoid SSR issues with wallet adapter
const PredictionMarketInterface = dynamic(
  () => import('../../components/PredictionMarketInterface').then(mod => ({ default: mod.PredictionMarketInterface })),
  { 
    ssr: false,
    loading: () => <div className="flex justify-center items-center min-h-screen">Loading prediction markets...</div>
  }
);

export default function PredictionMarketsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PredictionMarketInterface />
    </div>
  );
}
