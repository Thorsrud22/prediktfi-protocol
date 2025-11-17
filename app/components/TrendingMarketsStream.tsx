'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { useTopCreators } from '../lib/topCreatorsClient';
import { SkeletonCard } from './ui/Skeleton';

interface TrendingMarket {
  id: string;
  type: 'PREDIKT' | 'KALSHI';
  title: string;
  probability: number;
  volume: number;
  deadline: string;
  creator: string;
  creatorId?: string;
  creatorScore: number;
  status: string;
  url: string;
}

interface TrendingMarketsStreamProps {
  initialMarkets?: TrendingMarket[];
  limit?: number;
}

const TrendingMarketsStream = memo(function TrendingMarketsStream({ 
  initialMarkets = [], 
  limit = 6
}: TrendingMarketsStreamProps) {
  const { getTopCreatorBadge } = useTopCreators();
  
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
      creatorId: 'creator-1',
      creatorScore: 4.8,
      status: 'ACTIVE',
      url: '/studio'
    },
    {
      id: 'fallback-2',
      type: 'KALSHI',
      title: 'Fed will hold rates in Q4',
      probability: 0.44,
      volume: 42000,
      deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
      creator: 'macro_observer',
      creatorId: 'creator-2',
      creatorScore: 4.2,
      status: 'ACTIVE',
      url: 'https://kalshi.com'
    },
    // Add more fallback markets...
  ];

  const [markets, setMarkets] = useState<TrendingMarket[]>(
    initialMarkets.length > 0 ? initialMarkets : fallbackMarkets
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load markets from API
  useEffect(() => {
    if (initialMarkets.length === 0) {
      loadTrendingMarkets();
    }
  }, []);

  const loadTrendingMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/public/trending-markets');
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      setMarkets(data.markets || fallbackMarkets);
    } catch (err) {
      console.error('Failed to load trending markets:', err);
      setError('Failed to load markets');
      setMarkets(fallbackMarkets);
    } finally {
      setLoading(false);
    }
  }, [fallbackMarkets]);

  const formatVolume = useCallback((volume: number) => {
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `$${(volume / 1000).toFixed(0)}K`;
    return `$${volume}`;
  }, []);

  const formatDeadline = useCallback((deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Ended';
    if (diffDays === 1) return '1 day left';
    if (diffDays <= 7) return `${diffDays} days left`;
    return date.toLocaleDateString();
  }, []);

  const getTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'PREDIKT': return 'bg-blue-500/20 text-blue-300';
      case 'KALSHI': return 'bg-green-500/20 text-green-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  }, []);

  const displayMarkets = useMemo(() => 
    markets.slice(0, limit), 
    [markets, limit]
  );

  if (loading && markets.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: limit }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error && markets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">{error}</p>
        <button 
          onClick={loadTrendingMarkets}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayMarkets.map((market) => (
        <Link 
          key={market.id} 
          href={market.url}
          className="group block"
          target={market.type !== 'PREDIKT' ? '_blank' : undefined}
          rel={market.type !== 'PREDIKT' ? 'noopener noreferrer' : undefined}
        >
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-200 group-hover:bg-slate-800/70">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(market.type)}`}>
                {market.type}
              </span>
              <div className="text-right">
                <div className="text-lg font-bold text-white">
                  {(market.probability * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-slate-400">probability</div>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2 group-hover:text-blue-300 transition-colors">
              {market.title}
            </h3>

            {/* Stats */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Volume:</span>
                <span className="text-slate-200 font-medium">{formatVolume(market.volume)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Deadline:</span>
                <span className="text-slate-200 font-medium">{formatDeadline(market.deadline)}</span>
              </div>
            </div>

            {/* Creator */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {market.creator.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-slate-300">{market.creator}</span>
              </div>
              
              {market.creatorId && (
                <div className="flex items-center space-x-1">
                  {getTopCreatorBadge(market.creatorId)}
                  <span className="text-xs text-slate-400">
                    {market.creatorScore.toFixed(1)}★
                  </span>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
});

export default TrendingMarketsStream;
