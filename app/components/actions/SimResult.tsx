/**
 * Simulation Result component for displaying trade simulation outcomes
 */

'use client';

import { useState, useEffect } from 'react';

interface SimResultProps {
  simulation: {
    expectedPrice: number;
    worstCasePrice: number;
    estSlippageBps: number;
    feesUsd: number;
    liqOk: boolean;
    portfolioAfter: {
      totalValueUsd: number;
      holdings: Array<{
        asset: string;
        valueUsd: number;
        amount: number;
      }>;
    };
    simConfidence: number;
    quoteTimestamp: number;
    historicalAccuracy?: {
      accuracy: number;
      confidence: string;
      sampleSize: number;
    };
    // Enhanced slippage information
    slippageCap?: {
      userMaxBps: number;
      dynamicCapBps: number;
      appliedCapBps: number;
      capUsedPct: number;
      isDynamic: boolean;
    };
  };
  historicalAccuracy?: {
    accuracy: number;
    confidence: string;
    sampleSize: number;
  };
  onClose: () => void;
}

export default function SimResult({ simulation, historicalAccuracy, onClose }: SimResultProps) {
  const {
    expectedPrice,
    worstCasePrice,
    estSlippageBps,
    feesUsd,
    liqOk,
    portfolioAfter,
    simConfidence,
    quoteTimestamp,
    historicalAccuracy: simHistoricalAccuracy,
    slippageCap
  } = simulation;

  const [quoteAge, setQuoteAge] = useState(0);

  // Use historical accuracy from simulation data if available, otherwise use prop
  const accuracyData = simHistoricalAccuracy || historicalAccuracy;

  // Update quote age every second
  useEffect(() => {
    const updateAge = () => {
      const now = Date.now();
      const age = Math.floor((now - quoteTimestamp) / 1000);
      setQuoteAge(age);
    };

    updateAge(); // Initial update
    const interval = setInterval(updateAge, 1000);

    return () => clearInterval(interval);
  }, [quoteTimestamp]);

  const priceImpact = ((expectedPrice - worstCasePrice) / expectedPrice) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[color:var(--text)]">
            Simulation Results
          </h2>
          <button
            onClick={onClose}
            className="text-[color:var(--muted)] hover:text-[color:var(--text)]"
          >
            ✕
          </button>
        </div>

        {/* Quote Freshness */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-blue-900">
              Quote Freshness
            </div>
            <div className="text-sm text-blue-700" aria-label={`Quote updated ${quoteAge} seconds ago`}>
              Oppdatert for {quoteAge}s siden
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Price Analysis */}
          <div className="bg-[color:var(--background)] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[color:var(--text)] mb-3">Price Analysis</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-[color:var(--muted)] mb-1">Expected Price</div>
                <div className="text-lg font-semibold text-green-600">
                  ${expectedPrice.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[color:var(--muted)] mb-1">Worst Case</div>
                <div className="text-lg font-semibold text-red-600">
                  ${worstCasePrice.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-[color:var(--muted)]">
              Price impact: {priceImpact.toFixed(2)}%
            </div>
          </div>

          {/* Cost Analysis */}
          <div className="bg-[color:var(--background)] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[color:var(--text)] mb-3">Cost Analysis</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[color:var(--muted)]">Estimated Fees</span>
                <span className="text-[color:var(--text)]">${feesUsd.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[color:var(--muted)]">Slippage</span>
                <span className="text-[color:var(--text)]">{estSlippageBps} bps</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[color:var(--muted)]">Liquidity Check</span>
                <span className={`font-medium ${liqOk ? 'text-green-600' : 'text-red-600'}`}>
                  {liqOk ? '✓ Sufficient' : '✗ Insufficient'}
                </span>
              </div>
            </div>
            
            {/* Dynamic Slippage Cap Visualization */}
            {slippageCap && (
              <div className="mt-4 pt-3 border-t border-[color:var(--border)]">
                <div className="text-xs font-medium text-[color:var(--text)] mb-2">
                  Slippage Cap Usage
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[color:var(--muted)]">Applied Cap</span>
                    <span className="text-[color:var(--text)]">
                      {slippageCap.appliedCapBps} bps
                      {slippageCap.isDynamic && (
                        <span className="ml-1 text-blue-500" title="Dynamically adjusted">
                          ⚡
                        </span>
                      )}
                    </span>
                  </div>
                  
                  {/* Cap Usage Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[color:var(--muted)]">Cap Used</span>
                      <span className="text-[color:var(--text)]">
                        {slippageCap.capUsedPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          slippageCap.capUsedPct < 50 ? 'bg-green-500' :
                          slippageCap.capUsedPct < 80 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(slippageCap.capUsedPct, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Cap Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[color:var(--muted)]">User Max:</span>
                      <span className="ml-1 text-[color:var(--text)]">
                        {slippageCap.userMaxBps} bps
                      </span>
                    </div>
                    <div>
                      <span className="text-[color:var(--muted)]">Dynamic:</span>
                      <span className="ml-1 text-[color:var(--text)]">
                        {slippageCap.dynamicCapBps} bps
                      </span>
                    </div>
                  </div>
                  
                  {/* Trust Building Message */}
                  <div className="text-xs text-[color:var(--muted)] mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-center gap-1">
                      <span className="text-blue-500">🛡️</span>
                      <span className="font-medium text-blue-800">
                        Smart Slippage Protection
                      </span>
                    </div>
                    <div className="text-blue-700 mt-1">
                      {slippageCap.isDynamic 
                        ? `Dynamic cap applied based on market impact (${slippageCap.dynamicCapBps} bps)`
                        : `Using your specified cap (${slippageCap.userMaxBps} bps)`
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Portfolio Impact */}
          <div className="bg-[color:var(--background)] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[color:var(--text)] mb-3">Portfolio Impact</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[color:var(--muted)]">New Total Value</span>
                <span className="text-[color:var(--text)]">
                  ${portfolioAfter.totalValueUsd.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-[color:var(--muted)] mt-2">
                Top Holdings After Trade:
              </div>
              <div className="space-y-1">
                {portfolioAfter.holdings
                  .sort((a, b) => b.valueUsd - a.valueUsd)
                  .slice(0, 3)
                  .map((holding) => (
                    <div key={holding.asset} className="flex justify-between text-xs">
                      <span className="text-[color:var(--muted)]">{holding.asset}</span>
                      <span className="text-[color:var(--text)]">
                        ${holding.valueUsd.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Simulation Confidence */}
          <div className="bg-[color:var(--background)] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[color:var(--text)] mb-3">Simulation Confidence</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[color:var(--muted)]">Current Simulation</span>
                <span className="text-[color:var(--text)]">
                  {Math.round(simConfidence * 100)}%
                </span>
              </div>
              {accuracyData && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-[color:var(--muted)]">30d sim-accuracy</span>
                    <span className="text-[color:var(--text)]" aria-label={`30-day simulation accuracy: ${accuracyData.accuracy}%`}>
                      {accuracyData.accuracy}% within ±50 bps
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[color:var(--muted)]">Sample Size</span>
                    <span className="text-[color:var(--text)]">
                      {accuracyData.sampleSize} trades
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[color:var(--muted)]">Confidence Level</span>
                    <span className={`font-medium ${
                      accuracyData.confidence === 'high' ? 'text-green-600' :
                      accuracyData.confidence === 'medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {accuracyData.confidence}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Risk Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="text-sm text-amber-800">
                <div className="font-medium mb-1">Risk Warning</div>
                <div>
                  This simulation is based on current market conditions and may not reflect actual execution results. 
                  Prices can change rapidly, and slippage may exceed estimates.
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[color:var(--border)] rounded text-[color:var(--text)] hover:bg-[color:var(--surface)] transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                // This would trigger execution
                alert('Execute functionality would be implemented here');
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
            >
              Execute Trade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
