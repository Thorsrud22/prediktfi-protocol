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
      case 'medium': return 'text-teal-600 bg-teal-100';
      case 'high': return 'text-orange-500 bg-orange-100';
      case 'critical': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-teal-600 bg-teal-50';
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
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-sm text-teal-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="font-medium">Monitor only. No trades are executed automatically.</span>
            </div>
          </div>

          {/* Wallet Connection */}
          {!isConnected ? (
            <div className="bg-[color:var(--color-surface)] rounded-2xl border border-[color:var(--color-border)] p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[color:var(--color-accent)] rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-[color:var(--color-fg)]">
                  Connect Your Wallet
                </h2>
              </div>
              <p className="text-slate-400 mb-6">
                Get instant portfolio analysis, risk assessment, and personalized recommendations for your crypto holdings.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[color:var(--color-fg)] mb-3">
                    Solana Wallet Address
                  </label>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Enter your Solana wallet address..."
                    className="w-full px-4 py-3 border border-[color:var(--color-border)] rounded-lg bg-[color:var(--color-bg)] text-[color:var(--color-fg)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:border-[color:var(--color-accent)] transition-all duration-200 font-mono text-sm"
                  />
                </div>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}
                <button
                  onClick={connectWallet}
                  disabled={loading}
                  className="w-full bg-[color:var(--color-accent)] text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Connecting...
                    </>
                  ) : (
                    'Connect Wallet'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Welcome Message */}
              <div className="bg-[color:var(--color-success)]/10 border border-[color:var(--color-success)]/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-[color:var(--color-success)] rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-[color:var(--color-fg)]">Portfolio Connected</h3>
                    <p className="text-sm text-slate-400">Analysis complete - showing latest data</p>
                  </div>
                </div>
              </div>

              {/* Portfolio Overview */}
              <div className="bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[color:var(--color-accent)] rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-[color:var(--color-fg)]">
                      Portfolio Overview
                    </h2>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="text-sm text-slate-400 hover:text-[color:var(--color-fg)] transition-colors duration-200 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Disconnect
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">Total Value</div>
                    <div className="text-2xl font-bold text-[color:var(--color-fg)]">
                      ${snapshot?.totalValueUsd.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div className="bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">Assets</div>
                    <div className="text-2xl font-bold text-[color:var(--color-fg)]">
                      {snapshot?.holdings.length || 0}
                    </div>
                  </div>
                  <div className="bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">Risk Level</div>
                    <div className={`text-2xl font-bold inline-flex px-3 py-1 rounded-full text-sm ${getRiskColor(riskAssessment?.overallRisk || 'low')}`}>
                      {riskAssessment?.overallRisk?.toUpperCase() || 'LOW'}
                    </div>
                  </div>
                </div>

                {/* Top Positions */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-[color:var(--color-fg)] mb-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-[color:var(--color-accent)] rounded flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    Top Positions
                  </h3>
                  <div className="space-y-2">
                    {snapshot?.topPositions.slice(0, 5).map((holding, index) => (
                      <div key={holding.asset} className="bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[color:var(--color-accent)] rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-[color:var(--color-fg)]">{holding.symbol}</div>
                              <div className="text-sm text-slate-400 font-mono">{holding.amount?.toFixed(4) || '0.0000'}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-[color:var(--color-fg)]">
                              ${holding.valueUsd?.toLocaleString() || '0'}
                            </div>
                            <div className="text-sm text-slate-400">
                              {snapshot?.totalValueUsd ? ((holding.valueUsd / snapshot.totalValueUsd) * 100).toFixed(1) : '0.0'}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-slate-400">
                        No holdings found
                      </div>
                    )}
                  </div>
                </div>

                {/* Portfolio Metrics */}
                <div>
                  <h3 className="text-lg font-medium text-[color:var(--color-fg)] mb-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-[color:var(--color-accent)] rounded flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    Portfolio Metrics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-lg p-4">
                      <div className="text-sm text-slate-400 mb-1">Concentration (HHI)</div>
                      <div className="text-lg font-semibold text-[color:var(--color-fg)]">
                        {snapshot?.concentration?.hhi?.toFixed(3) || '0.000'}
                      </div>
                    </div>
                    <div className="bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-lg p-4">
                      <div className="text-sm text-slate-400 mb-1">Top 5 Assets</div>
                      <div className="text-lg font-semibold text-[color:var(--color-fg)]">
                        {snapshot?.concentration?.top5Percent?.toFixed(1) || '0.0'}%
                      </div>
                    </div>
                    <div className="bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-lg p-4">
                      <div className="text-sm text-slate-400 mb-1">Stablecoins</div>
                      <div className="text-lg font-semibold text-[color:var(--color-fg)]">
                        {snapshot?.concentration?.stablecoinPercent?.toFixed(1) || '0.0'}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              {riskAssessment && (
                <div className="bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-[color:var(--color-danger)] rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-[color:var(--color-fg)]">
                      Risk Assessment
                    </h2>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-slate-400">Risk Score</span>
                      <span className="text-sm text-slate-400">{riskAssessment.riskScore || 0}/100</span>
                    </div>
                    <div className="w-full bg-[color:var(--color-bg)] rounded-full h-3 border border-[color:var(--color-border)]">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          (riskAssessment.riskScore || 0) < 25 ? 'bg-[color:var(--color-success)]' :
                          (riskAssessment.riskScore || 0) < 50 ? 'bg-teal-500' :
                          (riskAssessment.riskScore || 0) < 75 ? 'bg-orange-500' : 'bg-[color:var(--color-danger)]'
                        }`}
                        style={{ width: `${riskAssessment.riskScore || 0}%` }}
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
                                rec.priority === 'medium' ? 'bg-teal-100 text-teal-600' :
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
              <div className="bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-[color:var(--color-accent)] rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-[color:var(--color-fg)]">
                    Quick Actions
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a
                    href="/advisor/alerts"
                    className="p-4 bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-lg hover:bg-[color:var(--color-surface-hover)] transition-colors flex items-start gap-3"
                  >
                    <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19c-5 0-9-4-9-9s4-9 9-9 9 4 9 9-4 9-9 9z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-lg font-medium text-[color:var(--color-fg)] mb-1">
                        Set Up Alerts
                      </div>
                      <div className="text-sm text-slate-400">
                        Create smart alerts for price changes and risk events
                      </div>
                    </div>
                  </a>
                  <a
                    href="/advisor/strategies"
                    className="p-4 bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-lg hover:bg-[color:var(--color-surface-hover)] transition-colors flex items-start gap-3"
                  >
                    <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-lg font-medium text-[color:var(--color-fg)] mb-1">
                        Create Strategy
                      </div>
                      <div className="text-sm text-slate-400">
                        Generate custom monitoring strategies from prompts
                      </div>
                    </div>
                  </a>
                  <button
                    onClick={() => window.location.reload()}
                    className="p-4 bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-lg hover:bg-[color:var(--color-surface-hover)] transition-colors text-left flex items-start gap-3"
                  >
                    <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-lg font-medium text-[color:var(--color-fg)] mb-1">
                        Refresh Data
                      </div>
                      <div className="text-sm text-slate-400">
                        Update portfolio snapshot with latest data
                      </div>
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

