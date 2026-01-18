'use client';

import React, { useState, useEffect } from 'react';
import { useSimplifiedWallet } from '@/app/components/wallet/SimplifiedWalletProvider';
import { usePerformanceTracking, trackPageLoad } from '@/app/utils/performance';
import PerformanceMonitor from '../components/PerformanceMonitor';
import EvaluationLoadingOverlay from './EvaluationLoadingOverlay';
import IdeaSubmissionForm from './IdeaSubmissionForm';
import IdeaEvaluationReport from './IdeaEvaluationReport';
import { IdeaSubmission } from '@/lib/ideaSchema';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';
import StudioSkeleton from './StudioSkeleton';

type Step = 'question' | 'analysis' | 'commit';

export default function StudioPage() {
  const { isConnected, connect, publicKey } = useSimplifiedWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('question');
  const [submissionData, setSubmissionData] = useState<IdeaSubmission | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<IdeaEvaluationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commitStatus, setCommitStatus] = useState<'idle' | 'committing' | 'success' | 'error'>('idle');
  const [insightId, setInsightId] = useState<string | null>(null);
  const [quota, setQuota] = useState<{ limit: number; remaining: number } | null>(null);

  // Performance tracking
  usePerformanceTracking('StudioPage');

  useEffect(() => {
    const finishTracking = trackPageLoad('StudioPage');
    return () => {
      finishTracking.end();
    };
  }, []);

  // Fetch Quota
  useEffect(() => {
    async function fetchQuota() {
      try {
        const addressParam = publicKey ? `?walletAddress=${publicKey}` : '';
        const res = await fetch(`/api/idea-evaluator/quota${addressParam}`);
        if (res.ok) {
          const data = await res.json();
          setQuota(data);
        }
      } catch (e) {
        console.error("Failed to fetch quota", e);
      }
    }
    fetchQuota();
  }, [publicKey, evaluationResult]); // Refresh on wallet change or after evaluation

  const handleEvaluate = async (data: IdeaSubmission) => {
    setSubmissionData(data);
    setIsAnalyzing(true);
    setError(null);

    try {
      const payload = {
        ...data,
        walletAddress: publicKey || undefined
      };

      const response = await fetch('/api/idea-evaluator/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 429) {
        throw new Error('Daily quota exceeded. Please come back tomorrow or upgrade.');
      }

      if (!response.ok) {
        throw new Error('Evaluation failed');
      }

      const responseData = await response.json();
      setEvaluationResult(responseData.result);
      setCurrentStep('analysis');
    } catch (error: any) {
      console.error('Error evaluating idea:', error);
      setError(error.message || 'Evaluation service is temporarily unavailable. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEdit = () => {
    setCurrentStep('question');
    setEvaluationResult(null);
    setError(null);
  };

  const handleStartNew = () => {
    // Scroll to top instantly to prevent layout jump when switching from long report -> short form
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setSubmissionData(null);
    setEvaluationResult(null);
    setCurrentStep('question');
    setError(null);
  };

  const handleCommit = async () => {
    // We allow saving without wallet for now, or we can enforce it.
    // Ideally we want to link it to a user.
    // For now, let's just save it.

    setCommitStatus('committing');
    try {
      const response = await fetch('/api/idea/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission: submissionData,
          result: evaluationResult,
          walletAddress: publicKey || undefined
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      const data = await response.json();
      setInsightId(data.id);
      setCommitStatus('success');
      setCurrentStep('commit');
    } catch (error) {
      console.error('Error committing insight:', error);
      setCommitStatus('error');
    }
  };


  return (
    <div className="relative min-h-screen text-white selection:bg-blue-500/30">
      <PerformanceMonitor />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Evaluation Flow */}
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
          {/* Persistent Glow behind Steps */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          {/* Progress Steps */}
          <div className="flex justify-between mb-12 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-10"></div>
            {[
              { id: 'question', label: 'Idea Submission' },
              { id: 'analysis', label: 'AI Evaluation' },
              { id: 'commit', label: 'Commit Insight' }
            ].map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted =
                (currentStep === 'analysis' && index === 0) ||
                (currentStep === 'commit');

              return (
                <div key={step.id} className="flex flex-col items-center gap-3 px-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${isActive ? 'bg-blue-500 text-white scale-110 shadow-lg shadow-blue-500/30' :
                    isCompleted ? 'bg-green-500 text-white' :
                      'bg-white/10 text-white/40 border border-white/10'
                    }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className={`text-sm font-medium ${isActive ? 'text-blue-400' : 'text-white/40'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStep === 'question' && (
              <>
                {isLoading ? (
                  <div className="animate-in fade-in duration-300">
                    <StudioSkeleton />
                  </div>
                ) : isAnalyzing ? (
                  <EvaluationLoadingOverlay />
                ) : (
                  <>
                    {error && (
                      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm text-center animate-in fade-in slide-in-from-top-2">
                        {error}
                      </div>
                    )}

                    <div className="animate-in fade-in duration-300">
                      <IdeaSubmissionForm
                        onSubmit={handleEvaluate}
                        isSubmitting={isAnalyzing}
                        initialData={submissionData || undefined}
                        quota={quota}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {currentStep === 'analysis' && evaluationResult && (
              <div className="space-y-8">
                <IdeaEvaluationReport
                  result={evaluationResult}
                  onEdit={handleEdit}
                  onStartNew={handleStartNew}
                />

                <div className="flex justify-end pt-8 border-t border-white/10">
                  <button
                    onClick={handleCommit}
                    disabled={commitStatus === 'committing'}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                  >
                    {commitStatus === 'committing' ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Committing to Chain...
                      </>
                    ) : (
                      <>
                        Commit Insight to Chain →
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'commit' && (
              <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 text-green-400 border border-green-500/50">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Insight Committed Successfully!</h2>
                <p className="text-blue-200/60 mb-8">
                  Your idea evaluation has been recorded on-chain. ID: <span className="font-mono text-white bg-white/10 px-2 py-1 rounded">{insightId}</span>
                </p>
                <div className="flex flex-col gap-4 max-w-md mx-auto">
                  <div className="flex gap-4">
                    <a
                      href={`/idea/${insightId}`}
                      target="_blank"
                      className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-lg transition-all text-center flex items-center justify-center"
                    >
                      View Public Page
                    </a>
                    <button
                      onClick={() => {
                        const text = `Just validated my project idea on @PrediktFi. AI Confidence: ${evaluationResult?.overallScore}% 🔮 #BuildPublic`;
                        const url = `${window.location.origin}/idea/${insightId}`;
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                      }}
                      className="flex-1 px-6 py-3 bg-black hover:bg-gray-900 text-white rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <span>Share on X</span>
                    </button>
                  </div>
                  <button
                    onClick={handleStartNew}
                    className="px-6 py-3 text-blue-300 hover:text-white transition-colors text-sm"
                  >
                    Start New Evaluation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
