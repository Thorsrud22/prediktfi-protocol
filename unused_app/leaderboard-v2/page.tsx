/**
 * Creator Leaderboard v2 - New Scoring System
 * Displays creator rankings with accuracy, consistency, volume, and recency components
 */

'use client';

import { useState, useEffect } from 'react';
import { formatScore, SCORE } from '../lib/creatorScore';

interface LeaderboardItem {
  creatorIdHashed: string;
  score: number;
  accuracy: number;
  consistency: number;
  volumeScore: number;
  recencyScore: number;
  maturedN: number;
  topBadge?: 'top1' | 'top2' | 'top3';
  trend?: 'up' | 'down' | 'flat';
  isProvisional: boolean;
}

interface LeaderboardResponse {
  etag: string;
  generatedAt: string;
  period: string;
  items: LeaderboardItem[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

const PERIODS = [
  { key: '7d', label: '7 Days', description: 'This week' },
  { key: '30d', label: '30 Days', description: 'This month' },
  { key: '90d', label: '90 Days', description: 'This quarter' },
  { key: 'all', label: 'All Time', description: 'Since launch' }
] as const;

type Period = typeof PERIODS[number]['key'];

export default function LeaderboardV2Page() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('30d');
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'accuracy' | 'consistency' | 'volume' | 'recency'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLeaderboard = async (period: Period) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/public/leaderboard?period=${period}&limit=100`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`);
      }
      
      const data: LeaderboardResponse = await response.json();
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(selectedPeriod);
  }, [selectedPeriod]);

  const getRankIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (index === 1) return 'text-gray-600 bg-gray-50 border-gray-200';
    if (index === 2) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-gray-700 bg-white border-gray-200';
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-blue-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'flat': return '→';
      default: return '';
    }
  };

  const getTopBadgeColor = (badge?: 'top1' | 'top2' | 'top3') => {
    switch (badge) {
      case 'top1': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'top2': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'top3': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return '';
    }
  };

  const getTopBadgeText = (badge?: 'top1' | 'top2' | 'top3') => {
    switch (badge) {
      case 'top1': return 'Top 1 This Week';
      case 'top2': return 'Top 2 This Week';
      case 'top3': return 'Top 3 This Week';
      default: return '';
    }
  };

  const sortedItems = leaderboard?.items ? [...leaderboard.items].sort((a, b) => {
    const aValue = (a as any)[sortBy];
    const bValue = (b as any)[sortBy];
    const multiplier = sortOrder === 'desc' ? -1 : 1;
    return (aValue - bValue) * multiplier;
  }) : [];

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'desc' ? '↓' : '↑';
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      window.location.href = `/creator/${searchQuery.trim()}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading Leaderboard</h2>
          <p className="text-gray-600">Fetching creator scores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Leaderboard Unavailable</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchLeaderboard(selectedPeriod)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Creator Leaderboard</h1>
              <p className="text-gray-600">
                Rankings based on accuracy, consistency, volume, and recency
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search creator handle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => searchQuery.trim() && (window.location.href = `/creator/${searchQuery.trim()}`)}
                disabled={!searchQuery.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Go
              </button>
            </div>
          </div>
        </div>

        {/* Period Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {PERIODS.map((period) => (
                <button
                  key={period.key}
                  onClick={() => setSelectedPeriod(period.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedPeriod === period.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold">{period.label}</div>
                    <div className="text-xs text-gray-400">{period.description}</div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Score Breakdown Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Score Components</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-blue-800">
            <div>
              <span className="font-medium">Accuracy:</span> {formatScore(SCORE.W_ACC)} weight
            </div>
            <div>
              <span className="font-medium">Consistency:</span> {formatScore(SCORE.W_CONS)} weight
            </div>
            <div>
              <span className="font-medium">Volume:</span> {formatScore(SCORE.W_VOL)} weight
            </div>
            <div>
              <span className="font-medium">Recency:</span> {formatScore(SCORE.W_REC)} weight
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creator
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('score')}
                  >
                    Total Score {getSortIcon('score')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('accuracy')}
                  >
                    Accuracy {getSortIcon('accuracy')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('consistency')}
                  >
                    Consistency {getSortIcon('consistency')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('volume')}
                  >
                    Volume {getSortIcon('volume')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('recency')}
                  >
                    Recency {getSortIcon('recency')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matured
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedItems.map((item, index) => (
                  <tr 
                    key={item.creatorIdHashed} 
                    className="hover:bg-gray-50 cursor-pointer group"
                    onClick={() => {
                      // Track analytics event
                      if (typeof window !== 'undefined') {
                        fetch('/api/analytics', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            event: 'creator_profile_nav_from_leaderboard',
                            properties: { 
                              creatorIdHashed: item.creatorIdHashed,
                              period: selectedPeriod,
                              rank: index + 1,
                              ts: Date.now(),
                              path: window.location.pathname 
                            },
                            timestamp: new Date().toISOString(),
                          }),
                        }).catch(error => console.error('Failed to track event:', error));
                      }
                      window.location.href = `/creator/${item.creatorIdHashed}`;
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRankColor(index)}`}>
                        {getRankIcon(index)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {item.creatorIdHashed.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              Creator {item.creatorIdHashed.substring(0, 8)}
                            </div>
                            <div className="flex items-center space-x-2">
                              {item.topBadge && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getTopBadgeColor(item.topBadge)}`}>
                                  {getTopBadgeText(item.topBadge)}
                                </span>
                              )}
                              {item.isProvisional && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                                  Provisional
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          View profile →
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${getScoreColor(item.score)}`}>
                          {formatScore(item.score)}
                        </span>
                        {item.trend && (
                          <span className="ml-2 text-sm">
                            {getTrendIcon(item.trend)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatScore(item.accuracy)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatScore(item.consistency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatScore(item.volumeScore)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatScore(item.recencyScore)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.maturedN}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        {leaderboard && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Showing {leaderboard.meta.total} creators • 
            Generated at {new Date(leaderboard.generatedAt).toLocaleString()}
            {leaderboard.meta.hasMore && ' • More results available'}
          </div>
        )}
      </div>
    </div>
  );
}
