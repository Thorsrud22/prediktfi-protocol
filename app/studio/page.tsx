"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";

import InsightForm from "../components/Studio/InsightForm";
import InsightPreview from "../components/Studio/InsightPreview";
import QuotaGuard from "../components/QuotaGuard";
import { type InsightInput, type PredictResponse } from "../lib/ai/types";
import { enhancedPredict, type EnhancedPredictInput, type EnhancedPredictOutput } from "../lib/ai/enhanced-kernel";
import { env } from "../lib/env";
import { persistReferralData } from "../lib/share";
import { getQuota, bumpQuota, isExhausted, resetIfNewDay } from "../lib/quota";
import { useIsPro } from "../lib/use-plan";

// Lazy load wallet components
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

function StudioContent() {
  const searchParams = useSearchParams();
  const [isProOverride, setIsProOverride] = useState(false);
  const isPro = useIsPro() || isProOverride;
  
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
  const [insightResponse, setInsightResponse] = useState<any>(null);
  
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
          const insight: any = {
            kind: "insight" as const,
            topic: insightInput.topic,
            question: insightInput.question,
            horizon: insightInput.horizon,
            prob: currentResponse.probability,
            drivers: currentResponse.scenarios?.[0]?.drivers || [],
            rationale: currentResponse.rationale,
            model: useAdvancedAnalysis ? "advanced-v1" : "e8.1-pipeline",
            confidence: currentResponse.confidence,
            ts: new Date().toISOString(),
            metrics: currentResponse.metrics,
            // No signature yet (only added after on-chain logging)
          };

          // Add attribution if available
          const ref = localStorage.getItem("predikt:ref");
          const creatorId = localStorage.getItem("predikt:creatorId");
          if (ref) insight.ref = ref;
          if (creatorId) insight.creatorId = creatorId;

          const existing = localStorage.getItem("predikt:insights");
          const insights = existing ? JSON.parse(existing) : [];
          insights.unshift(insight);
          
          // Keep only last 5
          if (insights.length > 5) {
            insights.splice(5);
          }
          
          localStorage.setItem("predikt:insights", JSON.stringify(insights));
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
          confidence: enhancedData.confidence
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
          confidence: enhancedData.confidence
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
    
    try {
      const response = await fetch('/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input.question,
          category: input.topic,
          horizon: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          creatorHandle: 'anonymous', // In real app, get from user auth
        }),
      });

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }

      const savedInsight = await response.json();
      setSavedInsightId(savedInsight.id);
      
      // If user wants to stamp on chain
      if (stampOnChain) {
        await handleStampInsight(savedInsight.id);
      } else {
        setSaveModalOpen(false);
        // Navigate to the saved insight
        window.open(`/i/${savedInsight.id}`, '_blank');
      }
      
    } catch (error) {
      console.error('Failed to save insight:', error);
      alert('Failed to save insight. Please try again.');
    } finally {
      setSaving(false);
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
        throw new Error(`Stamp failed: ${response.status}`);
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
            <div className="flex items-center gap-4">
              <span className="text-sm text-blue-200/80">
                Cluster: <span className="font-mono text-blue-300">{env.cluster}</span>
              </span>
              <div>
                <WalletMultiButton 
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                    color: '#F8FAFC',
                    border: 'none',
                    fontWeight: '500',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    height: '40px',
                    transition: 'all 150ms ease-in-out',
                  }}
                />
              </div>
            </div>
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900">
                    Processing Insight
                  </h3>
                  <span className="text-sm text-blue-700">
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
                <div className="relative">
                  <label className={`flex items-center p-3 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[color:var(--surface-2)] ${!isPro ? 'opacity-60' : ''}`}>
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
                        <span className="px-2 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold">
                          PRO
                        </span>
                      </div>
                      <div className="text-sm text-[color:var(--muted)]">Multiple AI models with confidence calibration (15-45s)</div>
                    </div>
                  </label>
                  
                  {/* Pro Upgrade Prompt - Only show if not Pro */}
                  {!isPro && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                      <div className="text-center">
                        <div className="text-white font-semibold mb-2">Pro Feature</div>
                        <div className="space-y-2">
                          <button 
                            onClick={() => window.open('/pricing', '_blank')}
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
                          >
                            Upgrade to Pro
                          </button>
                          <br />
                          <button 
                            onClick={() => {
                              setIsProOverride(true);
                              setUseEnsembleAnalysis(true);
                              setUseAdvancedAnalysis(false);
                              setUseContextualAnalysis(false);
                            }}
                            className="px-3 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition-all"
                          >
                            🚀 Give me Pro (Dev)
                          </button>
                        </div>
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
                    {Math.round(insightResponse.probability * 100)}%
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-[color:var(--text)] mb-2">
                  Probability Assessment
                </h2>
                <div className="flex items-center justify-center space-x-4 text-sm text-[color:var(--muted)]">
                  <span>Confidence: {Math.round(insightResponse.confidence * 100)}%</span>
                  <span>•</span>
                  <span>
                    Range: {Math.round(insightResponse.interval.lower * 100)}% - {Math.round(insightResponse.interval.upper * 100)}%
                  </span>
                </div>
              </div>

              {/* Technical Metrics */}
              {insightResponse.metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="text-center p-4 bg-[color:var(--surface-2)] rounded-lg border border-[var(--border)]">
                    <div className="text-lg font-semibold text-[color:var(--text)]">
                      {insightResponse.metrics.rsi?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-sm text-[color:var(--muted)]">RSI</div>
                  </div>
                  <div className="text-center p-4 bg-[color:var(--surface-2)] rounded-lg border border-[var(--border)]">
                    <div className="text-lg font-semibold text-[color:var(--text)]">
                      {insightResponse.metrics.trend || 'neutral'}
                    </div>
                    <div className="text-sm text-[color:var(--muted)]">Trend</div>
                  </div>
                  <div className="text-center p-4 bg-[color:var(--surface-2)] rounded-lg border border-[var(--border)]">
                    <div className="text-lg font-semibold text-[color:var(--text)]">
                      {insightResponse.metrics.sentiment?.toFixed(2) || '0.00'}
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

              {/* Professional Analysis */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-[color:var(--text)] mb-4">Professional Analysis</h3>
                <div className="bg-[color:var(--surface-2)] rounded-lg p-6 border border-[var(--border)] space-y-4">
                  {insightResponse.rationale.split('\n\n').map((section: string, index: number) => (
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
      {saveModalOpen && input && insightResponse && (
        <SaveInsightModal
          insight={{
            question: input.question,
            category: input.topic,
            probability: insightResponse.probability,
            confidence: insightResponse.confidence,
          }}
          onSave={handleSaveInsight}
          onClose={() => setSaveModalOpen(false)}
          saving={saving}
          stamping={stamping}
        />
      )}
    </div>
  );
}

interface SaveInsightModalProps {
  insight: {
    question: string;
    category: string;
    probability: number;
    confidence: number;
  };
  onSave: (stampOnChain: boolean) => void;
  onClose: () => void;
  saving: boolean;
  stamping: boolean;
}

function SaveInsightModal({ insight, onSave, onClose, saving, stamping }: SaveInsightModalProps) {
  const [wantToStamp, setWantToStamp] = useState(false);
  
  const probabilityPercent = Math.round(insight.probability * 100);
  const confidencePercent = Math.round(insight.confidence * 100);
  
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
              <p className="text-sm text-[color:var(--muted)] mb-2">{insight.question}</p>
              <div className="flex items-center space-x-4 text-sm">
                <span className="font-semibold text-blue-600">{probabilityPercent}%</span>
                <span className="text-[color:var(--muted)]">•</span>
                <span className="text-[color:var(--text)]">Confidence: {confidencePercent}%</span>
                <span className="text-[color:var(--muted)]">•</span>
                <span className="capitalize text-[color:var(--text)]">{insight.category}</span>
              </div>
            </div>
          </div>

          {/* Stamping Option */}
          <div className="mb-6">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="stampOnChain"
                checked={wantToStamp}
                onChange={(e) => setWantToStamp(e.target.checked)}
                disabled={saving || stamping}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <div className="flex-1">
                <label htmlFor="stampOnChain" className="text-sm font-medium text-[color:var(--text)]">
                  Stamp on Solana blockchain
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Creates an immutable record of your prediction on Solana devnet. 
                  <span className="text-orange-600 font-medium"> Pro feature</span>
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={() => onSave(false)}
              disabled={saving || stamping}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Only'}
            </button>
            <button
              onClick={() => onSave(wantToStamp)}
              disabled={saving || stamping}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {stamping ? 'Stamping...' : saving ? 'Saving...' : wantToStamp ? 'Save & Stamp' : 'Save & Preview'}
            </button>
          </div>

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
  const [insights, setInsights] = useState<any[]>([]);

  // Load insights from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("predikt:insights");
        if (stored) {
          setInsights(JSON.parse(stored));
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
