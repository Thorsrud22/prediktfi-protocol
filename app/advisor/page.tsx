// app/advisor/page.tsx
'use client';

import { useState, useEffect } from 'react';
// import { isFeatureEnabled } from '../../lib/flags';

interface PortfolioSnapshot {
  walletId: string;
  timestamp: string;
  totalValueUsd: number;
  holdings: Array<{
    asset: string;
    symbol: string;
    amount: number;
    valueUsd: number;
  }>;
  topPositions: Array<{
    asset: string;
    symbol: string;
    amount: number;
    valueUsd: number;
  }>;
  concentration: {
    hhi: number;
    top5Percent: number;
    stablecoinPercent: number;
  };
  risk: {
    drawdownFromAth: number;
    volatility: number;
    diversification: 'low' | 'medium' | 'high';
  };
}

interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  riskFactors: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    impact: string;
    mitigation: string;
  }>;
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high';
    action: string;
    description: string;
    expectedImpact: string;
  }>;
}

export default function AdvisorPage() {
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if advisor feature is enabled
  // if (!isFeatureEnabled('ADVISOR')) {
  //   return (
  //     <div className="min-h-screen bg-[color:var(--background)] flex items-center justify-center">
  //       <div className="text-center">
  //         <h1 className="text-2xl font-bold text-[color:var(--text)] mb-4">
  //           Advisor Feature Not Available
  //         </h1>
  //         <p className="text-[color:var(--muted)]">
  //           The advisor feature is currently disabled. Please contact support.
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  const connectWallet = async () => {
    if (!walletAddress.trim()) {
      setError('Please enter a valid Solana wallet address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/advisor/portfolio/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: walletAddress.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect wallet');
      }

      const data = await response.json();
      setSnapshot(data.data.snapshot);
      setRiskAssessment(data.data.riskAssessment);
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress('');
    setIsConnected(false);
    setSnapshot(null);
    setRiskAssessment(null);
    setError(null);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-500 bg-green-100';
      case 'medium': return 'text-yellow-500 bg-yellow-100';
      case 'high': return 'text-orange-500 bg-orange-100';
      case 'critical': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[color:var(--text)] mb-2">
              Predikt Advisor
            </h1>
            <p className="text-[color:var(--muted)]">
              Monitor your crypto portfolio, assess risks, and get smart alerts
            </p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="font-medium">Monitor only. No trades are executed automatically.</span>
            </div>
          </div>

          {/* Wallet Connection */}
          {!isConnected ? (
            <div className="bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] p-6 mb-8">
              <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">
                Connect Your Wallet
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text)] mb-2">
                    Solana Wallet Address
                  </label>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Enter your Solana wallet address..."
                    className="w-full px-4 py-3 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {error && (
                  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                    {error}
                  </div>
                )}
                <button
                  onClick={connectWallet}
                  disabled={loading}
                  className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Connecting...' : 'Connect Wallet'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Portfolio Overview */}
              <div className="bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-[color:var(--text)]">
                    Portfolio Overview
                  </h2>
                  <button
                    onClick={disconnectWallet}
                    className="text-sm text-[color:var(--muted)] hover:text-[color:var(--text)]"
                  >
                    Disconnect
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[color:var(--text)]">
                      ${snapshot?.totalValueUsd.toLocaleString()}
                    </div>
                    <div className="text-sm text-[color:var(--muted)]">Total Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[color:var(--text)]">
                      {snapshot?.holdings.length || 0}
                    </div>
                    <div className="text-sm text-[color:var(--muted)]">Assets</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold px-3 py-1 rounded-full ${getRiskColor(riskAssessment?.overallRisk || 'low')}`}>
                      {riskAssessment?.overallRisk.toUpperCase()}
                    </div>
                    <div className="text-sm text-[color:var(--muted)]">Risk Level</div>
                  </div>
                </div>

                {/* Top Positions */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-[color:var(--text)] mb-3">
                    Top Positions
                  </h3>
                  <div className="space-y-2">
                    {snapshot?.topPositions.slice(0, 5).map((holding, index) => (
                      <div key={holding.asset} className="flex justify-between items-center p-3 bg-[color:var(--background)] rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-[color:var(--text)]">{holding.symbol}</div>
                            <div className="text-sm text-[color:var(--muted)]">{holding.amount.toFixed(4)}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-[color:var(--text)]">
                            ${holding.valueUsd.toLocaleString()}
                          </div>
                          <div className="text-sm text-[color:var(--muted)]">
                            {((holding.valueUsd / snapshot.totalValueUsd) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[color:var(--background)] p-4 rounded-lg">
                    <div className="text-sm text-[color:var(--muted)] mb-1">Concentration (HHI)</div>
                    <div className="text-lg font-semibold text-[color:var(--text)]">
                      {snapshot?.concentration.hhi.toFixed(3)}
                    </div>
                  </div>
                  <div className="bg-[color:var(--background)] p-4 rounded-lg">
                    <div className="text-sm text-[color:var(--muted)] mb-1">Top 5 Assets</div>
                    <div className="text-lg font-semibold text-[color:var(--text)]">
                      {snapshot?.concentration.top5Percent.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-[color:var(--background)] p-4 rounded-lg">
                    <div className="text-sm text-[color:var(--muted)] mb-1">Stablecoins</div>
                    <div className="text-lg font-semibold text-[color:var(--text)]">
                      {snapshot?.concentration.stablecoinPercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              {riskAssessment && (
                <div className="bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] p-6">
                  <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">
                    Risk Assessment
                  </h2>
                  
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-[color:var(--muted)]">Risk Score</span>
                      <span className="text-sm text-[color:var(--muted)]">{riskAssessment.riskScore}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          riskAssessment.riskScore < 25 ? 'bg-green-500' :
                          riskAssessment.riskScore < 50 ? 'bg-yellow-500' :
                          riskAssessment.riskScore < 75 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${riskAssessment.riskScore}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  {riskAssessment.riskFactors.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-[color:var(--text)] mb-3">
                        Risk Factors
                      </h3>
                      <div className="space-y-3">
                        {riskAssessment.riskFactors.map((factor, index) => (
                          <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(factor.severity)}`}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium">{factor.description}</div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(factor.severity)}`}>
                                {factor.severity.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm mb-2">
                              <strong>Impact:</strong> {factor.impact}
                            </div>
                            <div className="text-sm">
                              <strong>Mitigation:</strong> {factor.mitigation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {riskAssessment.recommendations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-[color:var(--text)] mb-3">
                        Recommendations
                      </h3>
                      <div className="space-y-3">
                        {riskAssessment.recommendations.map((rec, index) => (
                          <div key={index} className="p-4 bg-[color:var(--background)] rounded-lg border border-[color:var(--border)]">
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium text-[color:var(--text)]">{rec.action}</div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                rec.priority === 'high' ? 'bg-red-100 text-red-600' :
                                rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                'bg-green-100 text-green-600'
                              }`}>
                                {rec.priority.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm text-[color:var(--muted)] mb-2">
                              {rec.description}
                            </div>
                            <div className="text-sm text-[color:var(--muted)]">
                              <strong>Expected Impact:</strong> {rec.expectedImpact}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] p-6">
                <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a
                    href="/advisor/alerts"
                    className="p-4 bg-[color:var(--background)] rounded-lg border border-[color:var(--border)] hover:bg-[color:var(--surface-2)] transition-colors"
                  >
                    <div className="text-lg font-medium text-[color:var(--text)] mb-1">
                      📊 Set Up Alerts
                    </div>
                    <div className="text-sm text-[color:var(--muted)]">
                      Create smart alerts for price changes and risk events
                    </div>
                  </a>
                  <a
                    href="/advisor/strategies"
                    className="p-4 bg-[color:var(--background)] rounded-lg border border-[color:var(--border)] hover:bg-[color:var(--surface-2)] transition-colors"
                  >
                    <div className="text-lg font-medium text-[color:var(--text)] mb-1">
                      🎯 Create Strategy
                    </div>
                    <div className="text-sm text-[color:var(--muted)]">
                      Generate custom monitoring strategies from prompts
                    </div>
                  </a>
                  <button
                    onClick={() => window.location.reload()}
                    className="p-4 bg-[color:var(--background)] rounded-lg border border-[color:var(--border)] hover:bg-[color:var(--surface-2)] transition-colors text-left"
                  >
                    <div className="text-lg font-medium text-[color:var(--text)] mb-1">
                      🔄 Refresh Data
                    </div>
                    <div className="text-sm text-[color:var(--muted)]">
                      Update portfolio snapshot with latest data
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
