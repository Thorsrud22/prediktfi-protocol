'use client';

import { useState, useEffect } from 'react';
import { useOptimizedFetch } from '@/app/hooks/useOptimizedFetch';
import { SkeletonCard } from '@/app/components/ui/Skeleton';
import { ErrorBoundary } from '@/app/components/ui/ErrorBoundary';
import { useSimplifiedWallet } from '@/app/components/wallet/SimplifiedWalletProvider';
import { trackPageLoad, usePerformanceTracking } from '@/app/utils/performance';

interface PredictionTemplate {
  id: string;
  category: string;
  title: string;
  description: string;
  timeframe: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  potentialReward: number;
}

interface AIAnalysis {
  confidence: number;
  factors: string[];
  recommendation: 'Bullish' | 'Bearish' | 'Neutral';
  reasoning: string;
  dataPoints: number;
  lastUpdated: string;
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

  const { isConnected, publicKey } = useSimplifiedWallet();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<PredictionTemplate | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'basic' | 'advanced' | 'ai'>('basic');
  const [predictionText, setPredictionText] = useState('');

  // Form state
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('high');
  const [timeHorizon, setTimeHorizon] = useState('24h');
  const [stakeAmount, setStakeAmount] = useState('0.5');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    data: dynamicTemplates,
    loading,
    error,
  } = useOptimizedFetch<PredictionTemplate[]>('/api/studio/templates', {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    timeoutMs: 3000,
    retries: 1,
  });

  // Static templates for immediate rendering
  const staticTemplates: PredictionTemplate[] = [
    {
      id: 'btc-100k',
      category: 'crypto',
      title: 'Bitcoin $100k Prediction',
      description:
        'Will Bitcoin reach $100,000 by end of year? Analyze market trends, institutional adoption, and regulatory developments.',
      timeframe: '6 months',
      difficulty: 'Medium' as const,
      potentialReward: 3.5,
    },
    {
      id: 'eth-5k',
      category: 'crypto',
      title: 'Ethereum $5k Target',
      description:
        'Predict if Ethereum will break the $5,000 resistance level in the next quarter.',
      timeframe: '3 months',
      difficulty: 'Hard' as const,
      potentialReward: 4.2,
    },
    {
      id: 'tesla-stock',
      category: 'stocks',
      title: 'Tesla Q4 Performance',
      description:
        'Will Tesla stock outperform the NASDAQ this quarter? Consider EV market trends and production targets.',
      timeframe: '3 months',
      difficulty: 'Medium' as const,
      potentialReward: 2.8,
    },
    {
      id: 'nfl-playoffs',
      category: 'sports',
      title: 'NFL Playoff Predictions',
      description:
        'Predict which teams will make it to the playoffs based on current season performance.',
      timeframe: '2 months',
      difficulty: 'Easy' as const,
      potentialReward: 1.5,
    },
    {
      id: 'ai-breakthrough',
      category: 'tech',
      title: 'AI Model Breakthrough',
      description:
        'Will there be a major AI model release that surpasses GPT-4 capabilities this year?',
      timeframe: '12 months',
      difficulty: 'Hard' as const,
      potentialReward: 5.0,
    },
    {
      id: 'weather-pattern',
      category: 'weather',
      title: 'Winter Weather Prediction',
      description: 'Predict if this winter will be colder than average in major US cities.',
      timeframe: '4 months',
      difficulty: 'Easy' as const,
      potentialReward: 1.2,
    },
  ];

  // Combine static and dynamic templates
  const allTemplates = [...staticTemplates, ...(dynamicTemplates || [])];

  // Use fallback templates if loading fails after 3 seconds or there's an error
  const displayTemplates = allTemplates;

  const { data: aiAnalysis, loading: analysisLoading } = useOptimizedFetch<AIAnalysis>(
    selectedTemplate ? `/api/studio/analysis/${selectedTemplate.id}` : null,
    { cacheTime: 2 * 60 * 1000, staleTime: 10 * 1000 },
  );

  const categories = [
    { id: 'all', name: 'All Categories', icon: '📊' },
    { id: 'crypto', name: 'Cryptocurrency', icon: '₿' },
    { id: 'stocks', name: 'Stock Market', icon: '📈' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'politics', name: 'Politics', icon: '🗳️' },
    { id: 'weather', name: 'Weather', icon: '🌤️' },
    { id: 'tech', name: 'Technology', icon: '💻' },
  ];

  const analysisTypes = [
    { id: 'basic', name: 'Basic Analysis', description: 'Simple trend analysis' },
    { id: 'advanced', name: 'Advanced Analytics', description: 'Multi-factor analysis' },
    { id: 'ai', name: 'AI-Powered Insights', description: 'Machine learning predictions' },
  ];

  const filteredTemplates =
    selectedCategory === 'all'
      ? displayTemplates
      : displayTemplates?.filter(t => t.category === selectedCategory);

  const handleSubmitPrediction = async () => {
    // Require wallet connection for security
    if (!isConnected || !publicKey) {
      setSubmitError('Please connect your wallet to submit predictions');
      return;
    }

    if (!selectedTemplate || !predictionText.trim()) {
      setSubmitError('Please select a template and enter your prediction');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/studio/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          predictionText: predictionText.trim(),
          confidence,
          timeHorizon,
          stakeAmount: parseFloat(stakeAmount),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit prediction');
      }

      console.log('🎉 Insight created successfully:', result);

      // Redirect to insight page if provided
      if (result.redirectTo) {
        window.location.href = result.redirectTo;
        return;
      }

      setSubmitSuccess(true);

      // Reset form after successful submission
      setTimeout(() => {
        setPredictionText('');
        setConfidence('high');
        setTimeHorizon('24h');
        setStakeAmount('0.5');
        setSubmitSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Failed to submit prediction:', error);
      setSubmitError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    // Save draft to localStorage for now
    if (selectedTemplate && predictionText.trim()) {
      const draft = {
        templateId: selectedTemplate.id,
        predictionText: predictionText.trim(),
        confidence,
        timeHorizon,
        stakeAmount,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem('prediction-draft', JSON.stringify(draft));

      // Show confirmation
      alert('Draft saved locally!');
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent mb-4">
              Prediction Studio
            </h1>
            <p className="text-xl text-blue-200/80 max-w-2xl mx-auto">
              Create accurate predictions with AI-powered insights and advanced analytics
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 sticky top-4">
                <h3 className="text-lg font-semibold mb-4 text-white">Categories</h3>
                <div className="space-y-2">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors flex items-center space-x-3 ${
                        selectedCategory === category.id
                          ? 'bg-blue-500/30 text-white border-blue-400/50 border'
                          : 'hover:bg-white/10 text-blue-200'
                      }`}
                    >
                      <span className="text-xl">{category.icon}</span>
                      <span className="font-medium text-sm">{category.name}</span>
                    </button>
                  ))}
                </div>

                {/* Analysis Mode Selector */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4 text-white">Analysis Mode</h3>
                  <div className="space-y-3">
                    {analysisTypes.map(type => (
                      <label key={type.id} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="analysisMode"
                          value={type.id}
                          checked={analysisMode === type.id}
                          onChange={e => setAnalysisMode(e.target.value as any)}
                          className="mt-1 text-blue-400"
                        />
                        <div>
                          <div className="font-medium text-white text-sm">{type.name}</div>
                          <div className="text-xs text-blue-300">{type.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Prediction Templates */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Prediction Templates</h3>
                  <span className="text-sm text-blue-300">
                    {filteredTemplates?.length || 0} templates available
                  </span>
                </div>

                {loading && !dynamicTemplates && filteredTemplates?.length === 0 ? (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                ) : filteredTemplates?.length ? (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredTemplates.map(template => (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg backdrop-blur-sm ${
                          selectedTemplate?.id === template.id
                            ? 'border-blue-400 bg-blue-500/20 ring-2 ring-blue-400/50'
                            : 'border-white/20 bg-slate-800/80 hover:border-white/30 hover:bg-slate-700/80'
                        }`}
                        style={{
                          backgroundColor:
                            selectedTemplate?.id === template.id
                              ? 'rgba(59, 130, 246, 0.2)'
                              : 'rgba(30, 41, 59, 0.8)',
                        }}
                      >
                        <h4 className="font-semibold text-white mb-2">{template.title}</h4>
                        <p className="text-sm text-blue-200/80 mb-3 line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex justify-between items-center text-xs">
                          <span
                            className={`px-2 py-1 rounded-full font-medium ${
                              template.difficulty === 'Easy'
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                : template.difficulty === 'Medium'
                                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}
                          >
                            {template.difficulty}
                          </span>
                          <span className="font-medium text-green-300">
                            ↑ {template.potentialReward} SOL
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-blue-300">
                    <div className="text-4xl mb-3">🔍</div>
                    <p>No templates found for this category</p>
                  </div>
                )}
              </div>

              {/* AI Analysis Panel */}
              {selectedTemplate && analysisMode === 'ai' && (
                <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-400/30 p-6 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                    <span className="mr-2">🤖</span>
                    AI Analysis for "{selectedTemplate.title}"
                  </h3>

                  {analysisLoading ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-24 h-12 bg-white/10 rounded animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 w-32 bg-white/10 rounded mb-2 animate-pulse"></div>
                          <div className="h-3 w-48 bg-white/10 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-4 bg-white/10 rounded animate-pulse"></div>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="h-6 w-20 bg-white/10 rounded animate-pulse"></div>
                        ))}
                      </div>
                    </div>
                  ) : aiAnalysis ? (
                    <div className="space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-white">
                              {aiAnalysis.confidence}%
                            </div>
                            <div className="text-sm text-blue-300">Confidence</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                aiAnalysis.recommendation === 'Bullish'
                                  ? 'bg-green-400'
                                  : aiAnalysis.recommendation === 'Bearish'
                                  ? 'bg-red-400'
                                  : 'bg-yellow-400'
                              }`}
                            ></div>
                            <span
                              className={`font-semibold ${
                                aiAnalysis.recommendation === 'Bullish'
                                  ? 'text-green-300'
                                  : aiAnalysis.recommendation === 'Bearish'
                                  ? 'text-red-300'
                                  : 'text-yellow-300'
                              }`}
                            >
                              {aiAnalysis.recommendation}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-xs text-blue-300">
                          <div>{aiAnalysis.dataPoints.toLocaleString()} data points</div>
                          <div>Updated {new Date(aiAnalysis.lastUpdated).toLocaleTimeString()}</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-white mb-3">Key Analysis Factors:</h4>
                        <div className="flex flex-wrap gap-2">
                          {aiAnalysis.factors.map((factor, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-white/10 rounded-full text-sm border border-white/20 text-purple-200"
                            >
                              {factor}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                        <h4 className="font-medium text-white mb-2 flex items-center">
                          <span className="mr-2">💡</span>AI Reasoning:
                        </h4>
                        <p className="text-blue-200 text-sm leading-relaxed">
                          {aiAnalysis.reasoning}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Prediction Creation */}
              {selectedTemplate && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                    <span className="mr-2">✏️</span>
                    Create Your Prediction
                  </h3>

                  {/* Success/Error Messages */}
                  {submitSuccess && (
                    <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <div className="text-green-300 font-medium">
                        ✅ Prediction submitted successfully!
                      </div>
                      <div className="text-green-400 text-sm mt-1">
                        Your prediction is now active and being tracked.
                      </div>
                    </div>
                  )}

                  {submitError && (
                    <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <div className="text-red-300 font-medium">❌ Submission failed</div>
                      <div className="text-red-400 text-sm mt-1">{submitError}</div>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-blue-200 mb-2">
                        Prediction Statement
                      </label>
                      <textarea
                        value={predictionText}
                        onChange={e => setPredictionText(e.target.value)}
                        placeholder={`Enter your prediction for: ${selectedTemplate.title}`}
                        className="w-full p-4 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none bg-white/10 text-white placeholder-blue-300"
                        rows={4}
                        disabled={isSubmitting}
                      />
                      <div className="text-xs text-blue-300 mt-1">
                        Be specific and measurable for better accuracy tracking
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-200 mb-2">
                          Your Confidence
                        </label>
                        <select
                          value={confidence}
                          onChange={e => setConfidence(e.target.value as 'high' | 'medium' | 'low')}
                          className="w-full p-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white/10 text-white [&>option]:bg-slate-800 [&>option]:text-white"
                          disabled={isSubmitting}
                        >
                          <option value="high" className="bg-slate-800 text-white">
                            High (80-100%)
                          </option>
                          <option value="medium" className="bg-slate-800 text-white">
                            Medium (60-79%)
                          </option>
                          <option value="low" className="bg-slate-800 text-white">
                            Low (40-59%)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-200 mb-2">
                          Time Horizon
                        </label>
                        <select
                          value={timeHorizon}
                          onChange={e => setTimeHorizon(e.target.value)}
                          className="w-full p-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white/10 text-white [&>option]:bg-slate-800 [&>option]:text-white"
                          disabled={isSubmitting}
                        >
                          <option value="1h" className="bg-slate-800 text-white">
                            1 Hour
                          </option>
                          <option value="24h" className="bg-slate-800 text-white">
                            24 Hours
                          </option>
                          <option value="1w" className="bg-slate-800 text-white">
                            1 Week
                          </option>
                          <option value="1m" className="bg-slate-800 text-white">
                            1 Month
                          </option>
                          <option value="3m" className="bg-slate-800 text-white">
                            3 Months
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-200 mb-2">
                          Stake Amount
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="10"
                            value={stakeAmount}
                            onChange={e => setStakeAmount(e.target.value)}
                            placeholder="0.5"
                            className="w-full p-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 pr-12 bg-white/10 text-white placeholder-blue-300"
                            disabled={isSubmitting}
                          />
                          <span className="absolute right-3 top-3 text-blue-300 font-medium">
                            SOL
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/20">
                      <div className="text-sm text-blue-200">
                        <span className="font-medium">Potential reward:</span>
                        <span className="text-green-300 font-bold ml-1">
                          {selectedTemplate.potentialReward} SOL
                        </span>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleSaveDraft}
                          disabled={isSubmitting || !predictionText.trim()}
                          className="px-6 py-2 border border-white/30 text-blue-200 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Save Draft
                        </button>
                        <button
                          onClick={handleSubmitPrediction}
                          disabled={isSubmitting || !predictionText.trim() || !isConnected}
                          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-teal-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          {isSubmitting ? (
                            <span className="flex items-center">
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                              Submitting...
                            </span>
                          ) : !isConnected ? (
                            <span className="flex items-center">
                              <svg
                                className="w-4 h-4 mr-2"
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
                              Connect Wallet to Submit
                            </span>
                          ) : (
                            'Submit Prediction'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
