'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface TrendingMarket {
  id: string;
  type: 'PREDIKT' | 'POLYMARKET' | 'KALSHI';
  title: string;
  probability: number;
  volume: number;
  deadline: string;
  creator: string;
  creatorScore: number;
  status: string;
  url: string;
}

interface TrendingMarketsProps {
  initialMarkets?: TrendingMarket[];
  limit?: number;
  className?: string;
}

export default function TrendingMarkets({ 
  initialMarkets = [], 
  limit = 6,
  className = '' 
}: TrendingMarketsProps) {
  // Fallback data if API fails
  const fallbackMarkets: TrendingMarket[] = [
    {
      id: 'fallback-1',
      type: 'PREDIKT',
      title: 'Will AI surpass human intelligence by 2030?',
      probability: 0.65,
      volume: 50000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      creator: 'predikt_ai',
      creatorScore: 4.8,
      status: 'ACTIVE',
      url: '/studio'
    },
    {
      id: 'fallback-2',
      type: 'POLYMARKET',
      title: 'Bitcoin reaching $100k by end of 2024',
      probability: 0.72,
      volume: 125000,
      deadline: '2024-12-31T23:59:59Z',
      creator: 'polymarket',
      creatorScore: 0,
      status: 'ACTIVE',
      url: 'https://polymarket.com'
    }
  ];

  const [markets, setMarkets] = useState<TrendingMarket[]>(initialMarkets.length > 0 ? initialMarkets : fallbackMarkets);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load if we don't have initial data
    if (initialMarkets.length === 0) {
      loadTrendingMarkets();
    }
    
    // Refresh every 30 seconds
    const interval = setInterval(loadTrendingMarkets, 30000);
    return () => clearInterval(interval);
  }, [limit, initialMarkets.length]);

  const loadTrendingMarkets = async () => {
    try {
      const response = await fetch(`/api/markets/trending?limit=${limit}`);
      const data = await response.json();
      
      if (response.ok && data.markets) {
        setMarkets(data.markets);
        setError(null);
      } else {
        // Use fallback data instead of showing error
        setMarkets(fallbackMarkets.slice(0, limit));
        setError(null);
      }
    } catch (err) {
      console.error('Failed to load trending markets:', err);
      // Use fallback data instead of showing error
      setMarkets(fallbackMarkets.slice(0, limit));
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Ended';
    if (diffDays === 0) return 'Ends today';
    if (diffDays === 1) return 'Ends tomorrow';
    if (diffDays <= 7) return `Ends in ${diffDays} days`;
    if (diffDays <= 30) return `Ends in ${Math.floor(diffDays / 7)} weeks`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PREDIKT': return 'bg-gradient-to-r from-blue-500 to-purple-500';
      case 'POLYMARKET': return 'bg-green-500';
      case 'KALSHI': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-white/10 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-400 mb-4">{error}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fallbackMarkets.slice(0, limit).map((market) => (
            <div key={market.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="absolute top-4 right-4 z-10">
                <span className={`px-2 py-1 text-xs font-bold text-white rounded shadow-lg ${getTypeColor(market.type)}`}>
                  {market.type}
                </span>
              </div>
              <h3 className="text-white font-semibold mb-4 pr-24 line-clamp-2">
                {market.title}
              </h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>Probability</span>
                  <span className="font-bold text-white">{(market.probability * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                    style={{ width: `${market.probability * 100}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Volume</p>
                  <p className="text-white font-semibold">${formatVolume(market.volume)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Deadline</p>
                  <p className="text-white font-semibold">{formatDeadline(market.deadline)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button 
          onClick={loadTrendingMarkets}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry Loading Live Data
        </button>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {markets.map((market) => (
        <Link
          key={market.id}
          href={market.type === 'PREDIKT' ? market.url : market.url}
          target={market.type !== 'PREDIKT' ? '_blank' : undefined}
          rel={market.type !== 'PREDIKT' ? 'noopener noreferrer' : undefined}
          className="group relative bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all hover:bg-white/10"
        >
          {/* Type Badge */}
          <div className="absolute top-4 right-4 z-10">
            <span className={`px-2 py-1 text-xs font-bold text-white rounded shadow-lg ${getTypeColor(market.type)}`}>
              {market.type}
            </span>
          </div>

          {/* Market Title */}
          <h3 className="text-white font-semibold mb-4 pr-24 line-clamp-2 group-hover:text-blue-400 transition-colors">
            {market.title}
          </h3>

          {/* Probability Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Probability</span>
              <span className="font-bold text-white">{(market.probability * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                style={{ width: `${market.probability * 100}%` }}
              />
            </div>
          </div>

          {/* Market Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Volume</p>
              <p className="text-white font-semibold">${formatVolume(market.volume)}</p>
            </div>
            <div>
              <p className="text-gray-400">Deadline</p>
              <p className="text-white font-semibold">{formatDeadline(market.deadline)}</p>
            </div>
          </div>

          {/* Creator Info (for PREDIKT markets) */}
          {market.type === 'PREDIKT' && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  by <span className="text-white">@{market.creator}</span>
                </span>
                {market.creatorScore > 0 && (
                  <span className="text-yellow-400">
                    ⭐ {market.creatorScore.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Hover Effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </Link>
      ))}
    </div>
  );
}
