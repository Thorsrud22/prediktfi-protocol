/**
 * Top Creator Badge Component
 * Displays "Top 1/2/3 this week" badges for model cards
 */

'use client';

import { useState, useEffect } from 'react';

interface TopCreatorBadgeProps {
  creatorId: string;
  className?: string;
}

interface TopRanking {
  creatorIdHashed: string;
  rank: 1 | 2 | 3;
}

interface LeaderboardResponse {
  items: Array<{
    creatorIdHashed: string;
    topBadge?: 'top1' | 'top2' | 'top3';
  }>;
}

// Cache for top rankings (10 minutes TTL)
let topRankingsCache: {
  data: TopRanking[];
  timestamp: number;
} | null = null;

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export default function TopCreatorBadge({ creatorId, className = '' }: TopCreatorBadgeProps) {
  const [badge, setBadge] = useState<'top1' | 'top2' | 'top3' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopRankings = async () => {
      try {
        // Check cache first
        if (topRankingsCache && Date.now() - topRankingsCache.timestamp < CACHE_TTL) {
          const ranking = topRankingsCache.data.find(r => r.creatorIdHashed === creatorId);
          if (ranking) {
            setBadge(`top${ranking.rank}` as 'top1' | 'top2' | 'top3');
          }
          setLoading(false);
          return;
        }

        // Fetch from API
        const response = await fetch('/api/public/leaderboard?period=7d&limit=3');
        if (!response.ok) {
          throw new Error('Failed to fetch top rankings');
        }

        const data: LeaderboardResponse = await response.json();
        
        // Update cache
        const rankings: TopRanking[] = data.items
          .filter(item => item.topBadge)
          .map(item => ({
            creatorIdHashed: item.creatorIdHashed,
            rank: parseInt(item.topBadge!.replace('top', '')) as 1 | 2 | 3
          }));

        topRankingsCache = {
          data: rankings,
          timestamp: Date.now()
        };

        // Check if this creator is in top 3
        const ranking = rankings.find(r => r.creatorIdHashed === creatorId);
        if (ranking) {
          setBadge(`top${ranking.rank}` as 'top1' | 'top2' | 'top3');
        }
      } catch (error) {
        console.error('Failed to fetch top rankings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopRankings();
  }, [creatorId]);

  if (loading || !badge) {
    return null;
  }

  const getBadgeConfig = (badge: 'top1' | 'top2' | 'top3') => {
    switch (badge) {
      case 'top1':
        return {
          text: 'Top 1 This Week',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: '🥇'
        };
      case 'top2':
        return {
          text: 'Top 2 This Week',
          className: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: '🥈'
        };
      case 'top3':
        return {
          text: 'Top 3 This Week',
          className: 'bg-orange-100 text-orange-800 border-orange-300',
          icon: '🥉'
        };
    }
  };

  const config = getBadgeConfig(badge);

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.className} ${className}`}>
      <span className="mr-1">{config.icon}</span>
      <span>{config.text}</span>
    </div>
  );
}

/**
 * Hook to get top rankings for multiple creators
 */
export function useTopRankings(creatorIds: string[]) {
  const [rankings, setRankings] = useState<Map<string, 'top1' | 'top2' | 'top3'>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopRankings = async () => {
      try {
        // Check cache first
        if (topRankingsCache && Date.now() - topRankingsCache.timestamp < CACHE_TTL) {
          const rankingsMap = new Map<string, 'top1' | 'top2' | 'top3'>();
          topRankingsCache.data.forEach(ranking => {
            if (creatorIds.includes(ranking.creatorIdHashed)) {
              rankingsMap.set(ranking.creatorIdHashed, `top${ranking.rank}` as 'top1' | 'top2' | 'top3');
            }
          });
          setRankings(rankingsMap);
          setLoading(false);
          return;
        }

        // Fetch from API
        const response = await fetch('/api/public/leaderboard?period=7d&limit=3');
        if (!response.ok) {
          throw new Error('Failed to fetch top rankings');
        }

        const data: LeaderboardResponse = await response.json();
        
        // Update cache
        const topRankings: TopRanking[] = data.items
          .filter(item => item.topBadge)
          .map(item => ({
            creatorIdHashed: item.creatorIdHashed,
            rank: parseInt(item.topBadge!.replace('top', '')) as 1 | 2 | 3
          }));

        topRankingsCache = {
          data: topRankings,
          timestamp: Date.now()
        };

        // Create rankings map
        const rankingsMap = new Map<string, 'top1' | 'top2' | 'top3'>();
        topRankings.forEach(ranking => {
          if (creatorIds.includes(ranking.creatorIdHashed)) {
            rankingsMap.set(ranking.creatorIdHashed, `top${ranking.rank}` as 'top1' | 'top2' | 'top3');
          }
        });

        setRankings(rankingsMap);
      } catch (error) {
        console.error('Failed to fetch top rankings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopRankings();
  }, [creatorIds.join(',')]);

  return { rankings, loading };
}
