import React from 'react';
import { Suspense } from 'react';
import { SkeletonCard } from './ui/Skeleton';
import TrendingMarketsStream from './TrendingMarketsStream';

// Server Component with streaming
async function getTrendingMarkets(limit: number = 6) {
  // Simulate slow API call
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return [
    {
      id: 'server-1',
      type: 'PREDIKT' as const,
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
      id: 'server-2',
      type: 'KALSHI' as const,
      title: 'Fed will hold rates in Q4',
      probability: 0.44,
      volume: 42000,
      deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
      creator: 'macro_observer',
      creatorId: 'creator-2',
      creatorScore: 4.2,
      status: 'ACTIVE',
      url: 'https://kalshi.com'
    }
  ].slice(0, limit);
}

interface TrendingMarketsProps {
  limit?: number;
  className?: string;
}

export default async function TrendingMarkets({ 
  limit = 6,
  className = '' 
}: TrendingMarketsProps) {
  // Pre-fetch initial data on server
  const initialMarkets = await getTrendingMarkets(limit);

  return (
    <div className={className}>
      <Suspense 
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: limit }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        }
      >
        <TrendingMarketsStream 
          initialMarkets={initialMarkets} 
          limit={limit} 
        />
      </Suspense>
    </div>
  );
}
