'use client';

import React, { memo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSimplifiedWallet } from './wallet/SimplifiedWalletProvider';
import { useOnboarding } from '@/app/hooks/useOnboarding';
import OnboardingModal from './onboarding/OnboardingModal';
import Hero from './Hero';
import TrendingMarkets from './TrendingMarkets';
import ActivityFeed from './ActivityFeed';
import TopCreators from './TopCreators';
import Link from 'next/link';

interface HomeClientProps {
  data: {
    stats: {
      activePredictions: number;
      totalVolume: number;
      accuracyRate: number;
      activeCreators: number;
    };
  };
}

const HomeClient = memo(function HomeClient({ data }: HomeClientProps) {
  const router = useRouter();
  const { isConnected } = useSimplifiedWallet();
  const { showOnboarding, completeOnboarding } = useOnboarding();
  
  // Disabled returning user logic - always show landing page
  const [isReturningUser] = useState(false);

  // Removed auto-redirect logic to allow everyone to see the new Aurora landing page

  return (
    <>
      {/* Onboarding Modal for first-time users */}
      <OnboardingModal isOpen={showOnboarding} onClose={completeOnboarding} />

      {/* Old content hidden - new Aurora landing page is now in app/page.tsx */}
      {/* Uncomment below to show the old Hero + TrendingMarkets layout */}
      
      {/*
      <Hero />

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    🔥 Recent Predictions
                  </h2>
                  <p className="text-gray-400">
                    See what forecasters are predicting and their track records
                  </p>
                </div>
                <Link
                  href="/feed"
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  View All →
                </Link>
              </div>

              <TrendingMarkets limit={6} />
            </div>

            <div className="space-y-8">
              <ActivityFeed />
              <TopCreators />
            </div>
          </div>

          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to prove your forecasting skills?</h3>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join creators building verifiable track records. Make predictions, commit them on-chain, 
              and earn credibility with every accurate forecast.
            </p>
            <div className="inline-flex flex-col sm:flex-row gap-4">
              <Link
                href="/studio"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all transform hover:scale-105"
              >
                🚀 Create Your First Prediction
              </Link>
              <Link
                href="/leaderboard"
                className="px-8 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors"
              >
                🏆 View Top Forecasters
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl font-bold text-white text-center mb-12">Platform Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400 mb-2 group-hover:scale-110 transition-transform">
                {data.stats.activePredictions.toLocaleString()}
              </div>
              <div className="text-gray-400">On-Chain Predictions</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2 group-hover:scale-110 transition-transform">
                {data.stats.activeCreators.toLocaleString()}
              </div>
              <div className="text-gray-400">Active Forecasters</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-2 group-hover:scale-110 transition-transform">
                {data.stats.accuracyRate}%
              </div>
              <div className="text-gray-400">Average Accuracy</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 mb-2 group-hover:scale-110 transition-transform">
                ${data.stats.totalVolume}M
              </div>
              <div className="text-gray-400">Predictions Resolved</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <span className="text-gray-400">Verified on</span>
            <span className="text-white font-bold">Solana Blockchain</span>
            <span className="text-gray-400">•</span>
            <span className="text-white">AI-Powered Analysis</span>
            <span className="text-gray-400">•</span>
            <span className="text-white">Immutable Track Records</span>
            <span className="text-gray-400">•</span>
            <span className="text-white">No Email Required</span>
          </div>
        </div>
      </section>
      */}
    </>
  ); // Return static home content for first-time users
});

export default HomeClient;
