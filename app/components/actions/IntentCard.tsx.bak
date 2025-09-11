/**
 * Intent Card component for displaying trading intents
 */

'use client';

import { useState, useEffect } from 'react';

interface AccuracyDisplayProps {
  pair: string;
}

function AccuracyDisplay({ pair }: AccuracyDisplayProps) {
  const [accuracy, setAccuracy] = useState<{
    accuracy: number;
    confidence: string;
    sampleSize: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccuracy = async () => {
      try {
        const response = await fetch(`/api/intents/accuracy?pair=${pair}`);
        const data = await response.json();
        
        if (data.success && data.data.byPair[pair]) {
          const metrics = data.data.byPair[pair];
          setAccuracy({
            accuracy: Math.round(metrics.accuracyWithin50Bps),
            confidence: metrics.totalTrades < 10 ? 'low' : metrics.totalTrades < 50 ? 'medium' : 'high',
            sampleSize: metrics.totalTrades
          });
        }
      } catch (error) {
        console.error('Failed to fetch accuracy:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccuracy();
  }, [pair]);

  if (loading) {
    return (
      <div className="text-xs text-[color:var(--muted)] mb-3">
        Loading accuracy...
      </div>
    );
  }

  if (!accuracy || accuracy.sampleSize === 0) {
    return (
      <div className="text-xs text-[color:var(--muted)] mb-3">
        No accuracy data available
      </div>
    );
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="text-xs text-[color:var(--muted)] mb-3">
      <span className="font-medium">30d historikk:</span>{' '}
      <span className={getConfidenceColor(accuracy.confidence)}>
        {accuracy.accuracy}% av fills innen ±50 bps
      </span>
      {' '}({accuracy.sampleSize} trades, {accuracy.confidence} confidence)
    </div>
  );
}

interface IntentCardProps {
  intent: {
    id: string;
    base: string;
    quote: string;
    side: 'BUY' | 'SELL';
    sizeJson: any;
    rationale?: string;
    confidence?: number;
    backtestWin?: number;
    expectedDur?: string;
    createdAt: string;
    receipts: Array<{
      id: string;
      status: 'simulated' | 'executed' | 'failed';
      txSig?: string;
      realizedPx?: number;
      feesUsd?: number;
      slippageBps?: number;
      createdAt: string;
    }>;
  };
  onSimulate: (intentId: string) => void;
  onExecute: (intentId: string) => void;
  disabled?: boolean;
}

export default function IntentCard({ intent, onSimulate, onExecute, disabled }: IntentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executed': return 'bg-green-100 text-green-800';
      case 'simulated': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSideColor = (side: string) => {
    return side === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const latestReceipt = intent.receipts[0];

  return (
    <div className="border border-[color:var(--border)] rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 text-xs rounded font-medium ${getSideColor(intent.side)}`}>
            {intent.side}
          </span>
          <span className="font-medium text-[color:var(--text)]">
            {intent.sizeJson.value}% {intent.base}/{intent.quote}
          </span>
          {intent.confidence && (
            <span className="text-sm text-[color:var(--muted)]">
              {Math.round(intent.confidence * 100)}% confidence
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSimulate(intent.id)}
            disabled={disabled}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Simulate
          </button>
          <button
            onClick={() => onExecute(intent.id)}
            disabled={disabled}
            className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Execute
          </button>
        </div>
      </div>

      {/* Rationale */}
      {intent.rationale && (
        <div className="text-sm text-[color:var(--muted)] mb-3">
          {intent.rationale}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-[color:var(--muted)] mb-3">
        {intent.backtestWin && (
          <span>
            Backtest Win Rate: {Math.round(intent.backtestWin * 100)}%
          </span>
        )}
        {intent.expectedDur && (
          <span>
            Expected Duration: {intent.expectedDur}
          </span>
        )}
        <span>
          Created: {new Date(intent.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Accuracy Display */}
      <AccuracyDisplay pair={`${intent.base}/${intent.quote}`} />

      {/* Latest Receipt */}
      {latestReceipt && (
        <div className="pt-3 border-t border-[color:var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded ${getStatusColor(latestReceipt.status)}`}>
                {latestReceipt.status}
              </span>
              {latestReceipt.txSig && (
                <span className="text-xs text-[color:var(--muted)] font-mono">
                  {latestReceipt.txSig.slice(0, 8)}...
                </span>
              )}
              <span className="text-xs text-[color:var(--muted)]">
                {new Date(latestReceipt.createdAt).toLocaleString()}
              </span>
            </div>
            
            {latestReceipt.status === 'executed' && (
              <div className="text-xs text-[color:var(--muted)]">
                {latestReceipt.realizedPx && `$${latestReceipt.realizedPx.toFixed(2)}`}
                {latestReceipt.feesUsd && ` • $${latestReceipt.feesUsd.toFixed(4)} fees`}
                {latestReceipt.slippageBps && ` • ${latestReceipt.slippageBps}bps slippage`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historical Receipts */}
      {intent.receipts.length > 1 && (
        <div className="mt-2">
          <details className="text-xs">
            <summary className="text-[color:var(--muted)] cursor-pointer hover:text-[color:var(--text)]">
              View all activity ({intent.receipts.length} events)
            </summary>
            <div className="mt-2 space-y-1">
              {intent.receipts.slice(1).map((receipt) => (
                <div key={receipt.id} className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-1 rounded ${getStatusColor(receipt.status)}`}>
                    {receipt.status}
                  </span>
                  {receipt.txSig && (
                    <span className="text-[color:var(--muted)] font-mono">
                      {receipt.txSig.slice(0, 8)}...
                    </span>
                  )}
                  <span className="text-[color:var(--muted)]">
                    {new Date(receipt.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
