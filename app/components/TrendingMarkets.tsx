'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
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

const TrendingMarkets = memo(function TrendingMarkets({ 
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
    
    // Refresh every 60 seconds (reduced frequency for better performance)
    const interval = setInterval(loadTrendingMarkets, 60000);
    return () => clearInterval(interval);
  }, [limit, initialMarkets.length]);

  const loadTrendingMarkets = useCallback(async () => {
    try {
      const response = await fetch(`/api/markets/trending?limit=${limit}`);
      const data = await response.json();
      
      if (response.ok && data.markets) {
        setMarkets(data.markets);
        setError(null);
      } else {
        // Show error but also provide fallback data
        console.warn('API returned error, using fallback data');
        setMarkets(fallbackMarkets.slice(0, limit));
        setError('Live data temporarily unavailable - showing demo markets');
      }
    } catch (err) {
      console.error('Failed to load trending markets:', err);
      // Show error but provide fallback data for better UX
      setMarkets(fallbackMarkets.slice(0, limit));
      setError('Connection error - showing demo markets');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const formatVolume = useCallback((volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  }, []);

  const formatDeadline = useCallback((deadline: string) => {
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
  }, []);

  const getTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'PREDIKT': return 'bg-gradient-to-r from-blue-500 to-teal-500';
      case 'POLYMARKET': return 'bg-green-500';
      case 'KALSHI': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  }, []);

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 animate-pulse border border-white/10">
            <div className="absolute top-4 right-4 w-16 h-6 bg-white/20 rounded"></div>
            <div className="h-4 bg-white/10 rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-white/10 rounded w-1/2 mb-4"></div>
            <div className="h-2 bg-white/10 rounded-full mb-4"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-3 bg-white/10 rounded"></div>
              <div className="h-3 bg-white/10 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <p className="text-orange-300 text-sm flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {error}
          </p>
        </div>
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
                    className="h-full bg-gradient-to-r from-blue-500 to-teal-500 transition-all"
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
        <div className="mt-4 text-center">
          <button 
            onClick={loadTrendingMarkets}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Retry Loading Live Data
          </button>
        </div>
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
                className="h-full bg-gradient-to-r from-blue-500 to-teal-500 transition-all"
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
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </Link>
      ))}
    </div>
  );
});

export default TrendingMarkets;
