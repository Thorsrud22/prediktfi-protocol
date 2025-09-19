'use client';

import { useCallback, useEffect, useState } from 'react';

interface CreatorRank {
  id: string;
  handle: string;
  rank: number;
  score: number;
  accuracy: number;
  totalInsights: number;
  resolvedInsights: number;
  averageBrier: number;
  isProvisional: boolean;
  trend?: 'up' | 'down' | 'flat';
}

interface TopCreatorsResponse {
  leaderboard: CreatorRank[];
  meta: {
    period: 'all' | '90d';
    limit: number;
    total: number;
    generatedAt: string;
  };
}

const CACHE_KEY = 'topCreators7d:v1';
const TTL = 300000; // 5 minutes in milliseconds

interface CacheEntry {
  data: Record<string, number>;
  timestamp: number;
}

export function useTopCreators() {
  const [creatorRanks, setCreatorRanks] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopCreators = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const cacheEntry: CacheEntry = JSON.parse(cached);
          const now = Date.now();
          
          if (now - cacheEntry.timestamp < TTL) {
            // Cache is still valid
            const rankMap = new Map(Object.entries(cacheEntry.data));
            setCreatorRanks(rankMap);
            setLoading(false);
            return;
          }
        } catch (e) {
          // Invalid cache, continue to fetch
          console.warn('Invalid cache data, fetching fresh data');
        }
      }

      // Fetch fresh data
      const response = await fetch('/api/leaderboard?period=90d&limit=50');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`);
      }

      const data: TopCreatorsResponse = await response.json();
      
      // Convert to Map<creatorIdHashed, rank>
      const rankMap = new Map<string, number>();
      data.leaderboard.forEach((creator, index) => {
        // Use creator.id as the key (assuming it's already hashed)
        rankMap.set(creator.id, index + 1);
      });

      setCreatorRanks(rankMap);

      // Cache the result
      const cacheEntry: CacheEntry = {
        data: Object.fromEntries(rankMap),
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));

    } catch (err) {
      console.error('Failed to fetch top creators:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Try to use cached data even if expired
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const cacheEntry: CacheEntry = JSON.parse(cached);
          const rankMap = new Map(Object.entries(cacheEntry.data));
          setCreatorRanks(rankMap);
        } catch (e) {
          // Cache is corrupted, use empty map
          setCreatorRanks(new Map());
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopCreators();
  }, [fetchTopCreators]);

  const getCreatorRank = useCallback((creatorId: string): number | undefined => {
    return creatorRanks.get(creatorId);
  }, [creatorRanks]);

  const isTopCreator = useCallback((creatorId: string): boolean => {
    const rank = getCreatorRank(creatorId);
    return rank !== undefined && rank <= 3;
  }, [getCreatorRank]);

  const getTopCreatorBadge = useCallback((creatorId: string): string | null => {
    const rank = getCreatorRank(creatorId);
    if (!rank || rank > 3) return null;
    
    switch (rank) {
      case 1: return 'Top 1 this week';
      case 2: return 'Top 2 this week';
      case 3: return 'Top 3 this week';
      default: return null;
    }
  }, [getCreatorRank]);

  return {
    creatorRanks,
    loading,
    error,
    getCreatorRank,
    isTopCreator,
    getTopCreatorBadge,
    refetch: fetchTopCreators
  };
}
