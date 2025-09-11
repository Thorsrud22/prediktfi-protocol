"use client";

import React, { memo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletAuth } from './lib/useWalletAuth';
import Hero from "./components/Hero";
import TrendingMarkets from "./components/TrendingMarkets";
import ActivityFeed from "./components/ActivityFeed";
import TopCreators from "./components/TopCreators";
import Link from "next/link";

const Home = memo(function Home() {
  const router = useRouter();
  const { connected } = useWallet();
  const { isAuthenticated } = useWalletAuth();
  const [isReturningUser, setIsReturningUser] = useState<boolean | null>(null);

  // Check if user is returning (has visited before) or has wallet connected
  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      setIsReturningUser(false);
      return;
    }

    try {
      // Check for various indicators of returning user
      const hasVisitedBefore = 
        localStorage.getItem('predikt:visited') === 'true' ||
        localStorage.getItem('predikt:referral') !== null ||
        document.cookie.includes('predikt_plan=') ||
        document.cookie.includes('predikt_consent_v1=');

      setIsReturningUser(hasVisitedBefore);

      // If returning user OR wallet is authenticated, redirect to Feed after a short delay
      if (hasVisitedBefore || (connected && isAuthenticated)) {
        const timer = setTimeout(() => {
          router.push('/feed');
        }, 1500); // 1.5 second delay to show the redirect

        return () => clearTimeout(timer);
      } else {
        // Mark as visited for future visits
        localStorage.setItem('predikt:visited', 'true');
      }
    } catch (error) {
      console.warn('Error checking returning user status:', error);
      setIsReturningUser(false);
    }
  }, [router, connected, isAuthenticated]);

  const trackEvent = (eventName: string, properties: Record<string, any> = {}) => {
    if (typeof window === 'undefined') return;

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: eventName,
        properties: {
          ...properties,
          ts: Date.now(),
          path: window.location.pathname
        },
        timestamp: new Date().toISOString(),
      }),
    }).catch(error => {
      console.error('Failed to track event:', error);
    });
  };

  // Show loading state while checking returning user status
  if (isReturningUser === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show redirect message for returning users or authenticated wallet
  if (isReturningUser || (connected && isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {connected && isAuthenticated ? 'Wallet Authenticated!' : 'Welcome back!'}
          </h2>
          <p className="text-gray-400 mb-4">Taking you to your Feed...</p>
          <div className="w-64 bg-gray-700 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />
      
      {/* Main Content Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Column - Trending Markets */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    🔥 Trending Prediction Markets
                  </h2>
                  <p className="text-gray-400">
                    Live markets from PrediktFi creators and external platforms
                  </p>
                </div>
                <Link 
                  href="/feed"
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  onClick={() => trackEvent('home_trending_view_all')}
                >
                  View All →
                </Link>
              </div>
              
              <TrendingMarkets limit={6} />
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Live Activity Feed */}
              <ActivityFeed />
              
              {/* Top Creators */}
              <TopCreators />
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to make predictions?
            </h3>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of creators making data-driven predictions. 
              Use AI-powered insights, connect to real markets, and build your reputation.
            </p>
            <div className="inline-flex flex-col sm:flex-row gap-4">
              <Link
                href="/studio"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all transform hover:scale-105"
                onClick={() => trackEvent('home_hero_open_studio_clicked')}
              >
                🚀 Start Creating
              </Link>
              <Link
                href="/leaderboard"
                className="px-8 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors"
                onClick={() => trackEvent('home_hero_view_feed_clicked')}
              >
                🏆 View Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl font-bold text-white text-center mb-12">
            Platform Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400 mb-2 group-hover:scale-110 transition-transform">
                1,234
              </div>
              <div className="text-gray-400">Active Predictions</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2 group-hover:scale-110 transition-transform">
                $2.5M
              </div>
              <div className="text-gray-400">Total Volume</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-2 group-hover:scale-110 transition-transform">
                89%
              </div>
              <div className="text-gray-400">Accuracy Rate</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 mb-2 group-hover:scale-110 transition-transform">
                5,678
              </div>
              <div className="text-gray-400">Active Creators</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <span className="text-gray-400">Powered by</span>
            <span className="text-white font-bold">Solana</span>
            <span className="text-gray-400">•</span>
            <span className="text-white">AI-Driven Analysis</span>
            <span className="text-gray-400">•</span>
            <span className="text-white">Real-Time Resolution</span>
            <span className="text-gray-400">•</span>
            <span className="text-white">Verified On-Chain</span>
          </div>
        </div>
      </section>
    </div>
  );
});

export default Home;
