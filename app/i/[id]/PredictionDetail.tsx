'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { InsightResponse } from '../../api/insight/_schemas';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

interface PredictionDetailProps {
  insight: InsightResponse;
  id: string;
}

export default function PredictionDetail({ insight, id }: PredictionDetailProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const probabilityPercent = Math.round(insight.p * 100);
  const deadline = new Date(insight.deadline);
  const isCommitted = insight.status === 'COMMITTED';
  const isResolved = insight.status === 'RESOLVED';
  const isOverdue = deadline < new Date() && !isResolved;

  const getStatusIcon = () => {
    if (isResolved && insight.outcome) {
      switch (insight.outcome.result) {
        case 'YES':
          return (
            <svg
              className="w-6 h-6 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          );
        case 'NO':
          return (
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          );
        case 'INVALID':
          return (
            <svg
              className="w-6 h-6 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          );
      }
    }
    return (
      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  };

  const getStatusColor = () => {
    if (isResolved && insight.outcome) {
      switch (insight.outcome.result) {
        case 'YES':
          return 'from-green-500 to-emerald-600';
        case 'NO':
          return 'from-red-500 to-rose-600';
        case 'INVALID':
          return 'from-yellow-500 to-amber-600';
      }
    }
    return isCommitted ? 'from-blue-500 to-indigo-600' : 'from-gray-500 to-slate-600';
  };

  const getConfidenceLevel = (probability: number) => {
    if (probability >= 0.8)
      return { level: 'Very High', color: 'text-green-400', bg: 'bg-green-500/20', icon: '🔥' };
    if (probability >= 0.6)
      return { level: 'High', color: 'text-teal-400', bg: 'bg-teal-500/10', icon: '⚡' };
    if (probability >= 0.4)
      return { level: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: '📊' };
    return { level: 'Low', color: 'text-red-400', bg: 'bg-red-500/20', icon: '⚠️' };
  };

  const confidence = getConfidenceLevel(insight.p);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();

    if (diff <= 0) return 'Overdue';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.8) return 'from-green-500 to-emerald-600';
    if (probability >= 0.6) return 'from-blue-500 to-cyan-600';
    if (probability >= 0.4) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-orange-600';
  };

  return (
    <div
      className={`min-h-screen transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-teal-600/20 to-cyan-600/20" />

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-500/5 to-teal-500/5 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">AI Prediction</h1>
                <p className="text-blue-200 text-lg">Verified on Solana blockchain</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => copyToClipboard(window.location.href)}
                className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all group"
              >
                <svg
                  className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
              </button>
              {isCopied && (
                <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium">
                  Copied!
                </div>
              )}
            </div>
          </div>

          {/* Main Prediction Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-10 shadow-2xl">
            {/* Probability Display */}
            <div className="text-center mb-10">
              <div className="relative inline-block mb-6">
                <div
                  className={`w-56 h-56 rounded-full bg-gradient-to-br ${getProbabilityColor(
                    insight.p,
                  )} flex items-center justify-center shadow-2xl relative overflow-hidden`}
                >
                  {/* Animated ring */}
                  <div
                    className="absolute inset-0 rounded-full border-4 border-white/20 animate-spin"
                    style={{ animationDuration: '3s' }}
                  />
                  <div
                    className="absolute inset-2 rounded-full border-2 border-white/10 animate-spin"
                    style={{ animationDuration: '2s', animationDirection: 'reverse' }}
                  />

                  <div className="relative z-10">
                    <span className="text-7xl font-bold text-white drop-shadow-lg">
                      {probabilityPercent}%
                    </span>
                    <div className="text-white/80 text-sm mt-2 font-medium">Probability</div>
                  </div>
                </div>
              </div>

              {/* Clean info cards below circle */}
              <div className="flex justify-center items-center gap-6">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                  <span className="text-lg">{confidence.icon}</span>
                  <div className="text-left">
                    <div className="text-xs text-white/60 uppercase tracking-wide">Confidence</div>
                    <div className={`text-sm font-bold ${confidence.color}`}>
                      {confidence.level}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                  <span className="text-lg">{isOverdue ? '⚠️' : '⏰'}</span>
                  <div className="text-left">
                    <div className="text-xs text-white/60 uppercase tracking-wide">Time Left</div>
                    <div
                      className={`text-sm font-bold ${
                        isOverdue ? 'text-red-400' : 'text-blue-400'
                      }`}
                    >
                      {isOverdue ? 'Overdue' : getTimeRemaining()}
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mt-8 mb-6 leading-tight max-w-4xl mx-auto">
                {insight.canonical}
              </h2>

              {/* Status Bar */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <div className="flex items-center space-x-2 bg-white/10 rounded-xl px-4 py-2">
                  <svg
                    className="w-4 h-4 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-white font-medium">
                    Deadline: {format(deadline, 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 rounded-xl px-4 py-2">
                  <svg
                    className="w-4 h-4 text-teal-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                  <span className="text-white font-medium">Resolver: {insight.resolverKind}</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 rounded-xl px-4 py-2">
                  {getStatusIcon()}
                  <span className="text-white font-medium">Status: {insight.status}</span>
                </div>
              </div>
            </div>

            {/* Creator Info */}
            {insight.creator && (
              <div className="flex items-center justify-center mb-6">
                <Link
                  href={`/creator/${insight.creator.handle}`}
                  className="group transition-all duration-200 hover:scale-105"
                >
                  <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 hover:bg-white/15 hover:border-white/30 cursor-pointer">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center group-hover:shadow-lg transition-shadow">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-semibold group-hover:text-blue-200 transition-colors">
                        @{insight.creator.handle}
                      </div>
                      <div className="flex items-center space-x-3 text-sm text-blue-200">
                        <div className="flex items-center space-x-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                            />
                          </svg>
                          <span>Score: {insight.creator.score.toFixed(1)}</span>
                        </div>
                        {insight.creator.accuracy && (
                          <div className="flex items-center space-x-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            <span>Accuracy: {(insight.creator.accuracy * 100).toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg
                        className="w-4 h-4 text-blue-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Resolution Status */}
            {isResolved && insight.outcome && (
              <div className="mb-8">
                <div className={`bg-gradient-to-r ${getStatusColor()} rounded-2xl p-6 text-center`}>
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    {getStatusIcon()}
                    <span className="text-2xl font-bold text-white">
                      Prediction Resolved: {insight.outcome.result}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm">
                    Decided by {insight.outcome.decidedBy.toLowerCase()} on{' '}
                    {new Date(insight.outcome.decidedAt).toLocaleDateString()}
                  </p>
                  {insight.outcome.evidenceUrl && (
                    <a
                      href={insight.outcome.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 mt-3 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      <span>View Evidence</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Blockchain Verification */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isCommitted ? (
                    <svg
                      className="w-6 h-6 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6 text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                  <div>
                    <div className="text-white font-semibold">
                      {isCommitted ? 'Verified on-chain' : 'Awaiting commitment'}
                    </div>
                    <div className="text-sm text-gray-300">
                      {isCommitted
                        ? `Transaction: ${insight.memoSig?.substring(0, 20)}...`
                        : 'This prediction has not been committed to the blockchain yet'}
                    </div>
                  </div>
                </div>
                {isCommitted && insight.memoSig && (
                  <a
                    href={`https://explorer.solana.com/tx/${insight.memoSig}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    <span>View on Explorer</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
            <div className="flex space-x-1">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'analysis', label: 'AI Analysis', icon: '🤖' },
                { id: 'technical', label: 'Technical', icon: '⚙️' },
                { id: 'blockchain', label: 'Blockchain', icon: '⛓️' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Key Metrics */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <span className="text-2xl">📊</span>
                    <span>Key Metrics</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {probabilityPercent}%
                      </div>
                      <div className="text-gray-400 text-sm">Confidence</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white mb-1">{getTimeRemaining()}</div>
                      <div className="text-gray-400 text-sm">Time Remaining</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white mb-1">{insight.status}</div>
                      <div className="text-gray-400 text-sm">Status</div>
                    </div>
                  </div>
                </div>

                {/* Prediction Statement */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <span className="text-2xl">🎯</span>
                    <span>Prediction Statement</span>
                  </h3>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-lg text-white leading-relaxed">{insight.canonical}</p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Analysis Tab */}
            {activeTab === 'analysis' && (
              <div className="space-y-6">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <span className="text-2xl">🤖</span>
                    <span>AI Analysis</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-sm text-gray-400 mb-2">Confidence Level</div>
                        <div className={`text-2xl font-bold ${confidence.color} mb-2`}>
                          {confidence.icon} {confidence.level}
                        </div>
                        <div className="text-gray-300 text-sm">Based on AI model analysis</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-sm text-gray-400 mb-2">Probability</div>
                        <div className="text-2xl font-bold text-white mb-2">
                          {probabilityPercent}%
                        </div>
                        <div className="text-gray-300 text-sm">Predicted likelihood</div>
                      </div>
                    </div>

                    {(insight as any).rationale && (
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-sm text-gray-400 mb-3">AI Rationale</div>
                        <div className="text-white leading-relaxed text-sm">
                          {(insight as any).rationale}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Technical Tab */}
            {activeTab === 'technical' && (
              <div className="space-y-6">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <span className="text-2xl">⚙️</span>
                    <span>Technical Details</span>
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Resolver Configuration</div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <pre className="text-xs text-gray-300 overflow-x-auto">
                          {JSON.stringify(JSON.parse(insight.resolverRef), null, 2)}
                        </pre>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-sm text-gray-400 mb-2">Resolver Type</div>
                        <div className="text-white font-medium">{insight.resolverKind}</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-sm text-gray-400 mb-2">Deadline</div>
                        <div className="text-white font-medium">{format(deadline, 'PPP')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Blockchain Tab */}
            {activeTab === 'blockchain' && (
              <div className="space-y-6">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <span className="text-2xl">⛓️</span>
                    <span>Blockchain Verification</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {isCommitted ? (
                            <svg
                              className="w-6 h-6 text-green-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-6 h-6 text-yellow-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                          <div>
                            <div className="text-white font-semibold">
                              {isCommitted ? 'Verified on-chain' : 'Awaiting commitment'}
                            </div>
                            <div className="text-sm text-gray-300">
                              {isCommitted
                                ? `Transaction: ${insight.memoSig?.substring(0, 20)}...`
                                : 'This prediction has not been committed to the blockchain yet'}
                            </div>
                          </div>
                        </div>
                        {isCommitted && insight.memoSig && (
                          <a
                            href={`https://explorer.solana.com/tx/${insight.memoSig}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 px-3 py-2 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors text-sm"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                            <span>View on Explorer</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                <span className="text-xl">📈</span>
                <span>Quick Stats</span>
              </h3>
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Created</div>
                  <div className="text-white font-medium text-sm">
                    {formatDistanceToNow(parseISO(insight.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Deadline</div>
                  <div className="text-white font-medium text-sm">
                    {formatDistanceToNow(deadline, { addSuffix: true })}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Resolver</div>
                  <div className="text-white font-medium text-sm">{insight.resolverKind}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Status</div>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                      insight.status === 'COMMITTED'
                        ? 'bg-green-500/20 text-green-400'
                        : insight.status === 'RESOLVED'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {insight.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                <span className="text-xl">⚡</span>
                <span>Actions</span>
              </h3>
              <div className="space-y-3">
                <a
                  href={`/api/image/receipt?id=${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-all group text-sm"
                >
                  <svg
                    className="w-4 h-4 group-hover:scale-110 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="font-medium">Download Receipt</span>
                </a>
                <button
                  onClick={() => copyToClipboard(window.location.href)}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-600/20 text-gray-300 rounded-lg hover:bg-gray-600/30 transition-all group text-sm"
                >
                  <svg
                    className="w-4 h-4 group-hover:scale-110 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                    />
                  </svg>
                  <span className="font-medium">Share Prediction</span>
                </button>
              </div>
            </div>

            {/* Prediction ID */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
                <span className="text-xl">🔗</span>
                <span>Prediction ID</span>
              </h3>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-2">Unique Identifier</div>
                <div className="text-white font-mono text-xs break-all">{id}</div>
                <button
                  onClick={() => copyToClipboard(id)}
                  className="mt-2 text-blue-400 hover:text-blue-300 text-xs font-medium"
                >
                  Copy ID
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
