/**
 * P&L Widget component showing cumulative simulated/realized P&L
 */

'use client';

import { useState, useEffect } from 'react';

interface PnLData {
  simulatedPnl7d: number;
  simulatedPnl30d: number;
  realizedPnl7d: number;
  realizedPnl30d: number;
  tradeCount7d: number;
  tradeCount30d: number;
  accuracy7d: number;
  accuracy30d: number;
}

interface PnLWidgetProps {
  walletId?: string;
  className?: string;
}

export default function PnLWidget({ walletId, className = '' }: PnLWidgetProps) {
  const [pnlData, setPnlData] = useState<PnLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPnLData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics/pnl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletId })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch P&L data');
        }

        const data = await response.json();
        setPnlData(data);
      } catch (err) {
        console.error('Error fetching P&L data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load P&L data');
      } finally {
        setLoading(false);
      }
    };

    fetchPnLData();
  }, [walletId]);

  if (loading) {
    return (
      <div className={`bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] p-4 ${className}`}>
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-[color:var(--muted)]">Loading P&L...</span>
        </div>
      </div>
    );
  }

  if (error || !pnlData) {
    return (
      <div className={`bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] p-4 ${className}`}>
        <div className="text-center py-4">
          <div className="text-[color:var(--muted)] text-sm">
            {error || 'No P&L data available'}
          </div>
        </div>
      </div>
    );
  }

  const formatPnl = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    const color = value >= 0 ? 'text-green-500' : 'text-red-500';
    return (
      <span className={color}>
        {sign}${Math.abs(value).toFixed(2)}
      </span>
    );
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return 'text-green-500';
    if (accuracy >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={`bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[color:var(--text)]">
          📊 Performance Summary
        </h3>
        <div className="text-xs text-[color:var(--muted)]">
          "If you followed all signals"
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 7 Days */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-[color:var(--text)]">Last 7 Days</div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-[color:var(--muted)]">Simulated P&L:</span>
              {formatPnl(pnlData.simulatedPnl7d)}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[color:var(--muted)]">Realized P&L:</span>
              {formatPnl(pnlData.realizedPnl7d)}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[color:var(--muted)]">Trades:</span>
              <span className="text-[color:var(--text)]">{pnlData.tradeCount7d}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[color:var(--muted)]">Accuracy:</span>
              <span className={getAccuracyColor(pnlData.accuracy7d)}>
                {pnlData.accuracy7d.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* 30 Days */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-[color:var(--text)]">Last 30 Days</div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-[color:var(--muted)]">Simulated P&L:</span>
              {formatPnl(pnlData.simulatedPnl30d)}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[color:var(--muted)]">Realized P&L:</span>
              {formatPnl(pnlData.realizedPnl30d)}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[color:var(--muted)]">Trades:</span>
              <span className="text-[color:var(--text)]">{pnlData.tradeCount30d}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[color:var(--muted)]">Accuracy:</span>
              <span className={getAccuracyColor(pnlData.accuracy30d)}>
                {pnlData.accuracy30d.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Banner */}
      {pnlData.accuracy7d < 50 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            <span className="text-red-800 text-sm font-medium">
              Low accuracy detected (7d: {pnlData.accuracy7d.toFixed(1)}%)
            </span>
          </div>
          <div className="text-red-700 text-xs mt-1">
            Consider reviewing your strategy or waiting for better market conditions.
          </div>
        </div>
      )}

      {pnlData.accuracy7d >= 50 && pnlData.accuracy7d < 70 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-yellow-500 mr-2">⚡</span>
            <span className="text-yellow-800 text-sm font-medium">
              Moderate accuracy (7d: {pnlData.accuracy7d.toFixed(1)}%)
            </span>
          </div>
          <div className="text-yellow-700 text-xs mt-1">
            Performance is improving. Keep monitoring your trades.
          </div>
        </div>
      )}
    </div>
  );
}
