'use client';

import { useState, useEffect } from 'react';
import { ErrorBoundary } from '@/app/components/ui/ErrorBoundary';
import { useSimplifiedWallet } from '@/app/components/wallet/SimplifiedWalletProvider';
import { trackPageLoad, usePerformanceTracking } from '@/app/utils/performance';
import PerformanceMonitor from '../components/PerformanceMonitor';

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
  const [currentStep, setCurrentStep] = useState<Step>('question');
  const [question, setQuestion] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate AI analysis
  const handleGenerateAnalysis = async () => {
    if (!question.trim()) {
      setError('Please enter a prediction');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/studio/generate-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate analysis');
      }

      const data = await response.json();
      setAiAnalysis(data);
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
      setError('Please connect your wallet to commit predictions');
      return;
    }

    setIsCommitting(true);
    setError(null);

    try {
      const response = await fetch('/api/insight/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          probability: aiAnalysis?.probability || 50,
          reasoning: aiAnalysis?.reasoning || '',
          walletAddress: publicKey,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to commit prediction');
      }

      const result = await response.json();
      console.log('✅ Prediction committed:', result);
      
      setCommitSuccess(true);
      setCurrentStep('commit');
    } catch (err: any) {
      setError(err.message || 'Failed to commit prediction. Please try again.');
    } finally {
      setIsCommitting(false);
    }
  };

  // Reset to start over
  const handleStartOver = () => {
    setCurrentStep('question');
    setQuestion('');
    setAiAnalysis(null);
    setCommitSuccess(false);
    setError(null);
  };

  // Example questions for inspiration
  const exampleQuestions = [
    'Bitcoin will reach $100,000 by December 31, 2024',
    'Ethereum will surpass $5,000 by March 31, 2025',
    'Tesla stock will outperform the NASDAQ by June 30, 2025',
    'A major AI company will announce AGI breakthrough by December 31, 2024',
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent mb-4">
              Prediction Studio
            </h1>
            <p className="text-xl text-blue-200/80 max-w-2xl mx-auto">
              Create AI-powered predictions and build a verifiable track record on Solana
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="flex items-center justify-center space-x-4">
              {/* Step 1 */}
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep === 'question'
                      ? 'bg-blue-500 text-white ring-4 ring-blue-500/30'
                      : currentStep === 'analysis' || currentStep === 'commit'
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 text-blue-300'
                  }`}
                >
                  {currentStep === 'analysis' || currentStep === 'commit' ? '✓' : '1'}
                </div>
                <span className="ml-2 text-sm text-blue-200 hidden sm:inline">Ask Question</span>
              </div>

              {/* Connector */}
              <div className={`w-16 h-1 ${currentStep === 'analysis' || currentStep === 'commit' ? 'bg-green-500' : 'bg-white/20'}`}></div>

              {/* Step 2 */}
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep === 'analysis'
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
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep === 'commit'
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

            {/* Step 1: Ask Question */}
            {currentStep === 'question' && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  What do you want to predict?
                </h2>

                <textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Bitcoin will reach $100,000 by December 31, 2024"
                  className="w-full p-4 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none bg-white/10 text-white placeholder-blue-300/60 text-lg"
                  rows={5}
                  disabled={isGenerating}
                />

                <p className="text-sm text-blue-300 mt-3 mb-6">
                  💡 Make a specific, measurable prediction with a clear deadline
                </p>

                {/* Example Questions */}
                <div className="mb-8">
                  <p className="text-sm font-medium text-blue-200 mb-3">
                    Need inspiration? Try one of these predictions:
                  </p>
                  <div className="space-y-2">
                    {exampleQuestions.map((example, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuestion(example)}
                        className="w-full text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400/30 rounded-lg text-sm text-blue-200 transition-all"
                        disabled={isGenerating}
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateAnalysis}
                  disabled={isGenerating || !question.trim()}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-teal-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isGenerating ? (
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
                      Generating AI Analysis...
                    </span>
                  ) : (
                    'Generate AI Analysis →'
                  )}
                </button>
              </div>
            )}

            {/* Step 2: AI Analysis */}
            {currentStep === 'analysis' && aiAnalysis && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-400/30 p-8 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <span className="mr-3">🤖</span>
                    AI Analysis
                  </h2>

                  {/* Question Display */}
                  <div className="mb-6 p-4 bg-white/10 rounded-lg border border-white/20">
                    <p className="text-blue-200 text-sm font-medium mb-1">Your Prediction:</p>
                    <p className="text-white text-lg">{question}</p>
                  </div>

                  {/* Probability */}
                  <div className="text-center mb-8">
                    <div className="text-7xl font-bold text-white mb-2">
                      {aiAnalysis.probability}%
                    </div>
                    <p className="text-blue-300 text-lg">AI-Predicted Probability</p>
                    <div className="mt-4">
                      <span
                        className={`inline-block px-4 py-2 rounded-full font-semibold ${
                          aiAnalysis.confidence === 'high'
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
                      AI Reasoning:
                    </h3>
                    <p className="text-blue-200 leading-relaxed">{aiAnalysis.reasoning}</p>
                  </div>

                  {/* Key Factors */}
                  <div>
                    <h3 className="font-semibold text-white mb-3">Key Analysis Factors:</h3>
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

                  {/* Data Points */}
                  <div className="mt-6 text-center text-sm text-blue-300">
                    Based on {aiAnalysis.dataPoints.toLocaleString()} data points
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
                  Prediction Committed!
                </h2>
                <p className="text-blue-200 text-lg mb-8 max-w-md mx-auto">
                  Your prediction is now verifiable on Solana blockchain. Build your reputation by making accurate forecasts!
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
                    Create Another Prediction
                  </button>
                  <a
                    href="/account"
                    className="block text-blue-300 hover:text-blue-200 underline text-sm"
                  >
                    View your profile and track record
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <PerformanceMonitor pageName="Studio" />
    </ErrorBoundary>
  );
}
