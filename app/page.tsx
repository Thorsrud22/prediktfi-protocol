"use client";

import React, { memo } from "react";
import Hero from "./components/Hero";
import TrendingMarkets from "./components/TrendingMarkets";
import ActivityFeed from "./components/ActivityFeed";
import TopCreators from "./components/TopCreators";
import Link from "next/link";

const Home = memo(function Home() {
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
              >
                🚀 Start Creating
              </Link>
              <Link
                href="/leaderboard"
                className="px-8 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors"
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
