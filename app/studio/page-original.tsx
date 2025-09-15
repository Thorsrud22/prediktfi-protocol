'use client';

import { useState } from 'react';
import { useOptimizedFetch } from '@/app/hooks/useOptimizedFetch';
import { SkeletonCard } from '@/app/components/ui/Skeleton';
import { ErrorBoundary } from '@/app/components/ui/ErrorBoundary';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<PredictionTemplate | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'basic' | 'advanced' | 'ai'>('basic');
  const [predictionText, setPredictionText] = useState('');

  const { data: templates, loading } = useOptimizedFetch<PredictionTemplate[]>(
    '/api/studio/templates',
    { revalidate: 300, staleWhileRevalidate: true }
  );

  const { data: aiAnalysis, loading: analysisLoading } = useOptimizedFetch<AIAnalysis>(
    selectedTemplate ? `/api/studio/analysis/${selectedTemplate.id}` : null,
    { revalidate: 60 }
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

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates?.filter(t => t.category === selectedCategory);

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
                  {categories.map((category) => (
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
                    {analysisTypes.map((type) => (
                      <label key={type.id} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="analysisMode"
                          value={type.id}
                          checked={analysisMode === type.id}
                          onChange={(e) => setAnalysisMode(e.target.value as any)}
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
                
                {loading ? (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                ) : filteredTemplates?.length ? (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredTemplates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg backdrop-blur-sm ${
                          selectedTemplate?.id === template.id
                            ? 'border-blue-400 bg-blue-500/20 ring-2 ring-blue-400/50'
                            : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                        <h4 className="font-semibold text-white mb-2">{template.title}</h4>
                        <p className="text-sm text-blue-200/80 mb-3 line-clamp-2">{template.description}</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className={`px-2 py-1 rounded-full font-medium ${
                            template.difficulty === 'Easy' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                            template.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                            'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}>
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
                            <div className={`w-3 h-3 rounded-full ${
                              aiAnalysis.recommendation === 'Bullish' ? 'bg-green-400' :
                              aiAnalysis.recommendation === 'Bearish' ? 'bg-red-400' :
                              'bg-yellow-400'
                            }`}></div>
                            <span className={`font-semibold ${
                              aiAnalysis.recommendation === 'Bullish' ? 'text-green-300' :
                              aiAnalysis.recommendation === 'Bearish' ? 'text-red-300' :
                              'text-yellow-300'
                            }`}>
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
                            <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-sm border border-white/20 text-purple-200">
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
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-blue-200 mb-2">
                        Prediction Statement
                      </label>
                      <textarea
                        value={predictionText}
                        onChange={(e) => setPredictionText(e.target.value)}
                        placeholder={`Enter your prediction for: ${selectedTemplate.title}`}
                        className="w-full p-4 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none bg-white/10 text-white placeholder-blue-300"
                        rows={4}
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
                        <select className="w-full p-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white/10 text-white">
                          <option value="high">High (80-100%)</option>
                          <option value="medium">Medium (60-79%)</option>
                          <option value="low">Low (40-59%)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-blue-200 mb-2">
                          Time Horizon
                        </label>
                        <select className="w-full p-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white/10 text-white">
                          <option value="1h">1 Hour</option>
                          <option value="24h">24 Hours</option>
                          <option value="1w">1 Week</option>
                          <option value="1m">1 Month</option>
                          <option value="3m">3 Months</option>
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
                            placeholder="0.5"
                            className="w-full p-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 pr-12 bg-white/10 text-white placeholder-blue-300"
                          />
                          <span className="absolute right-3 top-3 text-blue-300 font-medium">SOL</span>
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
                        <button className="px-6 py-2 border border-white/30 text-blue-200 rounded-lg hover:bg-white/10 transition-colors">
                          Save Draft
                        </button>
                        <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-teal-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium">
                          Submit Prediction
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
  title: string
  side?: "long" | "short"
  payload: Record<string, unknown>
}

function intentsKey(base58?: string | null) {
  return base58 ? `predikt:intents:${base58}` : null
}

function loadIntentsFor(base58?: string | null): TradingIntent[] {
  try {
    const k = intentsKey(base58)
    if (!k) return []
    const raw = localStorage.getItem(k)
    return raw ? (JSON.parse(raw) as TradingIntent[]) : []
  } catch {
    return []
  }
}

function saveIntentsFor(base58: string | null | undefined, intents: TradingIntent[]) {
  try {
    const k = intentsKey(base58)
    if (!k) return
    localStorage.setItem(k, JSON.stringify(intents))
  } catch {}
}

function upsertIntentFor(base58: string, intent: TradingIntent) {
  const list = loadIntentsFor(base58)
  const i = list.findIndex(x => x.id === intent.id)
  if (i >= 0) list[i] = intent
  else list.unshift(intent)
  saveIntentsFor(base58, list)
  return list
}

// Safe JSON parser to avoid console SyntaxError overlays in dev
function parseJsonOr<T>(input: string | null, fallback: T, context = 'unknown'): T {
  const result = safeParse<T>(input);
  return result ?? fallback;
}

// Wallet connection handled by header

function StudioContent() {
  const searchParams = useSearchParams();
  const [isProOverride, setIsProOverride] = useState(false);
  const isPro = useIsPro() || isProOverride;
  const { publicKey, isConnected } = useSimplifiedWallet();

  // Clear corrupted localStorage on mount and add global error handler
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Add global error handler for unhandled JSON.parse errors
      const handleError = (event: ErrorEvent) => {
        if (event.message && event.message.includes('JSON.parse')) {
          console.warn('[GLOBAL] Caught JSON.parse error:', event.message);
          event.preventDefault(); // Prevent the error overlay
          return true;
        }
      };
      window.addEventListener('error', handleError);

      // Clear corrupted localStorage
      try {
        const stored = localStorage.getItem("predikt:insights");
        if (stored && stored.trim()) {
          JSON.parse(stored);
        }
      } catch (error) {
        console.warn("[CLEANUP] Clearing corrupted localStorage insights:", error);
        localStorage.removeItem("predikt:insights");
        // Also clear other potentially corrupted keys
        const keysToCheck = ['predikt:ref', 'predikt:creatorId', 'market-context-visible'];
        keysToCheck.forEach(key => {
          const val = localStorage.getItem(key);
          if (val && (val.includes('{') || val.includes('['))) {
            try {
              JSON.parse(val);
            } catch {
              console.warn(`[CLEANUP] Clearing corrupted ${key}:`, val);
              localStorage.removeItem(key);
            }
          }
        });
      }

      return () => window.removeEventListener('error', handleError);
    }
  }, []);
  
  // Handle referral persistence with error boundary
  useEffect(() => {
    try {
      persistReferralData(searchParams);
    } catch (error) {
      console.warn('Failed to persist referral data:', error);
    }
  }, [searchParams]);
  
  const [currentStep, setCurrentStep] = useState<"form" | "preview">("form");
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState<InsightInput | null>(null);
  const [response, setResponse] = useState<PredictResponse | null>(null);
  const [enhancedResponse, setEnhancedResponse] = useState<EnhancedPredictOutput | null>(null);
  const [useAdvancedAnalysis, setUseAdvancedAnalysis] = useState(false);
  const [useEnsembleAnalysis, setUseEnsembleAnalysis] = useState(false);
  const [useContextualAnalysis, setUseContextualAnalysis] = useState(true);
  const [quota, setQuota] = useState({ used: 0, limit: 999999, remaining: 999999 });
  const [quotaExhausted, setQuotaExhausted] = useState(false);

  // E8.1 Progress states
  const [progress, setProgress] = useState<{
    step: string;
    stepNumber: number;
    totalSteps: number;
    message: string;
  } | null>(null);
  const [insightResponse, setInsightResponse] = useState<InsightResponse | null>(null);
  
  // E9.0 Save and stamp states
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stamping, setStamping] = useState(false);
  const [savedInsightId, setSavedInsightId] = useState<string | null>(null);

  // Initialize and track quota
  useEffect(() => {
    resetIfNewDay();
    updateQuotaState();
  }, []);

  const updateQuotaState = () => {
    // For development, always set unlimited quota
    const currentQuota = { used: 0, limit: 999999, remaining: 999999, resetAtIso: new Date().toISOString() };
    setQuota(currentQuota);
    setQuotaExhausted(false);
  };

  const handleSubmit = async (insightInput: InsightInput) => {
    setLoading(true);
    setProgress({ step: 'validating', stepNumber: 1, totalSteps: 6, message: 'Validating input...' });
    
    try {
      if (useAdvancedAnalysis) {
        // Use enhanced analysis with progress callback
        const enhancedInput: EnhancedPredictInput = {
          topic: insightInput.topic,
          question: insightInput.question,
          horizon: insightInput.horizon,
          enableAdvancedAnalysis: true,
          progressCallback: (status: string, progress: number) => {
            setProgress({
              step: 'analyzing',
              stepNumber: Math.ceil(progress / 100 * 8),
              totalSteps: 8,
              message: status
            });
          }
        };

        const enhancedData = await enhancedPredict(enhancedInput);
        setEnhancedResponse(enhancedData);
        
        // Convert to insightResponse format for compatibility
        const insightData = {
          probability: enhancedData.prob,
          confidence: enhancedData.advancedAnalysis?.confidence || 0.8,
          interval: {
            lower: Math.max(0, enhancedData.prob - 0.1),
            upper: Math.min(1, enhancedData.prob + 0.1)
          },
          rationale: enhancedData.rationale,
          metrics: enhancedData.advancedAnalysis?.technical ? {
            rsi: enhancedData.advancedAnalysis.technical.rsi,
            trend: enhancedData.advancedAnalysis.technical.trend,
            sentiment: enhancedData.advancedAnalysis.sentiment?.overallSentiment || 0
          } : null,
          scenarios: enhancedData.advancedAnalysis?.scenarios?.map(s => ({
            label: s.name.charAt(0).toUpperCase() + s.name.slice(1),
            probability: s.probability,
            drivers: s.keyFactors
          })) || [],
          sources: enhancedData.advancedAnalysis?.dataSources?.map(s => ({
            name: s.name,
            url: s.url || '#',
            quality: s.quality
          })) || [],
          tookMs: enhancedData.processingTimeMs
        };
        
        setInsightResponse(insightData);
      } else {
        // Use basic analysis via API
        const requestBody = {
          question: insightInput.question,
          category: insightInput.topic,
          horizon: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          analysisType: useAdvancedAnalysis ? 'advanced' : 'basic',
        };

        setProgress({ 
          step: 'fetching', 
          stepNumber: 2, 
          totalSteps: useAdvancedAnalysis ? 8 : 6, 
          message: useAdvancedAnalysis ? 'Starting comprehensive research...' : 'Fetching market data...' 
        });

        const res = await fetch("/api/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (res.status === 429) {
          setProgress(null);
          const errorData = await res.json();
          if (errorData.error?.includes('Daily limit')) {
            alert('Daily free cap reached. Visit /pricing to upgrade.');
          } else {
            alert('Rate limit exceeded. Please wait a moment and try again.');
          }
          return;
        }

        if (!res.ok) {
          setProgress(null);
          const errorData = await res.json();
          throw new Error(errorData.message || `API error: ${res.status}`);
        }

        setProgress({ step: 'indicators', stepNumber: 3, totalSteps: 6, message: 'Computing indicators...' });
        
        // Simulate progress steps
        await new Promise(resolve => setTimeout(resolve, 500));
        setProgress({ step: 'sentiment', stepNumber: 4, totalSteps: 6, message: 'Analyzing sentiment...' });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        setProgress({ step: 'probability', stepNumber: 5, totalSteps: 6, message: 'Calibrating probability...' });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        setProgress({ step: 'scenarios', stepNumber: 6, totalSteps: 6, message: 'Building scenarios...' });

        const data = await res.json();
        setInsightResponse(data);
      }
      
      // In development, quota is unlimited so no need to bump
      // if (bumpQuota()) {
      //   updateQuotaState();
      // }
      
      setInput(insightInput);
      setCurrentStep("preview");
      setProgress(null);

      // Save to localStorage insights feed
      if (typeof window !== "undefined") {
        try {
          const currentResponse = insightResponse;
          const insight: {
            kind: "insight";
            topic: string;
            question: string;
            horizon: string;
            prob: number;
            drivers: string[];
            rationale: string;
            model: string;
            confidence: number;
            ts: string;
            metrics?: any;
            ref?: string;
            creatorId?: string;
          } = {
            kind: "insight" as const,
            topic: insightInput.topic,
            question: insightInput.question,
            horizon: insightInput.horizon,
            prob: currentResponse?.probability || 0,
            drivers: currentResponse?.scenarios?.[0]?.drivers || [],
            rationale: currentResponse?.rationale || "",
            model: useAdvancedAnalysis ? "advanced-v1" : "e8.1-pipeline",
            confidence: currentResponse?.confidence || 0,
            ts: new Date().toISOString(),
            metrics: currentResponse?.metrics,
            // No signature yet (only added after on-chain logging)
          };

          // Add attribution if available
          const ref = safeLocalStorageGet("predikt:ref", null, 'studio-attribution');
          const creatorId = safeLocalStorageGet("predikt:creatorId", null, 'studio-attribution');
          if (ref) insight.ref = ref;
          if (creatorId) insight.creatorId = creatorId;

          const insights: Array<{kind: "insight"; topic: string; question: string; horizon: string; prob: number; drivers: string[]; rationale: string; model: string; confidence: number; ts: string; metrics?: any; ref?: string; creatorId?: string}> = safeLocalStorageGet("predikt:insights", [], 'studio-save-insights');
          insights.unshift(insight);
          
          // Keep only last 5
          if (insights.length > 5) {
            insights.splice(5);
          }
          
          safeLocalStorageSet("predikt:insights", insights, 'studio-save-insights');
        } catch (error) {
          console.warn("Failed to save insight to feed:", error);
        }
      }
    } catch (error) {
      setProgress(null);
      console.error("Failed to get insight:", error);
      alert("Failed to get insight. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for template preview (doesn't navigate to preview)
  const handlePredict = async (insightInput: InsightInput) => {
    setLoading(true);
        setProgress({ step: 'analyzing', stepNumber: 1, totalSteps: 8, message: 'Initializing advanced research engine...' });
    
    try {
      if (useEnsembleAnalysis) {
        // Use ensemble analysis with progress callback
        const enhancedInput: EnhancedPredictInput = {
          topic: insightInput.topic,
          question: insightInput.question,
          horizon: insightInput.horizon,
          enableEnsemble: true,
          progressCallback: (status: string, progress: number) => {
            setProgress({
              step: 'analyzing',
              stepNumber: Math.ceil(progress / 100 * 8),
              totalSteps: 8,
              message: status
            });
          }
        };

        const enhancedData = await enhancedPredict(enhancedInput);
        setEnhancedResponse(enhancedData);
        
        // Convert to standard format for compatibility
        const standardResponse: PredictResponse = {
          prob: enhancedData.prob,
          drivers: enhancedData.drivers,
          rationale: enhancedData.rationale,
          model: enhancedData.model,
          scenarioId: enhancedData.scenarioId,
          ts: enhancedData.ts,
          // confidence: enhancedData.confidence // Removed - not part of PredictResponse type
        };
        setResponse(standardResponse);
      } else if (useAdvancedAnalysis) {
        // Use enhanced analysis with progress callback
        const enhancedInput: EnhancedPredictInput = {
          topic: insightInput.topic,
          question: insightInput.question,
          horizon: insightInput.horizon,
          enableAdvancedAnalysis: true,
          progressCallback: (status: string, progress: number) => {
            setProgress({
              step: 'analyzing',
              stepNumber: Math.ceil(progress / 100 * 8),
              totalSteps: 8,
              message: status
            });
          }
        };

        const enhancedData = await enhancedPredict(enhancedInput);
        setEnhancedResponse(enhancedData);
        
        // Convert to standard format for compatibility
        const standardResponse: PredictResponse = {
          prob: enhancedData.prob,
          drivers: enhancedData.drivers,
          rationale: enhancedData.rationale,
          model: enhancedData.model,
          scenarioId: enhancedData.scenarioId,
          ts: enhancedData.ts
        };
        setResponse(standardResponse);
      } else if (useContextualAnalysis) {
        // Use contextual analysis (new default)
        const enhancedInput: EnhancedPredictInput = {
          topic: insightInput.topic,
          question: insightInput.question,
          horizon: insightInput.horizon,
          progressCallback: (status: string, progress: number) => {
            setProgress({
              step: 'analyzing',
              stepNumber: Math.ceil(progress / 100 * 8),
              totalSteps: 8,
              message: status
            });
          }
        };

        const enhancedData = await enhancedPredict(enhancedInput);
        setEnhancedResponse(enhancedData);
        
        // Convert to standard format for compatibility
        const standardResponse: PredictResponse = {
          prob: enhancedData.prob,
          drivers: enhancedData.drivers,
          rationale: enhancedData.rationale,
          model: enhancedData.model,
          scenarioId: enhancedData.scenarioId,
          ts: enhancedData.ts,
          // confidence: enhancedData.confidence // Removed - not part of PredictResponse type
        };
        setResponse(standardResponse);
      } else {
        // Use basic analysis
        const res = await fetch("/api/ai/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: insightInput.topic,
            question: insightInput.question,
            horizon: insightInput.horizon,
          }),
        });

        if (res.status === 429) {
          const errorData = await res.json();
          if (errorData.code === 'RATE_LIMIT') {
            alert('Slow down a bit. Try again soon.');
          } else if (errorData.code === 'FREE_DAILY_LIMIT') {
            alert('Daily free cap reached. Visit /pricing to upgrade.');
          }
          return;
        }

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();
        setResponse(data);
      }
      
      setInput(insightInput);
      setProgress(null);
      // Don't change step - stay on form for template preview
    } catch (error) {
      console.error("Failed to get preview:", error);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNewInsight = () => {
    setCurrentStep("form");
    setInput(null);
    setResponse(null);
    setInsightResponse(null);
    setProgress(null);
    setSaveModalOpen(false);
    setSavedInsightId(null);
  };


  const handleSaveInsight = async (stampOnChain: boolean = false) => {
    if (!input || !insightResponse) return;
    
    setSaving(true);
    
    // Scope detection and safe defaults (same as in preview)
    const topic = String(insightResponse?.category || input?.topic || '').toLowerCase();
    const isMarket = /(crypto|btc|eth|sol|market|price|token|stock|index)/i.test(topic);
    const scope: 'market' | 'general' = isMarket ? 'market' : 'general';
    
    const probability = Number.isFinite(insightResponse?.probability) ? insightResponse.probability : 0.5;
    const confidence = Number.isFinite(insightResponse?.confidence) ? insightResponse.confidence : 0.6;
    
    const payload = {
      title: input.question ?? 'Untitled',
      probability,
      confidence,
      scope,
      raw: insightResponse ?? null,
      question: input.question,
      category: input.topic,
      horizon: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      creatorHandle: 'anonymous',
    };

    try {
      const res = await fetch('/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error(`save failed ${res.status}`);
      
      const data = await res.json();
      const savedInsight = { id: data.id, ...payload };
      
      // Add to optimistic feed cache with exact structure
      const item: FeedItem = {
        id: savedInsight.id,
        createdAt: Date.now(),
        title: savedInsight.title || 'Untitled',
        category: (scope === 'market' ? 'crypto' : 'general'),
        probability: Number.isFinite(probability) ? probability : 50,
        confidence: Number.isFinite(confidence) ? confidence : 60,
        source: 'studio',
      };
      pushLocalFeed(item);
      console.log('[Feed:local:len]', JSON.parse(localStorage.getItem(FEED_KEY)||'[]').length);
      
      proceedToPreview(savedInsight, stampOnChain);
      
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        // DEV fallback: local storage + proceed to preview
        const id = `local_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
        const key = 'predikt:insights:dev';
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        arr.unshift({ id, createdAt: Date.now(), ...payload });
        localStorage.setItem(key, JSON.stringify(arr));
        console.warn('[DEV SAVE] API failed, saved locally as', id, err);
        
        const savedInsight = { id, ...payload };
        
        // Add to optimistic feed cache even in dev fallback with exact structure
        const item: FeedItem = {
          id: savedInsight.id,
          createdAt: Date.now(),
          title: savedInsight.title || 'Untitled',
          category: (scope === 'market' ? 'crypto' : 'general'),
          probability: Number.isFinite(probability) ? probability : 50,
          confidence: Number.isFinite(confidence) ? confidence : 60,
          source: 'studio',
        };
        pushLocalFeed(item);
        console.log('[Feed:local:len]', JSON.parse(localStorage.getItem(FEED_KEY)||'[]').length);
        
        proceedToPreview(savedInsight, stampOnChain);
      } else {
        // Prod: show clear error message, don't block entire UI
        console.error('Save failed:', err);
        alert('Could not save. Please try again.');
      }
    } finally {
      setSaving(false);
      setSaveModalOpen(false);
    }
  };

  const proceedToPreview = async (savedInsight: any, stampOnChain: boolean = false) => {
    // Set the saved insight ID for tracking
    setSavedInsightId(savedInsight.id);
    
    // Save to per-wallet storage if wallet is connected
    if (isConnected && publicKey) {
      const base58 = publicKey;
      const intent: TradingIntent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        title: savedInsight.title || "Prediction",
        side: undefined, // Will be set by user selection in modal
        payload: { predictionId: savedInsight.id, mode: "dev" }
      };
      upsertIntentFor(base58, intent);
    }
    
    // Clean up URL - remove any draft banner/params and push clean URL
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      const hasDraftParams = currentUrl.searchParams.has('draft') || 
                            currentUrl.searchParams.has('banner') ||
                            currentUrl.searchParams.has('intent');
      
      if (hasDraftParams) {
        // Remove draft-related parameters
        currentUrl.searchParams.delete('draft');
        currentUrl.searchParams.delete('banner');
        currentUrl.searchParams.delete('intent');
        
        // Push clean URL to history
        window.history.pushState({}, '', currentUrl.pathname + currentUrl.search);
      }
    }
    
    // If user wants to stamp on chain
    if (stampOnChain) {
      await handleStampInsight(savedInsight.id);
    } else {
      // Navigate to the saved insight
      window.open(`/i/${savedInsight.id}`, '_blank');
    }
  };

  const handleStampInsight = async (insightId: string) => {
    setStamping(true);
    
    try {
      // In a real app, you'd get the wallet address from wallet adapter
      const mockWalletAddress = 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH';
      
      const response = await fetch('/api/stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insightIds: [insightId],
          walletAddress: mockWalletAddress,
        }),
      });

      if (!response.ok) {
        // Handle stamping errors gracefully
        let errorMessage = `Stamp failed: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Use default error message if JSON parsing fails
        }
        throw new Error(errorMessage);
      }

      const stampResult = await response.json();
      
      setSaveModalOpen(false);
      
      // Show success message with explorer link
      alert(`Successfully stamped on Solana!\nTransaction: ${stampResult.txSig}\nExplorer: ${stampResult.explorerUrl}`);
      
      // Navigate to the stamped insight
      window.open(`/i/${insightId}`, '_blank');
      
    } catch (error) {
      console.error('Failed to stamp insight:', error);
      alert('Failed to stamp on blockchain. The insight was saved but not stamped.');
    } finally {
      setStamping(false);
    }
  };

  // Scope detection and safe number handling (moved out of JSX)
  const topic = String(insightResponse?.category || input?.topic || '').toLowerCase();
  const isMarket = /(crypto|btc|eth|sol|market|price|token|stock|index)/i.test(topic);
  const scope: 'market' | 'general' = isMarket ? 'market' : 'general';
  
  const probability = Number.isFinite(insightResponse?.probability) ? (insightResponse?.probability ?? 0.5) : 0.5;
  const confidence = Number.isFinite(insightResponse?.confidence) ? (insightResponse?.confidence ?? 0.6) : 0.6;
  
  // Update Executive Summary copy
  const summaryLead = scope === 'market'
    ? 'Based on market analysis and signals'
    : 'Based on available evidence and assumptions';

  // Process rationale to update Executive Summary
  const processedRationale = insightResponse?.rationale ? 
    insightResponse.rationale.replace(
      /Based on .*?analysis/,
      summaryLead
    ) : `${summaryLead}, this prediction has a ${Math.round((probability || 0.5) * 100)}% probability with ${Math.round((confidence || 0.6) * 100)}% confidence.`;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-[#0B1426]/50 border-b border-blue-800/30">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-blue-100">AI Studio</h1>
              <p className="text-sm text-blue-200/80 mt-1">
                Get AI-powered insights and log them on-chain
                <span className="ml-4 text-emerald-300 font-medium">
                  Free remaining: {quota.remaining}/{quota.limit}
                </span>
              </p>
            </div>
{/* Removed devnet banner - wallet connection handled by header */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              <li className="relative">
                <div className={`flex items-center ${currentStep === "form" ? "text-indigo-600" : "text-gray-500"}`}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep === "form" ? "border-indigo-600 bg-indigo-600 text-white" : 
                    response ? "border-green-500 bg-green-500 text-white" : "border-gray-300"
                  }`}>
                    {response ? "✓" : "1"}
                  </div>
                  <span className="ml-3 text-sm font-medium">Ask Question</span>
                </div>
              </li>
              <li className="relative ml-8">
                <div className="flex items-center">
                  <div className="h-0.5 w-8 bg-gray-300"></div>
                  <div className={`ml-2 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep === "preview" ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300"
                  }`}>
                    2
                  </div>
                  <span className={`ml-3 text-sm font-medium ${currentStep === "preview" ? "text-indigo-600" : "text-gray-500"}`}>
                    Preview & Log
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Content */}
        {currentStep === "form" && (
          <div className="space-y-6">
            {/* Quota Exhausted Banner */}
            {quotaExhausted && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-800 font-medium">
                      You have reached today's free limit ({quota.limit})
                    </p>
                    <p className="text-orange-700 text-sm">
                      Upgrade to Pro for unlimited insights
                    </p>
                  </div>
                  <Link 
                    href="/pricing"
                    className="bg-[--accent] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[--accent]/90"
                  >
                    Upgrade
                  </Link>
                </div>
              </div>
            )}
            
            {/* E8.1 Progress Indicator */}
            {progress && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900">
                    Processing Insight
                  </h3>
                  <span className="text-sm text-blue-700 font-medium">
                    Step {progress.stepNumber} of {progress.totalSteps}
                  </span>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-blue-700 mb-2">
                    <span>{progress.message}</span>
                    <span>{Math.round((progress.stepNumber / progress.totalSteps) * 100)}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(progress.stepNumber / progress.totalSteps) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {[
                    { step: 'validating', label: 'Validating' },
                    { step: 'fetching', label: 'Market Data' },
                    { step: 'indicators', label: 'Indicators' },
                    { step: 'sentiment', label: 'Sentiment' },
                    { step: 'probability', label: 'Probability' },
                    { step: 'scenarios', label: 'Scenarios' }
                  ].map((item, index) => (
                    <div 
                      key={item.step}
                      className={`flex items-center space-x-2 p-2 rounded ${
                        progress.stepNumber > index + 1 ? 'bg-green-100 text-green-700' :
                        progress.step === item.step ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        progress.stepNumber > index + 1 ? 'bg-green-500' :
                        progress.step === item.step ? 'bg-blue-500 animate-pulse' :
                        'bg-gray-300'
                      }`}></div>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Performance Metrics */}
            {enhancedResponse?.aiAccuracy && (
              <div className="mb-6 p-6 bg-[color:var(--surface)] border border-[var(--border)] rounded-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[color:var(--text)]">Historical Performance</h3>
                      <p className="text-sm text-[color:var(--muted)]">
                        Model accuracy on {enhancedResponse.aiAccuracy.category} category
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-[color:var(--accent)]">
                      {Math.round(enhancedResponse.aiAccuracy.historicalAccuracy * 100)}%
                    </div>
                    <div className="text-xs text-[color:var(--muted)] uppercase tracking-wide">
                      {enhancedResponse.aiAccuracy.totalPredictions} predictions
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-[color:var(--surface-2)] rounded-lg border border-[var(--border)]">
                    <div className="text-sm text-[color:var(--muted)] mb-1">Confidence Level</div>
                    <div className={`text-lg font-semibold capitalize ${
                      enhancedResponse.aiAccuracy.confidenceLevel === 'very_high' ? 'text-green-400' :
                      enhancedResponse.aiAccuracy.confidenceLevel === 'high' ? 'text-blue-400' :
                      enhancedResponse.aiAccuracy.confidenceLevel === 'medium' ? 'text-yellow-400' :
                      'text-gray-400'
                    }`}>
                      {enhancedResponse.aiAccuracy.confidenceLevel.replace('_', ' ')}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-[color:var(--surface-2)] rounded-lg border border-[var(--border)]">
                    <div className="text-sm text-[color:var(--muted)] mb-1">Sample Size</div>
                    <div className="text-lg font-semibold text-[color:var(--text)]">
                      {enhancedResponse.aiAccuracy.totalPredictions}
                    </div>
                  </div>
                </div>

                {enhancedResponse.aiAccuracy.uncertaintyFactors.length > 0 && (
                  <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg mb-4">
                    <div className="text-sm text-orange-300 font-medium mb-1">Key Uncertainty</div>
                    <p className="text-sm text-orange-200">
                      {enhancedResponse.aiAccuracy.uncertaintyFactors[0]}
                    </p>
                  </div>
                )}
                
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="text-sm text-blue-300 font-medium mb-1">Performance Advantage</div>
                  <p className="text-sm text-blue-200">
                    This AI maintains historical accuracy records and learns from outcomes, providing accountability that general AI models lack.
                  </p>
                </div>
              </div>
            )}
            
            {/* Analysis Mode Selection */}
            <div className="mb-6 p-4 bg-[color:var(--surface)] rounded-lg border border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[color:var(--text)] mb-3">
                Analysis Mode
              </h3>
              
              <div className="space-y-3">
            {/* Basic Analysis */}
            <label className="flex items-center p-3 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[color:var(--surface-2)]">
              <input
                type="radio"
                name="analysisMode"
                value="basic"
                checked={!useAdvancedAnalysis && !useEnsembleAnalysis && !useContextualAnalysis}
                onChange={() => {
                  setUseAdvancedAnalysis(false);
                  setUseEnsembleAnalysis(false);
                  setUseContextualAnalysis(false);
                }}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-[color:var(--text)]">Basic Analysis</div>
                <div className="text-sm text-[color:var(--muted)]">Simple heuristics (1-2s)</div>
              </div>
            </label>

            {/* Contextual Analysis - New Default */}
            <label className="flex items-center p-3 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[color:var(--surface-2)]">
              <input
                type="radio"
                name="analysisMode"
                value="contextual"
                checked={useContextualAnalysis && !useAdvancedAnalysis && !useEnsembleAnalysis}
                onChange={() => {
                  setUseAdvancedAnalysis(false);
                  setUseEnsembleAnalysis(false);
                  setUseContextualAnalysis(true);
                }}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-[color:var(--text)]">Contextual Analysis ⭐</div>
                <div className="text-sm text-[color:var(--muted)]">Smart category detection & tailored analysis (3-8s)</div>
              </div>
            </label>

                {/* Advanced Analysis */}
                <label className="flex items-center p-3 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[color:var(--surface-2)]">
                  <input
                    type="radio"
                    name="analysisMode"
                    value="advanced"
                    checked={useAdvancedAnalysis && !useEnsembleAnalysis && !useContextualAnalysis}
                    onChange={() => {
                      setUseAdvancedAnalysis(true);
                      setUseEnsembleAnalysis(false);
                      setUseContextualAnalysis(false);
                    }}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-[color:var(--text)]">Advanced Analysis</div>
                    <div className="text-sm text-[color:var(--muted)]">Real-time data, technical indicators, sentiment analysis (10-30s)</div>
                  </div>
                </label>

                {/* Ensemble Analysis - Pro Feature */}
                <div className={`p-3 border border-[var(--border)] rounded-lg ${!isPro ? 'bg-slate-50/5 border-slate-200/20' : 'hover:bg-[color:var(--surface-2)]'}`}>
                  <label className={`flex items-center cursor-pointer ${!isPro ? 'opacity-75' : ''}`}>
                    <input
                      type="radio"
                      name="analysisMode"
                      value="ensemble"
                      checked={useEnsembleAnalysis && !useAdvancedAnalysis && !useContextualAnalysis}
                      onChange={() => {
                        setUseAdvancedAnalysis(false);
                        setUseEnsembleAnalysis(true);
                        setUseContextualAnalysis(false);
                      }}
                      className="mr-3"
                      disabled={!isPro}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-[color:var(--text)] flex items-center gap-2">
                        Ensemble Analysis ⭐
                        <span className="px-2 py-1 text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-semibold">
                          PRO
                        </span>
                      </div>
                      <div className="text-sm text-[color:var(--muted)]">Multiple AI models with confidence calibration (15-45s)</div>
                    </div>
                  </label>
                  
                  {/* Pro Upgrade Prompt - Only show if not Pro */}
                  {!isPro && (
                    <div className="mt-3 pt-3 border-t border-slate-200/20">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button 
                          onClick={() => window.open('/pricing', '_blank')}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl"
                        >
                          Upgrade to Pro
                        </button>
                        <button 
                          onClick={() => {
                            setIsProOverride(true);
                            setUseEnsembleAnalysis(true);
                            setUseAdvancedAnalysis(false);
                            setUseContextualAnalysis(false);
                          }}
                          className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-all"
                        >
                          🚀 Give me Pro (Dev)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <QuotaGuard>
              <InsightForm 
                onSubmit={handleSubmit} 
                onPredict={handlePredict}
                loading={loading} 
              />
            </QuotaGuard>
            
            {/* Show preview gauge if we have response but haven't navigated to preview */}
            {response && input && (
              <div className="bg-[color:var(--surface)] rounded-lg shadow-sm border border-[var(--border)] p-6">
                <h3 className="text-lg font-semibold text-[color:var(--text)] mb-3">Preview Result</h3>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                    <span className="text-xl font-bold text-white">
                      {Math.round(response.prob * 100)}%
                    </span>
                  </div>
                  <div className="text-sm text-[color:var(--muted)] mb-4 space-y-2">
                    {response.rationale.split('\n\n').map((section: string, index: number) => (
                      <div key={index}>
                        {section.includes('**') ? (
                          <div dangerouslySetInnerHTML={{
                            __html: section
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[color:var(--text)]">$1</strong>')
                              .replace(/\n/g, '<br/>')
                          }} />
                        ) : (
                          <p>{section}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentStep("preview")}
                    className="px-4 py-2 bg-[color:var(--accent)] text-white rounded-lg hover:bg-[color:var(--accent)]/90 transition-colors"
                  >
                    View Full Analysis
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === "preview" && input && insightResponse && (
            <div className="space-y-8">
              {/* E8.1 Results Panel */}
              <div className="bg-[color:var(--surface)] rounded-xl shadow-lg border border-[var(--border)] p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                    <span className="text-3xl font-bold text-white">
                      {Math.round(probability * 100)}%
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-[color:var(--text)] mb-2">
                    Probability Assessment
                  </h2>
                  <div className="flex items-center justify-center space-x-4 text-sm text-[color:var(--muted)]">
                    <span>Confidence: {Math.round(confidence * 100)}%</span>
                    <span>•</span>
                    <span>
                      Range: {Math.round((insightResponse?.interval?.lower || 0) * 100)}% - {Math.round((insightResponse?.interval?.upper || 0) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Market Metrics - Only show for market scope */}
                {scope === 'market' && insightResponse.metrics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="text-center p-4 bg-[color:var(--surface-2)] rounded-lg border border-[var(--border)]">
                      <div className="text-lg font-semibold text-[color:var(--text)]">
                        {fmt(insightResponse.metrics.rsi, 1)}
                      </div>
                      <div className="text-sm text-[color:var(--muted)]">RSI</div>
                    </div>
                    <div className="text-center p-4 bg-[color:var(--surface-2)] rounded-lg border border-[var(--border)]">
                      <div className="text-lg font-semibold text-[color:var(--text)]">
                        {insightResponse?.metrics?.trend || 'neutral'}
                      </div>
                      <div className="text-sm text-[color:var(--muted)]">Trend</div>
                    </div>
                    <div className="text-center p-4 bg-[color:var(--surface-2)] rounded-lg border border-[var(--border)]">
                      <div className="text-lg font-semibold text-[color:var(--text)]">
                        {fmt(insightResponse.metrics.sentiment, 2)}
                      </div>
                      <div className="text-sm text-[color:var(--muted)]">Sentiment</div>
                    </div>
                    <div className="text-center p-4 bg-[color:var(--surface-2)] rounded-lg border border-[var(--border)]">
                      <div className="text-lg font-semibold text-[color:var(--text)]">
                        {insightResponse.tookMs}ms
                      </div>
                      <div className="text-sm text-[color:var(--muted)]">Processing</div>
                    </div>
                  </div>
                )}

                {/* General Analysis - Only show for general scope */}
                {scope === 'general' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-[color:var(--surface-2)] rounded-lg p-4 border border-[var(--border)]">
                      <h4 className="font-semibold text-[color:var(--text)] mb-3">Key Drivers</h4>
                      <ul className="space-y-2 text-sm text-[color:var(--muted)]">
                        <li className="flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          Evidence strength and reliability
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          Historical precedent analysis
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          Contextual factors and timing
                        </li>
                      </ul>
                    </div>
                    <div className="bg-[color:var(--surface-2)] rounded-lg p-4 border border-[var(--border)]">
                      <h4 className="font-semibold text-[color:var(--text)] mb-3">Risk Factors</h4>
                      <ul className="space-y-2 text-sm text-[color:var(--muted)]">
                        <li className="flex items-start">
                          <span className="text-orange-400 mr-2">•</span>
                          Counterarguments and opposing views
                        </li>
                        <li className="flex items-start">
                          <span className="text-orange-400 mr-2">•</span>
                          Uncertainty and unknowns
                        </li>
                        <li className="flex items-start">
                          <span className="text-orange-400 mr-2">•</span>
                          External factors and dependencies
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Professional Analysis */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-[color:var(--text)] mb-4">Professional Analysis</h3>
                  <div className="bg-[color:var(--surface-2)] rounded-lg p-6 border border-[var(--border)] space-y-4">
                    {processedRationale.split('\n\n').map((section: string, index: number) => (
                      <div key={index} className="border-b border-[var(--border)] last:border-b-0 pb-4 last:pb-0">
                        {section.includes('**') ? (
                          <div dangerouslySetInnerHTML={{
                            __html: section
                              .replace(/\*\*(.*?)\*\*/g, '<h4 class="font-semibold text-[color:var(--text)] mb-2">$1</h4>')
                              .replace(/\n/g, '<br/>')
                          }} />
                        ) : (
                          <p className="text-[color:var(--muted)] leading-relaxed">{section}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              {/* Scenarios */}
              {insightResponse.scenarios && insightResponse.scenarios.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-[color:var(--text)] mb-4">Scenarios</h3>
                  <div className="grid gap-4">
                    {insightResponse.scenarios.map((scenario: any, index: number) => (
                      <div key={index} className="border border-[var(--border)] rounded-lg p-4 bg-[color:var(--surface-2)]">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-[color:var(--text)]">{scenario.label}</h4>
                          <span className="text-sm font-semibold text-blue-600">
                            {Math.round(scenario.probability * 100)}%
                          </span>
                        </div>
                        {scenario.drivers && scenario.drivers.length > 0 && (
                          <ul className="text-sm text-[color:var(--muted)] space-y-1">
                            {scenario.drivers.map((driver: string, driverIndex: number) => (
                              <li key={driverIndex} className="flex items-start">
                                <span className="text-gray-400 mr-2">•</span>
                                {driver}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              {insightResponse.sources && insightResponse.sources.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-[color:var(--text)] mb-3">Data Sources</h3>
                  <div className="flex flex-wrap gap-2">
                    {insightResponse.sources.map((source: any, index: number) => (
                      <a 
                        key={index}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full hover:bg-blue-500/30 transition-colors border border-blue-500/30"
                      >
                        {source.name}
                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setSaveModalOpen(true)}
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save & Preview
                </button>
                <button
                  onClick={handleNewInsight}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  New Insight
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Insights Feed */}
        <RecentInsightsFeed />
      </div>

      {/* Save Modal */}
      <SaveInsightModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        insight={insightResponse}
        onSave={handleSaveInsight}
        saving={saving}
        stamping={stamping}
        isPro={isPro}
      />
    </div>
  );
}

interface SaveInsightModalProps {
  open: boolean;
  onClose: () => void;
  insight: InsightResponse | null;
  onSave: (stampOnChain: boolean) => void;
  saving: boolean;
  stamping: boolean;
  isPro: boolean; // <-- Legg til denne linjen
}

function SaveInsightModal({ open, onClose, insight, onSave, saving, stamping, isPro }: SaveInsightModalProps) {
  const [wantToStamp, setWantToStamp] = useState(false);
  const [side, setSide] = useState<"long" | "short" | null>(null);
  const { publicKey, isConnected } = useSimplifiedWallet();
  
  const handleSaveWithIntent = async (stampOnChain: boolean) => {
    // Call the original save function
    await onSave(stampOnChain);
    
    // If wallet is isConnected and side is selected, save to per-wallet storage
    if (isConnected && publicKey && side && insight) {
      const base58 = publicKey;
      const intent: TradingIntent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        title: insight.question || "Prediction",
        side: side,
        payload: { 
          predictionId: insight.id || "unknown", 
          side: side,
          mode: "dev"
        }
      };
      upsertIntentFor(base58, intent);
    }
  };
  
  if (!open) return null;
  
  const hasInsight = Boolean(insight);
  const metrics = insight?.metrics ?? {};
  const probabilityPercent = insight?.probability ? Math.round(insight.probability * 100) : 0;
  const confidencePercent = insight?.confidence ? Math.round(insight.confidence * 100) : 0;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[color:var(--surface)] rounded-xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[color:var(--text)]">Save Insight</h2>
            <button
              onClick={onClose}
              disabled={saving || stamping}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Insight Summary */}
          <div className="mb-6">
            <h3 className="font-medium text-[color:var(--text)] mb-2">Insight Summary</h3>
            <div className="bg-[color:var(--surface-2)] rounded-lg p-4 border border-[var(--border)]">
              {hasInsight ? (
                <>
                  <p className="text-sm text-[color:var(--muted)] mb-2">{insight?.rationale?.split('\n')[0] || 'No question available'}</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="font-semibold text-blue-600">{probabilityPercent}%</span>
                    <span className="text-[color:var(--muted)]">•</span>
                    <span className="text-[color:var(--text)]">Confidence: {confidencePercent}%</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[color:var(--muted)] text-center py-4">Generate an insight first to enable preview.</p>
              )}
            </div>
          </div>

          {/* Trading Direction Selection */}
          {isConnected && publicKey && (
            <div className="mb-6">
              <h3 className="font-medium text-[color:var(--text)] mb-3">Trading Direction</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSide("long")}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    side === "long"
                      ? "border-green-500 bg-green-500/10 text-green-400"
                      : "border-gray-300 hover:border-green-400 text-gray-400 hover:text-green-300"
                  }`}
                  disabled={saving || stamping}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold">Long</div>
                    <div className="text-xs">Bullish position</div>
                  </div>
                </button>
                <button
                  onClick={() => setSide("short")}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    side === "short"
                      ? "border-red-500 bg-red-500/10 text-red-400"
                      : "border-gray-300 hover:border-red-400 text-gray-400 hover:text-red-300"
                  }`}
                  disabled={saving || stamping}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold">Short</div>
                    <div className="text-xs">Bearish position</div>
                  </div>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Select your trading direction to save this prediction for future trading
              </p>
            </div>
          )}

          {/* Stamping Option */}
          <div className="mb-6">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="stampOnChain"
                checked={wantToStamp}
                onChange={(e) => setWantToStamp(e.target.checked)}
                disabled={saving || stamping || (process.env.NEXT_PUBLIC_SOLANA_CLUSTER !== 'mainnet') || !isPro}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <div className="flex-1">
                <label htmlFor="stampOnChain" className="text-sm font-medium text-[color:var(--text)]">
                  Stamp on Solana blockchain
                  {((process.env.NEXT_PUBLIC_SOLANA_CLUSTER !== 'mainnet') || !isPro) && (
                    <span className="ml-2 text-xs text-gray-500">(Pro/mainnet only)</span>
                  )}
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {(process.env.NEXT_PUBLIC_SOLANA_CLUSTER !== 'mainnet') ? (
                    'Stamping is disabled in development. Available on mainnet with Pro plan.'
                  ) : !isPro ? (
                    'Upgrade to Pro to stamp predictions on Solana blockchain.'
                  ) : (
                    'Creates an immutable record of your prediction on Solana blockchain.'
                  )}
                  <span className="text-orange-600 font-medium"> Pro feature</span>
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={() => handleSaveWithIntent(false)}
              disabled={saving || stamping || !hasInsight}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Only'}
            </button>
            <button
              onClick={() => handleSaveWithIntent(wantToStamp)}
              disabled={saving || stamping || !hasInsight}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title={wantToStamp && ((process.env.NEXT_PUBLIC_SOLANA_CLUSTER !== 'mainnet') || !isPro) ? 
                'Stamping is available on mainnet with Pro plan.' : undefined}
            >
              {stamping ? 'Stamping...' : saving ? 'Saving...' : wantToStamp ? 'Save & Stamp' : 'Save & Preview'}
            </button>
          </div>

          {/* Trade This Prediction */}
          {(isFeatureEnabled('ACTIONS') && hasInsight) && (
            <div className="mt-4">
              <TradeButton
                insight={insight ? {
                  probability: insight.probability || 0.5,
                  confidence: insight.confidence || 0.5,
                  rationale: insight.rationale || '',
                  scenarios: insight.scenarios,
                  p: insight.probability,
                  reasoning: insight.rationale,
                  analysis: insight.metrics
                } : null}
                className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all font-medium"
                title="Connect wallet and view trading actions"
              >
                🚀 Trade This Prediction
              </TradeButton>
              <p className="text-xs text-center text-gray-500 mt-2">
                View trading opportunities dashboard
              </p>
            </div>
          )}
          
          {/* When insight missing, show disabled button + hint */}
          {(isFeatureEnabled('ACTIONS') && !hasInsight) && (
            <div className="mt-4">
              <TradeButton 
                disabled 
                className="w-full px-4 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg opacity-60 cursor-not-allowed font-medium"
              >
                🚀 Trade This Prediction
              </TradeButton>
              <div className="text-xs text-center text-[color:var(--muted)] mt-2">
                Generate an insight first to enable trading.
              </div>
            </div>
          )}

          {/* Pro Notice */}
          {wantToStamp && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                ⚠️ Blockchain stamping is a Pro feature. For demo purposes, we'll simulate the stamping process.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RecentInsightsFeed() {
  const [insights, setInsights] = useState<{
    kind: "insight";
    topic: string;
    question: string;
    horizon: string;
    prob: number;
    drivers: string[];
    rationale: string;
    model: string;
    confidence: number;
    ts: string;
    metrics?: any;
    ref?: string;
    creatorId?: string;
  }[]>([]);

  // Load insights from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const parsed = safeLocalStorageGet<typeof insights>("predikt:insights", [], 'studio-recent-insights');
        if (parsed.length > 0) {
          setInsights(parsed);
        }
      } catch (error) {
        console.warn("Failed to load insights from localStorage:", error);
      }
    }
  }, []);

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-lg font-semibold text-[color:var(--text)] mb-4">Recent Insights</h2>
      <div className="grid gap-4">
        {insights.slice(0, 3).map((insight, index) => (
          <div key={index} className="bg-[color:var(--surface)] rounded-lg border border-[var(--border)] p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-[color:var(--text)] truncate">{insight.question}</h3>
              <span className="text-2xl font-bold text-[color:var(--accent)]">
                {Math.round(insight.prob * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
              <span className="bg-[color:var(--surface-2)] px-2 py-1 rounded text-xs">{insight.topic}</span>
              <span>{insight.horizon}</span>
              <span>•</span>
              <span>{new Date(insight.ts).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <StudioContent />
    </Suspense>
  );
}
