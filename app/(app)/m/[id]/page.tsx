/**
 * Model Detail Page
 * Shows model metrics including calibration pills
 * Route: /m/[id]
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import MetricPills from '@/app/components/models/MetricPills';
import { CalibrationResult } from '@/src/server/models/calibration';
import { ANALYTICS_EVENT_TYPES } from '@/src/server/analytics/events';

interface ModelMetrics {
  total_pnl_usd: number;
  win_rate: number;
  avg_win_usd: number;
  avg_loss_usd: number;
  max_drawdown_usd: number;
  sharpe_ratio: number;
  brier_30d: number;
  calibration: CalibrationResult;
  matured_n: number;
  matured_coverage: number;
  calibrationNote?: string;
  total_trades: number;
  sample_period_days: number;
  last_updated: string;
  processing_time_ms?: number;
}

export default function ModelDetailPage() {
  const params = useParams();
  const modelId = params.id as string;

  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewEventSent, setViewEventSent] = useState(false);

  useEffect(() => {
    if (!modelId) return;

    fetchMetrics();

    // Send view event (debounced on server)
    if (!viewEventSent) {
      sendAnalyticsEvent({
        type: ANALYTICS_EVENT_TYPES.MODEL_METRICS_VIEW,
        modelId
      });
      setViewEventSent(true);
    }
  }, [modelId, viewEventSent]);

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

  const handleCopyClick = useCallback(() => {
    if (modelId) {
      // Send analytics event
      sendAnalyticsEvent({
        type: ANALYTICS_EVENT_TYPES.MODEL_COPY_CLICKED,
        modelId
      });

      // Redirect to advisor actions page with model template
      const advisorUrl = `/advisor/actions?template=model&sourceModelId=${encodeURIComponent(modelId)}`;
      window.location.href = advisorUrl;
    }
  }, [modelId, sendAnalyticsEvent]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public/models/${modelId}/metrics?window=30d`);

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status}`);
      }

      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-white/10 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-300 mb-2">Error Loading Model</h2>
            <p className="text-red-200">{error}</p>
            <button
              onClick={fetchMetrics}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Model Not Found</h2>
            <p className="text-gray-400">The requested model could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Model {modelId}</h1>
              <p className="text-gray-400">
                Last updated: {new Date(metrics.last_updated).toLocaleString()}
              </p>
              {metrics.processing_time_ms && (
                <p className="text-gray-500 text-sm">
                  Processing time: {metrics.processing_time_ms}ms
                </p>
              )}
            </div>
            <button
              onClick={handleCopyClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Strategy
            </button>
          </div>
        </div>

        {/* Calibration Pills */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Model Quality</h2>
          <MetricPills
            calibration={metrics.calibration}
            maturedN={metrics.matured_n}
            brierScore={metrics.brier_30d}
            className="flex flex-wrap gap-3"
          />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* P&L Metrics */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-green-300">Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total P&L:</span>
                <span className={`font-bold ${metrics.total_pnl_usd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${metrics.total_pnl_usd.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Win Rate:</span>
                <span className="font-bold text-white">
                  {(metrics.win_rate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sharpe Ratio:</span>
                <span className="font-bold text-white">
                  {metrics.sharpe_ratio.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Risk Metrics */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-yellow-300">Risk</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Max Drawdown:</span>
                <span className="font-bold text-red-400">
                  ${metrics.max_drawdown_usd.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Loss:</span>
                <span className="font-bold text-red-300">
                  ${metrics.avg_loss_usd.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Win:</span>
                <span className="font-bold text-green-300">
                  ${metrics.avg_win_usd.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Sample Metrics */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Sample</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Trades:</span>
                <span className="font-bold text-white">
                  {metrics.total_trades}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Matured:</span>
                <span className="font-bold text-white">
                  {metrics.matured_n} ({(metrics.matured_coverage * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Period:</span>
                <span className="font-bold text-white">
                  {metrics.sample_period_days}d
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Calibration Details */}
        {metrics.calibration.bins.length > 0 && (
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Calibration Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Brier Score Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Brier Score:</span>
                    <span className="font-mono">{metrics.brier_30d.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={`font-bold ${metrics.calibration.status === 'Good' ? 'text-green-400' :
                        metrics.calibration.status === 'Fair' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                      {metrics.calibration.status}
                    </span>
                  </div>
                  {metrics.calibrationNote && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Note:</span>
                      <span className="text-gray-300 text-xs">
                        {metrics.calibrationNote === 'standard_horizon' ? 'Standard 30d horizon' : metrics.calibrationNote}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Calibration Bins</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400">
                        <th className="text-left">Predicted</th>
                        <th className="text-left">Actual</th>
                        <th className="text-left">Count</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-1">
                      {metrics.calibration.bins.map((bin, idx) => (
                        <tr key={idx}>
                          <td className="font-mono">{(bin.p * 100).toFixed(0)}%</td>
                          <td className="font-mono">{(bin.hit_rate * 100).toFixed(0)}%</td>
                          <td className="font-mono">{bin.n}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
