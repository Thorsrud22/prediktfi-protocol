/**
 * League Page
 * Shows top models and creators with analytics tracking
 * Route: /league
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ANALYTICS_EVENT_TYPES } from '../../src/server/analytics/events';

interface LeagueModel {
  id: string;
  name: string;
  creator: string;
  performance: {
    winRate: number;
    sharpeRatio: number;
    totalPnl: number;
  };
  calibration: {
    status: 'Good' | 'Fair' | 'Poor';
    brierScore: number;
    maturedTrades: number;
  };
  rank: number;
}

export default function LeaguePage() {
  const [models, setModels] = useState<LeagueModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewEventSent, setViewEventSent] = useState(false);

  const sendAnalyticsEvent = useCallback(async (event: any) => {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.warn('Failed to send analytics event:', error);
    }
  }, []);

  const handleModelCopyClick = useCallback((modelId: string) => {
    // Send analytics event
    sendAnalyticsEvent({
      type: ANALYTICS_EVENT_TYPES.MODEL_COPY_CLICKED,
      modelId
    });
    
    // Redirect to advisor actions page with model template
    const advisorUrl = `/advisor/actions?template=model&sourceModelId=${encodeURIComponent(modelId)}`;
    window.location.href = advisorUrl;
  }, [sendAnalyticsEvent]);

  useEffect(() => {
    // Send league view event (debounced on server)
    if (!viewEventSent) {
      sendAnalyticsEvent({
        type: ANALYTICS_EVENT_TYPES.LEAGUE_VIEW
      });
      setViewEventSent(true);
    }

    // Load mock data for now
    setTimeout(() => {
      const mockModels: LeagueModel[] = [
        {
          id: 'model-alpha-1',
          name: 'Alpha Strategy v1',
          creator: 'quantmaster',
          performance: {
            winRate: 0.72,
            sharpeRatio: 1.45,
            totalPnl: 12500
          },
          calibration: {
            status: 'Good',
            brierScore: 0.16,
            maturedTrades: 85
          },
          rank: 1
        },
        {
          id: 'model-beta-2',
          name: 'Beta Momentum',
          creator: 'tradingbot',
          performance: {
            winRate: 0.68,
            sharpeRatio: 1.32,
            totalPnl: 9800
          },
          calibration: {
            status: 'Fair',
            brierScore: 0.21,
            maturedTrades: 67
          },
          rank: 2
        },
        {
          id: 'model-gamma-3',
          name: 'Gamma Scalper',
          creator: 'algohunter',
          performance: {
            winRate: 0.65,
            sharpeRatio: 1.28,
            totalPnl: 8200
          },
          calibration: {
            status: 'Good',
            brierScore: 0.18,
            maturedTrades: 92
          },
          rank: 3
        },
        {
          id: 'model-delta-4',
          name: 'Delta Hedge Pro',
          creator: 'riskmanager',
          performance: {
            winRate: 0.61,
            sharpeRatio: 1.15,
            totalPnl: 6700
          },
          calibration: {
            status: 'Fair',
            brierScore: 0.22,
            maturedTrades: 54
          },
          rank: 4
        },
        {
          id: 'model-epsilon-5',
          name: 'Epsilon ML',
          creator: 'aitrader',
          performance: {
            winRate: 0.59,
            sharpeRatio: 1.08,
            totalPnl: 5400
          },
          calibration: {
            status: 'Poor',
            brierScore: 0.28,
            maturedTrades: 38
          },
          rank: 5
        }
      ];
      
      setModels(mockModels);
      setLoading(false);
    }, 1000);
  }, [viewEventSent, sendAnalyticsEvent]);

  const getCalibrationColor = (status: string) => {
    switch (status) {
      case 'Good': return 'text-green-400';
      case 'Fair': return 'text-yellow-400';
      case 'Poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getRankBadge = (rank: number) => {
    const badges = ['🥇', '🥈', '🥉'];
    return badges[rank - 1] || `#${rank}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-12 bg-white/10 rounded mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-white/10 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">🏆 Trading League</h1>
          <p className="text-xl text-gray-300 mb-2">
            Top performing trading models ranked by calibrated performance
          </p>
          <p className="text-gray-400">
            Rankings based on Sharpe ratio, win rate, and calibration quality
          </p>
        </div>

        {/* Models List */}
        <div className="space-y-6">
          {models.map((model) => (
            <div
              key={model.id}
              className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">
                    {getRankBadge(model.rank)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {model.name}
                    </h3>
                    <p className="text-gray-400">
                      by <span className="text-blue-300">@{model.creator}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/m/${model.id}`}
                    className="px-4 py-2 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleModelCopyClick(model.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {(model.performance.winRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400">Win Rate</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {model.performance.sharpeRatio.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400">Sharpe Ratio</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400 mb-1">
                    ${model.performance.totalPnl.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Total P&L</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold mb-1 ${getCalibrationColor(model.calibration.status)}`}>
                    {model.calibration.status}
                  </div>
                  <div className="text-sm text-gray-400">
                    Calibration ({model.calibration.maturedTrades} trades)
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>
                    Brier Score: <span className="text-white">{model.calibration.brierScore.toFixed(3)}</span>
                  </span>
                  <span>
                    Matured Trades: <span className="text-white">{model.calibration.maturedTrades}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-400">
          <p>Rankings updated daily based on 30-day performance windows</p>
          <p className="text-sm mt-2">
            Only models with ≥50 matured trades are eligible for calibration scoring
          </p>
        </div>
      </div>
    </div>
  );
}
