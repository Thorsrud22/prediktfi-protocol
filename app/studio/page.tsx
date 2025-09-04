"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";

import InsightForm from "../components/Studio/InsightForm";
import InsightPreview from "../components/Studio/InsightPreview";
import QuotaGuard from "../components/QuotaGuard";
import { type InsightInput, type PredictResponse } from "../lib/ai/types";
import { env } from "../lib/env";
import { persistReferralData } from "../lib/share";
import { getQuota, bumpQuota, isExhausted, resetIfNewDay } from "../lib/quota";

// Lazy load wallet components
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

function StudioContent() {
  const searchParams = useSearchParams();
  
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
  const [quota, setQuota] = useState({ used: 0, limit: 10, remaining: 10 });
  const [quotaExhausted, setQuotaExhausted] = useState(false);

  // Initialize and track quota
  useEffect(() => {
    resetIfNewDay();
    updateQuotaState();
  }, []);

  const updateQuotaState = () => {
    const currentQuota = getQuota();
    const exhausted = isExhausted();
    setQuota(currentQuota);
    setQuotaExhausted(exhausted);
  };

  const handleSubmit = async (insightInput: InsightInput) => {
    setLoading(true);
    try {
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
      
      // Bump quota on successful prediction
      if (bumpQuota()) {
        updateQuotaState();
      }
      
      setInput(insightInput);
      setResponse(data);
      setCurrentStep("preview");

      // Save to localStorage insights feed immediately after getting preview
      if (typeof window !== "undefined") {
        try {
          const insight: any = {
            kind: "insight" as const,
            topic: insightInput.topic,
            question: insightInput.question,
            horizon: insightInput.horizon,
            prob: data.prob,
            drivers: data.drivers,
            rationale: data.rationale,
            model: data.model,
            scenarioId: data.scenarioId,
            ts: data.ts,
            // No signature yet (only added after on-chain logging)
          };

          // Add attribution if available
          const ref = localStorage.getItem("predikt:ref");
          const creatorId = localStorage.getItem("predikt:creatorId");
          if (ref) insight.ref = ref;
          if (creatorId) insight.creatorId = creatorId;

          const existing = localStorage.getItem("predikt:insights");
          const insights = existing ? JSON.parse(existing) : [];
          insights.unshift(insight); // Add to beginning
          
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
      console.error("Failed to get insight:", error);
      alert("Failed to get insight. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for template preview (doesn't navigate to preview)
  const handlePredict = async (insightInput: InsightInput) => {
    try {
      const res = await fetch("/api/ai/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: insightInput.topic,
          question: insightInput.question,
          horizon: insightInput.horizon,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      setInput(insightInput);
      setResponse(data);
      // Don't change step - stay on form for template preview
    } catch (error) {
      console.error("Failed to get preview:", error);
    }
  };

  const handleNewInsight = () => {
    setCurrentStep("form");
    setInput(null);
    setResponse(null);
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
                <h3 className="text-lg font-semibold text-[color:var(--text)] mb-3">Create New Insight</h3>
                <InsightForm
                  onSubmit={handleSubmit}
                  loading={loading}
                />
              </div>
            )}
          </div>
        )}

        {currentStep === "preview" && input && response && (
          <InsightPreview 
            input={input} 
            response={response} 
            onNewInsight={handleNewInsight}
          />
        )}

        {/* Recent Insights Feed */}
        <RecentInsightsFeed />
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
