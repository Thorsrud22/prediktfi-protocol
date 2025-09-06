import { Metadata } from 'next';
import { LeaderboardResponse } from '../api/leaderboard/route';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Leaderboard | PrediktFi',
  description: 'Top prediction makers ranked by Brier score and accuracy on PrediktFi.',
  openGraph: {
    title: 'PrediktFi Leaderboard',
    description: 'Discover the most accurate prediction makers and their track records.',
    type: 'website',
  },
};

interface LeaderboardPageProps {
  searchParams: Promise<{ period?: string }>;
}

async function getLeaderboard(period: 'all' | '90d' = 'all'): Promise<LeaderboardResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/leaderboard?period=${period}`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (!response.ok) {
      return null;
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return null;
  }
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { period = 'all' } = await searchParams;
  const selectedPeriod = period === '90d' ? '90d' : 'all';
  
  const leaderboardData = await getLeaderboard(selectedPeriod);
  
  if (!leaderboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Leaderboard Unavailable</h1>
          <p className="text-gray-600">Unable to load leaderboard data. Please try again later.</p>
        </div>
      </div>
    );
  }
  
  const { leaderboard, meta } = leaderboardData;
  
  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };
  
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50';
    if (rank === 2) return 'text-gray-600 bg-gray-50';
    if (rank === 3) return 'text-orange-600 bg-orange-50';
    return 'text-gray-700 bg-gray-100';
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-blue-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🏆 Leaderboard</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Top prediction makers ranked by their Brier score and accuracy. 
            Lower Brier scores indicate better calibrated predictions.
          </p>
        </div>
        
        {/* Period Filter */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-1">
            <Link
              href="/leaderboard?period=all"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Time
            </Link>
            <Link
              href="/leaderboard?period=90d"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === '90d' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Last 90 Days
            </Link>
          </div>
        </div>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {meta.total}
            </div>
            <div className="text-sm text-gray-600">Active Creators</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {leaderboard.reduce((sum, creator) => sum + creator.resolvedInsights, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Resolved Predictions</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {leaderboard.length > 0 ? (leaderboard.reduce((sum, creator) => sum + creator.accuracy, 0) / leaderboard.length * 100).toFixed(1) : 0}%
            </div>
            <div className="text-sm text-gray-600">Average Accuracy</div>
          </div>
        </div>
        
        {/* Leaderboard Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Rankings {selectedPeriod === '90d' ? '(Last 90 Days)' : '(All Time)'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Updated {new Date(meta.generatedAt).toLocaleString()}
            </p>
          </div>
          
          {leaderboard.length > 0 ? (
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Accuracy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Brier Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Predictions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.map((creator) => (
                    <tr key={creator.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRankColor(creator.rank)}`}>
                          {getRankIcon(creator.rank)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-bold text-white">
                              {creator.handle.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <Link 
                            href={`/creator/${creator.handle}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {creator.handle}
                          </Link>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-bold ${getScoreColor(creator.score)}`}>
                          {creator.score.toFixed(3)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {(creator.accuracy * 100).toFixed(1)}%
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {creator.averageBrier.toFixed(3)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">{creator.resolvedInsights}</span>
                          <span className="text-gray-500"> / {creator.totalInsights}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {creator.totalInsights > 0 ? Math.round((creator.resolvedInsights / creator.totalInsights) * 100) : 0}% resolved
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p>No creators with resolved predictions found for the selected period.</p>
            </div>
          )}
        </div>
        
        {/* Explanation */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How Rankings Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Brier Score</h4>
              <p>
                Measures prediction accuracy. Calculated as (prediction - outcome)². 
                Lower scores are better, with 0.000 being perfect.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Overall Score</h4>
              <p>
                Derived from Brier score (1 - Brier). Higher scores indicate better 
                calibrated predictions. Used for ranking.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Accuracy</h4>
              <p>
                Percentage of correct predictions. Predictions ≥50% confidence 
                are considered "YES" predictions.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Minimum Requirements</h4>
              <p>
                Creators need at least one resolved prediction to appear on the 
                leaderboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
