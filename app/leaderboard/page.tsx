import { Metadata } from 'next';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { getLeaderboard } from '../../lib/score';
import ScoreTooltip from '../components/ScoreTooltip';
import Aurora from '../components/ui/Aurora';
import CreatorLink from './CreatorLink';
import { LeaderboardResponse } from '../api/leaderboard/route';

export const metadata: Metadata = {
  title: 'Leaderboard | PrediktFi',
  description: 'Top prediction makers ranked by Brier score and accuracy on PrediktFi.',
  openGraph: {
    title: 'PrediktFi Leaderboard',
    description: 'Discover the most accurate prediction makers and their track records.',
    type: 'website',
  },
};

const getCachedLeaderboard = unstable_cache(
  async (period: 'all' | '90d', limit = 50): Promise<LeaderboardResponse> => {
    const leaderboard = await getLeaderboard(period, limit);

    return {
      leaderboard,
      meta: {
        period,
        limit,
        total: leaderboard.length,
        generatedAt: new Date().toISOString(),
      },
    };
  },
  ['leaderboard-page'],
  {
    revalidate: 300,
    tags: ['leaderboard'],
  }
);

interface LeaderboardPageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { period = 'all' } = await searchParams;
  const selectedPeriod = period === '90d' ? '90d' : 'all';

  let leaderboardData: LeaderboardResponse | null = null;

  try {
    leaderboardData = await getCachedLeaderboard(selectedPeriod);
  } catch (error) {
    console.error('Failed to load leaderboard:', error);
  }

  if (!leaderboardData) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 flex items-center justify-center">
        <Aurora
          colorStops={["#0ea5e9", "#2563eb", "#8b5cf6"]}
          amplitude={1.1}
          blend={0.55}
          speed={0.75}
          className="absolute inset-0 -z-10 opacity-70"
        />
        <div className="absolute inset-0 -z-20 bg-gradient-to-b from-slate-950 via-slate-950/70 to-slate-950" aria-hidden />
        <div className="relative z-10 text-center space-y-3">
          <div className="text-4xl">🤕</div>
          <h1 className="text-2xl font-semibold">Leaderboard Unavailable</h1>
          <p className="text-slate-300 text-sm max-w-md mx-auto">
            We ran into an issue retrieving the latest rankings. Please refresh the page or check back in a few moments.
          </p>
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
    if (rank === 1) return 'text-amber-200 bg-amber-500/10 border border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.25)]';
    if (rank === 2) return 'text-slate-200 bg-slate-500/10 border border-slate-400/40';
    if (rank === 3) return 'text-orange-200 bg-orange-500/10 border border-orange-400/40';
    return 'text-slate-200 bg-slate-800/80 border border-slate-700';
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-emerald-300';
    if (score >= 0.6) return 'text-sky-300';
    if (score >= 0.4) return 'text-amber-300';
    return 'text-rose-300';
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'flat') => {
    if (trend === 'up') return <span className="text-emerald-300">↗️</span>;
    if (trend === 'down') return <span className="text-rose-300">↘️</span>;
    if (trend === 'flat') return <span className="text-slate-400">→</span>;
    return null;
  };

  const getPerformanceBadge = (score: number, isProvisional: boolean) => {
    if (isProvisional) {
      return (
        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-200 text-xs font-medium rounded-full border border-amber-400/30">
          Provisional
        </span>
      );
    }

    if (score >= 0.9) {
      return (
        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-200 text-xs font-medium rounded-full border border-emerald-400/30">
          Excellent
        </span>
      );
    }

    if (score >= 0.7) {
      return (
        <span className="px-2.5 py-1 bg-sky-500/10 text-sky-200 text-xs font-medium rounded-full border border-sky-400/30">
          Good
        </span>
      );
    }

    if (score >= 0.5) {
      return (
        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-200 text-xs font-medium rounded-full border border-amber-400/20">
          Fair
        </span>
      );
    }

    return (
      <span className="px-2.5 py-1 bg-rose-500/10 text-rose-200 text-xs font-medium rounded-full border border-rose-400/20">
        Needs Improvement
      </span>
    );
  };

  const totalResolved = leaderboard.reduce((sum, creator) => sum + creator.resolvedInsights, 0);
  const totalPredictions = leaderboard.reduce((sum, creator) => sum + creator.totalInsights, 0);
  const averageAccuracy =
    leaderboard.length > 0 ? (leaderboard.reduce((sum, creator) => sum + creator.accuracy, 0) / leaderboard.length) * 100 : 0;

  const highlightCreator = leaderboard[0];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <Aurora
        colorStops={["#0ea5e9", "#2563eb", "#8b5cf6"]}
        amplitude={1.1}
        blend={0.55}
        speed={0.75}
        className="fixed inset-0 -z-20 opacity-70"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950 via-slate-950/70 to-slate-950" aria-hidden />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1 mb-6 rounded-full bg-slate-900/60 border border-slate-800/80 text-sm text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
            Updated every few minutes with the freshest performance data
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🏆 Community Leaderboard
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto">
            Track the creators who consistently forecast the future with precision. Lower Brier scores and higher accuracy unlock top placement.
          </p>
        </div>

        {/* Period Filter */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-full bg-slate-900/60 border border-slate-800/80 p-1 shadow-lg shadow-slate-900/40">
            <Link
              href="/leaderboard?period=all"
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedPeriod === 'all'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-[0_0_18px_rgba(14,165,233,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              All Time
            </Link>
            <Link
              href="/leaderboard?period=90d"
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedPeriod === '90d'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-[0_0_18px_rgba(14,165,233,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Last 90 Days
            </Link>
          </div>
        </div>

        {/* Highlight */}
        {highlightCreator && (
          <div className="mb-12 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 backdrop-blur-md px-6 py-5 shadow-lg shadow-emerald-900/40">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 via-sky-500 to-indigo-500 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-emerald-500/40">
                  {highlightCreator.handle.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm uppercase tracking-wide text-emerald-200/80">Current Leader</p>
                  <CreatorLink
                    href={`/creator/${highlightCreator.id}`}
                    handle={highlightCreator.handle}
                    rank={highlightCreator.rank}
                    selectedPeriod={selectedPeriod}
                  >
                    <span className="text-xl font-semibold text-white">{highlightCreator.handle}</span>
                  </CreatorLink>
                  <div className="text-sm text-emerald-100/90 mt-1 flex items-center gap-3">
                    <span className="font-mono text-sm">
                      Score {(highlightCreator.score * 100).toFixed(1)}%
                    </span>
                    <span className="text-emerald-100/70">•</span>
                    <span>Accuracy {(highlightCreator.accuracy * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-emerald-100/90">
                <div className="text-center">
                  <div className="text-xs uppercase tracking-wide text-emerald-200/70">Resolved Insights</div>
                  <div className="text-2xl font-semibold text-white">{highlightCreator.resolvedInsights}</div>
                </div>
                <div className="hidden h-12 w-px bg-emerald-400/20 md:block" aria-hidden />
                <div className="text-center">
                  <div className="text-xs uppercase tracking-wide text-emerald-200/70">Brier Score</div>
                  <div className="text-2xl font-semibold text-white">{highlightCreator.averageBrier.toFixed(3)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md p-6 text-center shadow-xl shadow-slate-950/40">
            <div className="text-sm uppercase tracking-wide text-slate-400 mb-2">Active Creators</div>
            <div className="text-3xl font-semibold text-white">{meta.total}</div>
            <p className="mt-2 text-xs text-slate-400">Creators who meet the minimum resolved prediction threshold.</p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md p-6 text-center shadow-xl shadow-slate-950/40">
            <div className="text-sm uppercase tracking-wide text-slate-400 mb-2">Resolved Predictions</div>
            <div className="text-3xl font-semibold text-white">{totalResolved}</div>
            <p className="mt-2 text-xs text-slate-400">Proof points powering the rankings across all creators.</p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md p-6 text-center shadow-xl shadow-slate-950/40">
            <div className="text-sm uppercase tracking-wide text-slate-400 mb-2">Total Predictions</div>
            <div className="text-3xl font-semibold text-white">{totalPredictions}</div>
            <p className="mt-2 text-xs text-slate-400">Every published insight, resolved or still open, from ranked creators.</p>
          </div>
        </div>

        <div className="mb-12 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md p-6 text-center shadow-xl shadow-slate-950/40">
          <div className="text-sm uppercase tracking-wide text-slate-400 mb-2">Average Accuracy</div>
          <div className="text-3xl font-semibold text-white">{averageAccuracy.toFixed(1)}%</div>
          <p className="mt-2 text-xs text-slate-400">Median consistency across every resolved insight on the board.</p>
        </div>

        {/* Leaderboard Table */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md overflow-hidden shadow-2xl shadow-slate-950/50">
          <div className="px-6 py-5 border-b border-slate-800/80 bg-slate-900/80">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Rankings {selectedPeriod === '90d' ? '(Last 90 Days)' : '(All Time)'}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Updated {new Date(meta.generatedAt).toLocaleString()}
                </p>
              </div>
              <div className="text-xs text-slate-400 font-mono uppercase tracking-[0.2em]">
                Accurate. Transparent. Earned.
              </div>
            </div>
          </div>

          {leaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-900/70">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Creator</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Accuracy</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Brier Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Predictions</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-950/40 divide-y divide-slate-800">
                  {leaderboard.map((creator) => {
                    const change = (creator as { change?: number }).change;

                    return (
                      <tr key={creator.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold ${getRankColor(
                              creator.rank
                            )}`}
                          >
                            {getRankIcon(creator.rank)}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-9 h-9 bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-3 shadow-lg shadow-sky-500/30">
                              <span className="text-sm font-bold text-white">
                                {creator.handle.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <CreatorLink
                                  href={`/creator/${creator.id}`}
                                  handle={creator.handle}
                                  rank={creator.rank}
                                  selectedPeriod={selectedPeriod}
                                >
                                  {creator.handle}
                                </CreatorLink>
                                {getTrendIcon(creator.trend)}
                              </div>
                              <div className="mt-1">{getPerformanceBadge(creator.score, creator.isProvisional)}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <span className={`text-sm font-bold ${getScoreColor(creator.score)}`}>
                                {(creator.score * 100).toFixed(1)}%
                              </span>
                              <ScoreTooltip
                                score={creator.score}
                                accuracy={creator.accuracy}
                                totalInsights={creator.totalInsights}
                                resolvedInsights={creator.resolvedInsights}
                                averageBrier={creator.averageBrier}
                                isProvisional={creator.isProvisional}
                              />
                            </div>
                            {change !== undefined && Math.abs(change) > 0.01 && (
                              <span
                                className={`text-xs px-2 py-1 rounded-full border ${
                                  change > 0
                                    ? 'bg-emerald-500/10 text-emerald-200 border-emerald-400/20'
                                    : 'bg-rose-500/10 text-rose-200 border-rose-400/20'
                                }`}
                              >
                                {change > 0 ? '+' : ''}{(change * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-200">{(creator.accuracy * 100).toFixed(1)}%</span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-300">{creator.averageBrier.toFixed(3)}</span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-200">
                            <span className="font-medium">{creator.resolvedInsights}</span>
                            <span className="text-slate-400"> / {creator.totalInsights}</span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {creator.totalInsights > 0
                              ? Math.round((creator.resolvedInsights / creator.totalInsights) * 100)
                              : 0}% resolved
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-white mb-2">No Data Available</h3>
              <p>No creators with resolved predictions found for the selected period.</p>
            </div>
          )}
        </div>

        {/* Explanation */}
        <div className="mt-12 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-8 backdrop-blur-md shadow-lg shadow-sky-900/30">
          <h3 className="text-lg font-semibold text-sky-200 mb-4">How Rankings Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-sky-100/90">
            <div>
              <h4 className="font-medium text-sky-100 mb-2">Brier Score</h4>
              <p>
                Measures prediction accuracy. Calculated as (prediction - outcome)². Lower scores are better, with 0.000 being perfect.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sky-100 mb-2">Overall Score</h4>
              <p>
                Derived from Brier score (1 - Brier). Higher scores indicate better calibrated predictions. Used for ranking.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sky-100 mb-2">Accuracy</h4>
              <p>
                Percentage of correct predictions. Predictions ≥50% confidence are considered "YES" predictions.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sky-100 mb-2">Minimum Requirements</h4>
              <p>
                Creators need at least one resolved prediction to appear on the leaderboard.
              </p>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 px-6 py-6 shadow-xl shadow-slate-950/40">
          <div>
            <h3 className="text-xl font-semibold text-white">Ready to climb the leaderboard?</h3>
            <p className="text-sm text-slate-300 mt-2">
              Publish new predictions in the studio and build a streak of accurate calls to rise in the rankings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/studio"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(56,189,248,0.45)] transition-transform hover:scale-105"
            >
              Open Studio
            </Link>
            <Link
              href="/feed"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 px-6 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800/70"
            >
              Explore Markets
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
