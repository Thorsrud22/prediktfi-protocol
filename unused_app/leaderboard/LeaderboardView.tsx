'use client';

import { useMemo, useState } from 'react';
import ScoreTooltip from '../components/ScoreTooltip';
import CreatorLink from './CreatorLink';
import { LeaderboardResponse } from '../api/leaderboard/route';

interface LeaderboardViewProps {
  data: LeaderboardResponse;
  selectedPeriod: 'all' | '90d';
}

function getRankIcon(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

function getRankColor(rank: number) {
  if (rank === 1) {
    return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/50';
  }
  if (rank === 2) {
    return 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg shadow-gray-400/50';
  }
  if (rank === 3) {
    return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/50';
  }
  return 'bg-gradient-to-br from-gray-600 to-gray-800 text-gray-300 border border-gray-600';
}

function getScoreColor(score: number) {
  if (score >= 0.8) return 'text-emerald-400';
  if (score >= 0.6) return 'text-cyan-400';
  if (score >= 0.4) return 'text-yellow-400';
  return 'text-red-400';
}

function getTrendIcon(trend?: 'up' | 'down' | 'flat') {
  if (trend === 'up') return <span className="text-green-400">↗️</span>;
  if (trend === 'down') return <span className="text-red-400">↘️</span>;
  if (trend === 'flat') return <span className="text-slate-400">→</span>;
  return null;
}

function getPerformanceBadge(score: number, isProvisional: boolean) {
  if (isProvisional) {
    return (
      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full border border-yellow-500/30">
        Provisional
      </span>
    );
  }

  if (score >= 0.9) {
    return (
      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30">
        Excellent
      </span>
    );
  }

  if (score >= 0.7) {
    return (
      <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-semibold rounded-full border border-cyan-500/30">
        Good
      </span>
    );
  }

  if (score >= 0.5) {
    return (
      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full border border-yellow-500/30">
        Fair
      </span>
    );
  }

  return (
    <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full border border-red-500/30">
      Needs Improvement
    </span>
  );
}

function formatPercent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function formatDelta(value: number, digits = 1, invert = false) {
  const adjusted = invert ? -value : value;
  const prefix = adjusted > 0 ? '+' : '';
  return `${prefix}${(adjusted * 100).toFixed(digits)} pts`;
}

function formatBrierDelta(value: number, digits = 3) {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(digits)}`;
}

export default function LeaderboardView({ data, selectedPeriod }: LeaderboardViewProps) {
  const [showPercentiles, setShowPercentiles] = useState(false);
  const { leaderboard, meta, percentiles } = data;

  const percentileSummary = useMemo(() => {
    return [
      {
        label: 'Score',
        p50: formatPercent(percentiles.score.p50, 1),
        p90: formatPercent(percentiles.score.p90, 1),
      },
      {
        label: 'Accuracy',
        p50: formatPercent(percentiles.accuracy.p50, 1),
        p90: formatPercent(percentiles.accuracy.p90, 1),
      },
      {
        label: 'Brier',
        p50: percentiles.brier.p50.toFixed(3),
        p90: percentiles.brier.p90.toFixed(3),
      },
    ];
  }, [percentiles]);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header with Neon Effect */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="text-6xl mb-4 animate-pulse">🏆</div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            Leaderboard
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Top prediction makers ranked by their Brier score and accuracy.
            <span className="block mt-2 text-cyan-400">Lower Brier scores indicate better calibrated predictions.</span>
          </p>
        </div>

        {/* Period Filter with Glassmorphism */}
        <div className="flex justify-center mb-10">
          <div className="backdrop-blur-xl bg-slate-800/50 rounded-xl border border-slate-700 p-1.5 shadow-2xl">
            <a
              href="/leaderboard?period=all"
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                selectedPeriod === 'all'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              All Time
            </a>
            <a
              href="/leaderboard?period=90d"
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                selectedPeriod === '90d'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Last 90 Days
            </a>
          </div>
        </div>

        {/* Stats Summary with Glow Effect */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="backdrop-blur-xl bg-slate-800/50 rounded-2xl border border-cyan-500/20 p-6 text-center hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 hover:border-cyan-500/40">
            <div className="text-4xl font-bold text-cyan-400 mb-2">{meta.total}</div>
            <div className="text-sm text-slate-300 uppercase tracking-wider">Active Creators</div>
          </div>

          <div className="backdrop-blur-xl bg-slate-800/50 rounded-2xl border border-purple-500/20 p-6 text-center hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:border-purple-500/40">
            <div className="text-4xl font-bold text-purple-400 mb-2">
              {leaderboard.reduce((sum, creator) => sum + creator.resolvedInsights, 0)}
            </div>
            <div className="text-sm text-slate-300 uppercase tracking-wider">Total Resolved Predictions</div>
          </div>

          <div className="backdrop-blur-xl bg-slate-800/50 rounded-2xl border border-green-500/20 p-6 text-center hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 hover:border-green-500/40">
            <div className="text-4xl font-bold text-green-400 mb-2">
              {leaderboard.length > 0
                ? (
                    (leaderboard.reduce((sum, creator) => sum + creator.accuracy, 0) / leaderboard.length) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </div>
            <div className="text-sm text-slate-300 uppercase tracking-wider">Average Accuracy</div>
          </div>
        </div>

        {/* Percentile toggle */}
        <div className="backdrop-blur-xl bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
          <div className="px-8 py-6 border-b border-slate-700 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Rankings {selectedPeriod === '90d' ? '(Last 90 Days)' : '(All Time)'}
              </h2>
              <p className="text-sm text-slate-400 mt-2">Updated {new Date(meta.generatedAt).toLocaleString()}</p>
            </div>

            <div className="flex flex-col md:items-end gap-2">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-300">Compare to percentile bands</span>
                <button
                  type="button"
                  onClick={() => setShowPercentiles(prev => !prev)}
                  aria-pressed={showPercentiles}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 ${
                    showPercentiles
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-400'
                      : 'bg-slate-700 border-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      showPercentiles ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  ></span>
                </button>
              </div>
              {showPercentiles && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                  {percentileSummary.map(item => (
                    <div key={item.label} className="rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2">
                      <div className="font-semibold text-slate-200">{item.label}</div>
                      <div className="flex justify-between mt-1">
                        <span className="text-blue-200/80">P50</span>
                        <span>{item.p50}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-blue-200/80">P90</span>
                        <span>{item.p90}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {leaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead>
                  <tr className="bg-slate-800/80">
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Creator</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Accuracy</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Brier Score</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Predictions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {leaderboard.map((creator, index) => {
                    const isTop3 = creator.rank <= 3;
                    const glowColor =
                      creator.rank === 1
                        ? 'shadow-yellow-500/20'
                        : creator.rank === 2
                        ? 'shadow-gray-400/20'
                        : creator.rank === 3
                        ? 'shadow-orange-500/20'
                        : '';

                    return (
                      <tr
                        key={creator.id}
                        className={`group hover:bg-slate-700/30 transition-all duration-300 ${
                          isTop3
                            ? `bg-gradient-to-r ${
                                creator.rank === 1
                                  ? 'from-yellow-500/5 to-transparent'
                                  : creator.rank === 2
                                  ? 'from-gray-400/5 to-transparent'
                                  : 'from-orange-500/5 to-transparent'
                              }`
                            : ''
                        }`}
                      >
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div
                            className={`inline-flex items-center justify-center w-12 h-12 rounded-xl font-bold text-lg transition-all duration-300 ${
                              getRankColor(creator.rank)
                            } ${isTop3 ? `${glowColor} shadow-lg` : ''} group-hover:scale-110`}
                          >
                            {getRankIcon(creator.rank)}
                          </div>
                        </td>

                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className={`w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg ${
                                isTop3 ? 'shadow-cyan-500/50' : 'shadow-cyan-500/20'
                              } group-hover:shadow-cyan-500/50 transition-all duration-300`}
                            >
                              <span className="text-lg font-bold text-white">
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
                              <div className="mt-1.5">{getPerformanceBadge(creator.score, creator.isProvisional)}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                <span className={`text-lg font-bold ${getScoreColor(creator.score)}`}>
                                  {formatPercent(creator.score, 1)}
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
                              {(creator as any).change !== undefined && Math.abs((creator as any).change) > 0.01 && (
                                <span
                                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                    (creator as any).change > 0
                                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  }`}
                                >
                                  {(creator as any).change > 0 ? '+' : ''}{((creator as any).change * 100).toFixed(1)}%
                                </span>
                              )}
                            </div>
                            {showPercentiles && (
                              <div className="mt-1 text-[11px] text-blue-200/70 flex flex-col gap-0.5">
                                <span>
                                  P50 {formatPercent(percentiles.score.p50, 1)} ({formatDelta(creator.score - percentiles.score.p50)})
                                </span>
                                <span>
                                  P90 {formatPercent(percentiles.score.p90, 1)} ({formatDelta(creator.score - percentiles.score.p90)})
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                              <span className="text-base font-medium text-slate-200">
                                {formatPercent(creator.accuracy, 1)}
                              </span>
                              <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                                  style={{ width: `${creator.accuracy * 100}%` }}
                                />
                              </div>
                            </div>
                            {showPercentiles && (
                              <div className="mt-1 text-[11px] text-blue-200/70 flex flex-col gap-0.5">
                                <span>
                                  P50 {formatPercent(percentiles.accuracy.p50, 1)} ({formatDelta(creator.accuracy - percentiles.accuracy.p50)})
                                </span>
                                <span>
                                  P90 {formatPercent(percentiles.accuracy.p90, 1)} ({formatDelta(creator.accuracy - percentiles.accuracy.p90)})
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-base text-slate-300 font-mono">
                              {creator.averageBrier.toFixed(3)}
                            </span>
                            {showPercentiles && (
                              <div className="mt-1 text-[11px] text-blue-200/70 flex flex-col gap-0.5">
                                <span>
                                  P50 {percentiles.brier.p50.toFixed(3)} ({formatBrierDelta(creator.averageBrier - percentiles.brier.p50)})
                                </span>
                                <span>
                                  P25 {percentiles.brier.p25.toFixed(3)} ({formatBrierDelta(creator.averageBrier - percentiles.brier.p25)})
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="text-slate-200">
                              <span className="font-bold text-lg text-white">{creator.resolvedInsights}</span>
                              <span className="text-slate-400"> / {creator.totalInsights}</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {creator.totalInsights > 0
                                ? Math.round((creator.resolvedInsights / creator.totalInsights) * 100)
                                : 0}
                              % resolved
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="text-6xl mb-6 opacity-50">🎯</div>
              <h3 className="text-xl font-medium text-slate-300 mb-3">No Data Available</h3>
              <p className="text-slate-500">No creators with resolved predictions found for the selected period.</p>
            </div>
          )}
        </div>

        {/* Explanation with Modern Glassmorphism */}
        <div className="mt-10 backdrop-blur-xl bg-slate-800/50 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <h3 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center">
            <span className="mr-3">📊</span>
            How Rankings Work
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
            <div className="backdrop-blur-sm bg-slate-700/30 rounded-xl p-5 border border-slate-600 hover:border-cyan-500/50 transition-all duration-300">
              <h4 className="font-bold text-cyan-400 mb-3 text-base">📉 Brier Score</h4>
              <p>
                Measures prediction accuracy. Calculated as (prediction - outcome)². Lower scores are better, with 0.000 being
                perfect.
              </p>
            </div>
            <div className="backdrop-blur-sm bg-slate-700/30 rounded-xl p-5 border border-slate-600 hover:border-blue-500/50 transition-all duration-300">
              <h4 className="font-bold text-blue-400 mb-3 text-base">⭐ Overall Score</h4>
              <p>
                Derived from Brier score (1 - Brier). Higher scores indicate better calibrated predictions. Used for ranking.
              </p>
            </div>
            <div className="backdrop-blur-sm bg-slate-700/30 rounded-xl p-5 border border-slate-600 hover:border-green-500/50 transition-all duration-300">
              <h4 className="font-bold text-green-400 mb-3 text-base">🎯 Accuracy</h4>
              <p>Percentage of correct predictions. Predictions ≥50% confidence are considered "YES" predictions.</p>
            </div>
            <div className="backdrop-blur-sm bg-slate-700/30 rounded-xl p-5 border border-slate-600 hover:border-purple-500/50 transition-all duration-300">
              <h4 className="font-bold text-purple-400 mb-3 text-base">✅ Minimum Requirements</h4>
              <p>Creators need at least one resolved prediction to appear on the leaderboard.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
