'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';

interface Creator {
  id: string;
  handle: string;
  score: number;
  accuracy: number;
  insightsCount: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  badge?: string;
}

const TopCreators = memo(function TopCreators({ className = '' }: { className?: string }) {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopCreators();
  }, []);

  const loadTopCreators = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard?limit=5');
      if (response.ok) {
        const data = await response.json();
        setCreators(data.leaderboard.map((creator: any, index: number) => ({
          ...creator,
          rank: index + 1,
          trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
          badge: index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : undefined
        })));
      }
    } catch (error) {
      console.error('Failed to load top creators:', error);
      // Use mock data as fallback
      setCreators([
        {
          id: '1',
          handle: 'alice_predictor',
          score: 4.9,
          accuracy: 0.95,
          insightsCount: 234,
          rank: 1,
          trend: 'up',
          badge: '👑'
        },
        {
          id: '2',
          handle: 'bob_analyst',
          score: 4.7,
          accuracy: 0.92,
          insightsCount: 189,
          rank: 2,
          trend: 'stable',
          badge: '🥈'
        },
        {
          id: '3',
          handle: 'charlie_expert',
          score: 4.5,
          accuracy: 0.89,
          insightsCount: 156,
          rank: 3,
          trend: 'up',
          badge: '🥉'
        },
        {
          id: '4',
          handle: 'diana_trader',
          score: 4.3,
          accuracy: 0.87,
          insightsCount: 142,
          rank: 4,
          trend: 'down'
        },
        {
          id: '5',
          handle: 'eve_forecaster',
          score: 4.1,
          accuracy: 0.85,
          insightsCount: 128,
          rank: 5,
          trend: 'up'
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTrendIcon = useCallback((trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  }, []);

  const getTrendColor = useCallback((trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      default: return 'text-gray-400';
    }
  }, []);

  if (loading) {
    return (
      <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 ${className}`}>
        <h3 className="text-xl font-bold text-white mb-4">🏆 Top Creators</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-white/10 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">🏆 Top Creators</h3>
        <Link 
          href="/leaderboard"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          View All →
        </Link>
      </div>
      
      <div className="space-y-3">
        {creators.map((creator) => (
          <Link
            key={creator.id}
            href={`/creator/${creator.handle}`}
            className="block p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-full text-sm font-bold text-white">
                  {creator.badge || creator.rank}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      @{creator.handle}
                    </span>
                    <span className={`text-xs ${getTrendColor(creator.trend)}`}>
                      {getTrendIcon(creator.trend)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-400">
                    <span>⭐ {creator.score.toFixed(1)}</span>
                    <span>🎯 {(creator.accuracy * 100).toFixed(0)}%</span>
                    <span>📊 {creator.insightsCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
});

export default TopCreators;
