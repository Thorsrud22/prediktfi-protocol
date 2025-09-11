/**
 * Creator Digest Page
 * Shows daily creator performance summary with top performers and transitions
 */

import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Creator Digest | Predikt',
  description: 'Daily creator performance summary with top performers and transitions.',
};

interface CreatorDigestResponse {
  date: string;
  summary: {
    totalCreators: number;
    provisionalCreators: number;
    stableCreators: number;
    newStable: number;
    topPerformers: number;
  };
  topPerformers: Array<{
    id: string;
    handle: string;
    score: number;
    accuracy: number;
    rank: number;
    isProvisional: boolean;
    trend: 'up' | 'down' | 'flat';
    change: number;
  }>;
  movers: Array<{
    id: string;
    handle: string;
    score: number;
    rank: number;
    previousRank: number;
    rankChange: number;
    isProvisional: boolean;
    trend: 'up' | 'down' | 'flat';
  }>;
  provisionalToStable: Array<{
    id: string;
    handle: string;
    score: number;
    maturedInsights: number;
    previousMatured: number;
    change: number;
  }>;
  generatedAt: string;
}

async function getCreatorDigest(): Promise<CreatorDigestResponse | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/digest/creator`, {
      headers: {
        'x-ops-signature': process.env.OPS_SECRET || 'test'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching creator digest:', error);
    return null;
  }
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') return <span className="text-green-500">↗️</span>;
  if (trend === 'down') return <span className="text-red-500">↘️</span>;
  return <span className="text-gray-500">→</span>;
}

function ChangeBadge({ change, type = 'score' }: { change: number; type?: 'score' | 'rank' }) {
  const isPositive = change > 0;
  const isSignificant = Math.abs(change) > (type === 'score' ? 0.01 : 5);
  
  if (!isSignificant) return null;
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      isPositive 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {isPositive ? '+' : ''}{type === 'score' ? (change * 100).toFixed(1) + '%' : change}
    </span>
  );
}

function CreatorCard({ 
  creator, 
  showRank = true, 
  showTrend = true,
  showChange = true 
}: { 
  creator: any; 
  showRank?: boolean; 
  showTrend?: boolean;
  showChange?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
      <div className="flex items-center space-x-4">
        {showRank && (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
            #{creator.rank}
          </div>
        )}
        
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900">{creator.handle}</h3>
            {creator.isProvisional && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                Provisional
              </span>
            )}
            {showTrend && <TrendIcon trend={creator.trend} />}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Score: {(creator.score * 100).toFixed(1)}%</span>
            <span>Accuracy: {(creator.accuracy * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
      
      {showChange && creator.change !== undefined && (
        <ChangeBadge change={creator.change} type="score" />
      )}
    </div>
  );
}

function MoverCard({ mover }: { mover: any }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
          #{mover.rank}
        </div>
        
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900">{mover.handle}</h3>
            {mover.isProvisional && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                Provisional
              </span>
            )}
            <TrendIcon trend={mover.trend} />
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Score: {(mover.score * 100).toFixed(1)}%</span>
            <span>Was #{mover.previousRank}</span>
          </div>
        </div>
      </div>
      
      <ChangeBadge change={mover.rankChange} type="rank" />
    </div>
  );
}

function TransitionCard({ transition }: { transition: any }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-medium text-green-800">
          ✓
        </div>
        
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900">{transition.handle}</h3>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Now Stable
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Score: {(transition.score * 100).toFixed(1)}%</span>
            <span>Insights: {transition.maturedInsights}</span>
          </div>
        </div>
      </div>
      
      <ChangeBadge change={transition.change} type="score" />
    </div>
  );
}

export default async function DigestPage() {
  const digest = await getCreatorDigest();
  
  if (!digest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Digest Unavailable</h1>
          <p className="text-gray-600">Unable to load creator digest. Please try again later.</p>
        </div>
      </div>
    );
  }
  
  const { summary, topPerformers, movers, provisionalToStable } = digest;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Creator Digest</h1>
          <p className="text-gray-600 mt-2">
            Daily performance summary for {digest.date}
          </p>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900">{summary.totalCreators}</div>
            <div className="text-sm text-gray-600">Total Creators</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-2xl font-bold text-green-600">{summary.stableCreators}</div>
            <div className="text-sm text-gray-600">Stable Scores</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-2xl font-bold text-yellow-600">{summary.provisionalCreators}</div>
            <div className="text-sm text-gray-600">Provisional</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-2xl font-bold text-blue-600">{summary.newStable}</div>
            <div className="text-sm text-gray-600">New Stable</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-2xl font-bold text-purple-600">{movers.length}</div>
            <div className="text-sm text-gray-600">Big Movers</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performers */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Performers</h2>
            <div className="space-y-3">
              {topPerformers.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          </div>
          
          {/* Big Movers */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Big Movers</h2>
            <div className="space-y-3">
              {movers.length > 0 ? (
                movers.map((mover) => (
                  <MoverCard key={mover.id} mover={mover} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No significant rank changes today
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Provisional to Stable Transitions */}
        {provisionalToStable.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Provisional → Stable Transitions
            </h2>
            <div className="space-y-3">
              {provisionalToStable.map((transition) => (
                <TransitionCard key={transition.id} transition={transition} />
              ))}
            </div>
          </div>
        )}
        
        {/* Generated timestamp */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Generated at {new Date(digest.generatedAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
