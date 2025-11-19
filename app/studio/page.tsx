'use client';

import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from '@/app/components/ui/ErrorBoundary';
import { useSimplifiedWallet } from '@/app/components/wallet/SimplifiedWalletProvider';
import { trackPageLoad, usePerformanceTracking } from '@/app/utils/performance';
import PerformanceMonitor from '../components/PerformanceMonitor';
import IdeaSubmissionForm from './IdeaSubmissionForm';
import { IdeaSubmission } from '@/lib/ideaSchema';

type Step = 'question' | 'analysis' | 'commit';

interface AIAnalysisData {
  probability: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  factors: string[];
  dataPoints: number;
}

export default function StudioPage() {
  // Track page performance
  usePerformanceTracking('StudioPage');

  // Track page load timing
  useEffect(() => {
    const pageTimer = trackPageLoad('Studio');
    return () => {
      // Clean up if component unmounts
    };
  }, []);

  const { isConnected, publicKey, connect } = useSimplifiedWallet();
  const [isStarted, setIsStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('question');
  // Replaced simple question string with structured data
  const [submissionData, setSubmissionData] = useState<IdeaSubmission | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate AI analysis
  const handleGenerateAnalysis = async (data: IdeaSubmission) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/idea-evaluator/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit idea');
      }

      const result = await response.json();
      setSubmissionData(result.data); // Use returned data which might be sanitized/normalized

      // For now, we simulate the AI analysis part as the requirement said "does not call any AI model yet"
      // But to keep the flow working, we'll mock the analysis response based on the input
      // In a real scenario, this would be a separate call or part of the preview response
      const mockAnalysis: AIAnalysisData = {
        probability: Math.floor(Math.random() * 30) + 60, // Random score 60-90
        confidence: 'medium',
        reasoning: `Based on your submission for a ${data.projectType} project, we see potential. The team size of ${data.teamSize} is appropriate for the initial phase.`,
        factors: ['Market Fit', 'Team Capacity', 'Innovation'],
        dataPoints: 150,
      };

      setAiAnalysis(mockAnalysis);
      setCurrentStep('analysis');
    } catch (err: any) {
      setError(err.message || 'Failed to generate analysis. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Commit prediction to blockchain
  const handleCommit = async () => {
    if (!isConnected) {
      setError('Please connect your wallet to commit evaluation');
      return;
    }

    setIsCommitting(true);
    setError(null);

    try {
      const response = await fetch('/api/insight/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: submissionData?.description || '', // Fallback to description
          probability: aiAnalysis?.probability || 50,
          reasoning: aiAnalysis?.reasoning || '',
          walletAddress: publicKey,
          // We might want to store the full structured data on-chain or IPFS in the future
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to commit evaluation');
      }

      const result = await response.json();
      console.log('✅ Evaluation committed:', result);

      setCommitSuccess(true);
      setCurrentStep('commit');
    } catch (err: any) {
      setError(err.message || 'Failed to commit evaluation. Please try again.');
    } finally {
      setIsCommitting(false);
    }
  };

  // Reset to start over
  const handleStartOver = () => {
    setIsStarted(false);
    setCurrentStep('question');
    setSubmissionData(null);
    setAiAnalysis(null);
    setCommitSuccess(false);
    setError(null);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4 py-12">

          {!isStarted ? (
            // Landing View
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent mb-6">
                AI Idea Evaluator Studio
              </h1>
              <p className="text-2xl text-blue-200/80 max-w-3xl mx-auto mb-12 leading-relaxed">
                Validate your crypto, memecoin, or web3 project ideas instantly.
                Our AI analyzes market potential, risks, and viral factor.
              </p>

              <button
                onClick={() => setIsStarted(true)}
                className="px-10 py-5 bg-gradient-to-r from-blue-500 to-teal-600 text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 font-bold text-xl shadow-blue-500/20"
              >
                Start new evaluation
              </button>

              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full">
                <div className="p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                  <div className="text-4xl mb-4">🧠</div>
                  <h3 className="text-xl font-bold text-white mb-2">Deep Analysis</h3>
                  <p className="text-blue-200/70">Get comprehensive feedback on tokenomics and utility.</p>
                </div>
                <div className="p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                  <div className="text-4xl mb-4">⚡️</div>
                  <h3 className="text-xl font-bold text-white mb-2">Instant Results</h3>
                  <p className="text-blue-200/70">Stop guessing. Get AI-powered validation in seconds.</p>
                </div>
                <div className="p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                  <div className="text-4xl mb-4">⛓️</div>
                  <h3 className="text-xl font-bold text-white mb-2">On-Chain Record</h3>
                  <p className="text-blue-200/70">Commit your winning ideas to Solana for proof of origin.</p>
                </div>
              </div>
            </div>
          ) : (
            // Evaluation Flow
            <>
              {/* Header */}
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-white mb-2">
                  New Evaluation
                </h1>
                <p className="text-blue-200/80">
                  Describe your idea and let the AI do the rest
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="max-w-3xl mx-auto mb-12">
                <div className="flex items-center justify-center space-x-4">
                  {/* Step 1 */}
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${currentStep === 'question'
                        ? 'bg-blue-500 text-white ring-4 ring-blue-500/30'
                        : currentStep === 'analysis' || currentStep === 'commit'
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 text-blue-300'
                        }`}
                    >
                      {currentStep === 'analysis' || currentStep === 'commit' ? '✓' : '1'}
                    </div>
                    <span className="ml-2 text-sm text-blue-200 hidden sm:inline">Describe Idea</span>
                  </div>

                  {/* Connector */}
                  <div className={`w-16 h-1 ${currentStep === 'analysis' || currentStep === 'commit' ? 'bg-green-500' : 'bg-white/20'}`}></div>

                  {/* Step 2 */}
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${currentStep === 'analysis'
                        ? 'bg-blue-500 text-white ring-4 ring-blue-500/30'
                        : currentStep === 'commit'
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 text-blue-300'
                        }`}
                    >
                      {currentStep === 'commit' ? '✓' : '2'}
                    </div>
                    <span className="ml-2 text-sm text-blue-200 hidden sm:inline">AI Analysis</span>
                  </div>

                  {/* Connector */}
                  <div className={`w-16 h-1 ${currentStep === 'commit' ? 'bg-green-500' : 'bg-white/20'}`}></div>

                  {/* Step 3 */}
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${currentStep === 'commit'
                        ? 'bg-blue-500 text-white ring-4 ring-blue-500/30'
                        : 'bg-white/10 text-blue-300'
                        }`}
                    >
                      3
                    </div>
                    <span className="ml-2 text-sm text-blue-200 hidden sm:inline">Commit</span>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="max-w-3xl mx-auto">
                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <div className="text-red-300 font-medium">❌ {error}</div>
                  </div>
                )}

                {/* Step 1: Describe Idea */}
                {currentStep === 'question' && (
                  <IdeaSubmissionForm onSubmit={handleGenerateAnalysis} isSubmitting={isGenerating} />
                )}

                {/* Step 2: AI Analysis */}
                {currentStep === 'analysis' && aiAnalysis && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-400/30 p-8 backdrop-blur-sm">
                      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <span className="mr-3">🤖</span>
                        AI Evaluation
                      </h2>

                      {/* Idea Display */}
                      <div className="mb-6 p-4 bg-white/10 rounded-lg border border-white/20">
                        <p className="text-blue-200 text-sm font-medium mb-1">Your Idea:</p>
                        <p className="text-white text-lg">{submissionData?.description}</p>
                        <div className="mt-2 flex gap-2">
                          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30">
                            {submissionData?.projectType}
                          </span>
                          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30">
                            {submissionData?.teamSize}
                          </span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-center mb-8">
                        <div className="text-7xl font-bold text-white mb-2">
                          {aiAnalysis.probability}/100
                        </div>
                        <p className="text-blue-300 text-lg">Potential Score</p>
                        <div className="mt-4">
                          <span
                            className={`inline-block px-4 py-2 rounded-full font-semibold ${aiAnalysis.confidence === 'high'
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : aiAnalysis.confidence === 'medium'
                                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                              }`}
                          >
                            {aiAnalysis.confidence.toUpperCase()} CONFIDENCE
                          </span>
                        </div>
                      </div>

                      {/* Reasoning */}
                      <div className="mb-6 p-4 bg-white/10 rounded-lg border border-white/20">
                        <h3 className="font-semibold text-white mb-3 flex items-center">
                          <span className="mr-2">💡</span>
                          Feedback:
                        </h3>
                        <p className="text-blue-200 leading-relaxed">{aiAnalysis.reasoning}</p>
                      </div>

                      {/* Key Factors */}
                      <div>
                        <h3 className="font-semibold text-white mb-3">Key Factors:</h3>
                        <div className="flex flex-wrap gap-2">
                          {aiAnalysis.factors.map((factor, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-2 bg-white/10 rounded-full text-sm border border-white/20 text-purple-200"
                            >
                              {factor}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <button
                        onClick={handleStartOver}
                        disabled={isCommitting}
                        className="flex-1 py-4 border border-white/30 text-blue-200 rounded-lg hover:bg-white/10 transition-colors font-semibold disabled:opacity-50"
                      >
                        ← Start Over
                      </button>
                      <button
                        onClick={handleCommit}
                        disabled={isCommitting || !isConnected}
                        className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {isCommitting ? (
                          <span className="flex items-center justify-center">
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Committing...
                          </span>
                        ) : !isConnected ? (
                          <span className="flex items-center justify-center">
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                            Connect Wallet to Commit
                          </span>
                        ) : (
                          'Commit to Blockchain →'
                        )}
                      </button>
                    </div>

                    {!isConnected && (
                      <div className="text-center">
                        <button
                          onClick={connect}
                          className="text-blue-300 hover:text-blue-200 underline text-sm"
                        >
                          Click here to connect your wallet
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Success */}
                {currentStep === 'commit' && commitSuccess && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8 text-center">
                    <div className="text-6xl mb-6">✅</div>
                    <h2 className="text-3xl font-bold text-white mb-4">
                      Evaluation Committed!
                    </h2>
                    <p className="text-blue-200 text-lg mb-8 max-w-md mx-auto">
                      Your idea evaluation is now verifiable on Solana blockchain.
                    </p>

                    <div className="space-y-4">
                      <a
                        href="/feed"
                        className="block w-full py-4 bg-gradient-to-r from-blue-500 to-teal-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold text-lg"
                      >
                        View in Feed →
                      </a>
                      <button
                        onClick={handleStartOver}
                        className="block w-full py-4 border border-white/30 text-blue-200 rounded-lg hover:bg-white/10 transition-colors font-semibold"
                      >
                        Evaluate Another Idea
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <PerformanceMonitor pageName="Studio" />
    </ErrorBoundary>
  );
}
