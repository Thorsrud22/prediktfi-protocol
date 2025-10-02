'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LeaderboardEntry {
  rank: number;
  id: string;
  handle: string;
  wallet: string;
  profileImage?: string;
  bio?: string;
  accuracyScore: number;
  accuracyPercentage: number;
  totalPredictions: number;
  resolvedPredictions: number;
  activePredictions: number;
  createdAt: string;
  recentPredictions: Array<{
    id: string;
    question: string;
    probability: number;
    outcome?: {
      result: string;
      resolvedAt: string;
    };
  }>;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  meta: {
    total: number;
    minPredictions: number;
    timestamp: string;
  };
}

function getRankColor(rank: number): string {
  if (rank === 1) return 'from-yellow-400 to-yellow-600';
  if (rank === 2) return 'from-gray-300 to-gray-500';
  if (rank === 3) return 'from-orange-400 to-orange-600';
  return 'from-blue-500 to-indigo-600';
}

function getRankIcon(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '🔹';
}

export default function LeaderboardClient() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minPredictions, setMinPredictions] = useState(3);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/leaderboard?limit=50&minPredictions=${minPredictions}`,
          {
            cache: 'no-store',
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || 'Failed to fetch leaderboard');
        }

        const result = await response.json();
        
        // Validate response structure
        if (!result.leaderboard || !Array.isArray(result.leaderboard)) {
          throw new Error('Invalid leaderboard data format');
        }

        setData(result);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [minPredictions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Top Forecasters
            </h1>
            <p className="text-xl text-blue-200">
              Loading the best predictors...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-8 text-center">
            <div className="text-red-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Leaderboard</h2>
            <p className="text-red-200 mb-6">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                window.location.reload();
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.leaderboard || data.leaderboard.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Top Forecasters
            </h1>
            <p className="text-xl text-blue-200">
              Track record verified on Solana blockchain
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center backdrop-blur-sm">
            <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">No Forecasters Yet</h2>
            <p className="text-slate-300 mb-6 max-w-md mx-auto">
              Be the first to establish a track record! Create predictions and resolve them to appear on the leaderboard.
            </p>
            <Link
              href="/studio"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Your First Prediction
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const topThree = data.leaderboard.slice(0, 3);
  const restOfLeaderboard = data.leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🏆 Top Forecasters
          </h1>
          <p className="text-xl text-blue-200 mb-6">
            Track record verified on Solana blockchain
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-300">
            <div className="bg-slate-800/50 px-4 py-2 rounded-lg backdrop-blur-sm">
              <span className="font-semibold text-blue-400">{data.meta.total}</span> forecasters
            </div>
            <div className="bg-slate-800/50 px-4 py-2 rounded-lg backdrop-blur-sm">
              Min. <span className="font-semibold text-blue-400">{data.meta.minPredictions}</span> resolved predictions
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-8 flex justify-center">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm">
            <label className="text-slate-300 text-sm font-medium mr-3">
              Minimum Resolved Predictions:
            </label>
            <select
              value={minPredictions}
              onChange={(e) => setMinPredictions(Number(e.target.value))}
              className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1+</option>
              <option value={3}>3+</option>
              <option value={5}>5+</option>
              <option value={10}>10+</option>
            </select>
          </div>
        </div>

        {/* Top 3 Podium */}
        {topThree.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* 2nd Place */}
            <div className="md:order-1 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl p-6 border-2 border-gray-400 shadow-xl">
              <div className="text-center">
                <div className="text-4xl mb-2">🥈</div>
                <div className="text-gray-300 font-bold text-lg mb-1">2nd Place</div>
                <LeaderboardCard entry={topThree[1]} compact />
              </div>
            </div>

            {/* 1st Place */}
            <div className="md:order-2 bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-2xl p-6 border-2 border-yellow-400 shadow-2xl transform md:scale-110">
              <div className="text-center">
                <div className="text-5xl mb-2">🥇</div>
                <div className="text-yellow-100 font-bold text-xl mb-1">Champion</div>
                <LeaderboardCard entry={topThree[0]} compact />
              </div>
            </div>

            {/* 3rd Place */}
            <div className="md:order-3 bg-gradient-to-br from-orange-700 to-orange-900 rounded-2xl p-6 border-2 border-orange-400 shadow-xl">
              <div className="text-center">
                <div className="text-4xl mb-2">🥉</div>
                <div className="text-orange-200 font-bold text-lg mb-1">3rd Place</div>
                <LeaderboardCard entry={topThree[2]} compact />
              </div>
            </div>
          </div>
        )}

        {/* Rest of Leaderboard */}
        {restOfLeaderboard.length > 0 && (
          <div className="space-y-4">
            {restOfLeaderboard.map((entry) => (
              <div
                key={entry.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm hover:border-blue-500/50 transition-all"
              >
                <LeaderboardCard entry={entry} />
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-3">
              Want to join the leaderboard?
            </h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Create predictions, resolve them accurately, and build your verifiable track record on-chain.
            </p>
            <Link
              href="/studio"
              className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors shadow-lg"
            >
              Start Forecasting
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardCard({ entry, compact = false }: { entry: LeaderboardEntry; compact?: boolean }) {
  if (!entry) return null;

  return (
    <div className="flex items-center gap-4">
      {!compact && (
        <div className="text-2xl font-bold text-slate-400 w-12 text-center flex-shrink-0">
          {getRankIcon(entry.rank)} {entry.rank}
        </div>
      )}
      
      {/* Avatar */}
      <div className={`bg-gradient-to-br ${getRankColor(entry.rank)} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${compact ? 'w-12 h-12 text-lg' : 'w-16 h-16 text-xl'}`}>
        {entry.handle?.[0]?.toUpperCase() || '?'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-bold text-white truncate ${compact ? 'text-base' : 'text-lg'}`}>
            @{entry.handle || 'anonymous'}
          </h3>
          {entry.rank <= 3 && !compact && (
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full">
              TOP {entry.rank}
            </span>
          )}
        </div>
        {entry.bio && !compact && (
          <p className="text-sm text-slate-400 mb-2 truncate">{entry.bio}</p>
        )}
        <div className={`flex flex-wrap gap-3 ${compact ? 'text-xs' : 'text-sm'} text-slate-300`}>
          <div>
            <span className="text-green-400 font-bold text-lg">{entry.accuracyPercentage}%</span>
            <span className="ml-1 text-slate-400">accuracy</span>
          </div>
          <div className="text-slate-500">•</div>
          <div>
            <span className="font-semibold text-blue-400">{entry.resolvedPredictions}</span> resolved
          </div>
          <div className="text-slate-500">•</div>
          <div>
            <span className="font-semibold text-indigo-400">{entry.activePredictions}</span> active
          </div>
        </div>
      </div>

      {!compact && (
        <Link
          href={`/creator/${entry.handle}`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex-shrink-0"
        >
          View Profile
        </Link>
      )}
    </div>
  );
}
