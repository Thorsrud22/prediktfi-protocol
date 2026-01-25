'use client';

import React, { useState, useEffect } from 'react';
import { useSimplifiedWallet } from '@/app/components/wallet/SimplifiedWalletProvider';
import { usePerformanceTracking, trackPageLoad } from '@/app/utils/performance';
import PerformanceMonitor from '../components/PerformanceMonitor';
import IdeaSubmissionForm from './IdeaSubmissionForm';
import dynamic from 'next/dynamic';

const IdeaEvaluationReport = dynamic(() => import('./IdeaEvaluationReport'), {
  loading: () => <div className="min-h-[600px] w-full bg-slate-900/40 animate-pulse rounded-3xl" />,
  ssr: false
});
import { IdeaSubmission } from '@/lib/ideaSchema';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';
import { CircleCheckBig as CheckCircle } from 'lucide-react';

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
        // console.log('[Studio] Fetching quota. PublicKey:', publicKey);
        const addressParam = publicKey ? `?walletAddress=${publicKey}` : '';
        const res = await fetch(`/api/idea-evaluator/quota${addressParam}`, {
          cache: 'no-store',
          headers: {
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
          }
        });
        if (res.ok) {
          const data = await res.json();
          // console.log('[Studio] Quota received:', data, 'for key:', publicKey);
          setQuota(data);
        }
      } catch (e) {
        console.error("Failed to fetch quota", e);
      }
    }
    fetchQuota();
  }, [publicKey, evaluationResult]);

  // Stream reasoning steps for the UI

  const [streamingSteps, setStreamingSteps] = useState<string[]>([]);
  const [streamingThoughts, setStreamingThoughts] = useState<string>(""); // Buffer as single string

  const handleEvaluate = async (data: IdeaSubmission) => {
    setSubmissionData(data);
    setIsAnalyzing(true);
    setError(null);
    setStreamingSteps([]);

    try {
      const payload = {
        ...data,
        walletAddress: publicKey || undefined
      };

      // Use the streaming endpoint
      const response = await fetch('/api/idea-evaluator/evaluate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(publicKey ? { 'x-wallet-id': publicKey } : {})
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Daily limit reached. Your limit resets at midnight UTC. Want unlimited access? Join the Pro waitlist at /pricing');
        }
        throw new Error('Evaluation failed');
      }

      // Read the SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream');
      }

      let thoughtAccumulator = ""; // Local accumulator for thoughts
      let lastUpdate = Date.now();
      let buffer = ""; // SSE buffer

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            // Next line will be data
          } else if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            try {
              const event = JSON.parse(jsonStr);

              if (event.step) {
                setStreamingSteps(prev => [...prev, event.step]);
              } else if (event.thought) {
                // BUFFER STRATEGY: Accumulate text locally, throttle state updates
                thoughtAccumulator += event.thought;

                // Only update React state every 100ms to prevent render thrashing
                const now = Date.now();
                if (now - lastUpdate > 100) {
                  setStreamingThoughts(thoughtAccumulator);
                  lastUpdate = now;
                }
              } else if (event.result) {
                // Ensure final thought state is synced before showing result
                setStreamingThoughts(thoughtAccumulator);
                setEvaluationResult(event.result);
                setCurrentStep('analysis');

                // AUTO-SAVE if connected
                // We use the local 'data' (submission) and 'event.result' variables because state updates are async
                if (publicKey) {
                  // We define a fire-and-forget save function or just call fetch here
                  // Using an IIFE to handle the async save without blocking the loop cleanly
                  (async () => {
                    try {
                      setCommitStatus('committing'); // Show loading state on the button immediately
                      const saveRes = await fetch('/api/idea/save', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          submission: data,
                          result: event.result,
                          walletAddress: publicKey
                        }),
                      });
                      if (saveRes.ok) {
                        const saveData = await saveRes.json();
                        setInsightId(saveData.id);
                        setCommitStatus('success');
                      } else {
                        // If auto-save fails, we just revert to idle so they can try manual commit
                        console.error("Auto-save failed");
                        setCommitStatus('idle');
                      }
                    } catch (err) {
                      console.error("Auto-save error", err);
                      setCommitStatus('idle');
                    }
                  })();
                }

              } else if (event.error) {
                throw new Error(event.error);
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks, but log critical failures in dev
              if (process.env.NODE_ENV === 'development') {
                console.warn('SSE Chunk Parse Error (likely split chunk):', e);
              }
            }
          }
        }
      }

      // Final flush of thought buffer
      setStreamingThoughts(thoughtAccumulator);

    } catch (error: unknown) {
      console.error('Error evaluating idea:', error);
      const errorMessage = error instanceof Error ? error.message : 'Evaluation service is temporarily unavailable. Please try again.';
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
      // Don't clear streams here, user wants to see them
    }
  };

  const handleEdit = () => {
    setCurrentStep('question');
    setEvaluationResult(null);
    setError(null);
  };

  const handleStartNew = () => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setSubmissionData(null);
    setEvaluationResult(null);
    setCurrentStep('question');
    setError(null);
    setCommitStatus('idle');
    setInsightId(null);
  };

  const handleCommit = async () => {
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
    <>
      <PerformanceMonitor />

      <div className="relative pt-8 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tighter mb-2 bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent uppercase italic">
              Studio <span className="text-blue-500">.</span>
            </h1>
            <p className="text-white/50 text-xs sm:text-base max-w-xl font-medium tracking-[0.2em] uppercase">
              Advanced AI Evaluation Protocol for Web3 Assets
            </p>
          </div>

          {/* FAIR USE LIMIT DISPLAY */}
          {quota && (
            <div className="text-right block">
              <div className="text-[10px] uppercase text-blue-300/60 mb-1 tracking-widest font-mono">DAILY LIMIT</div>
              <div className={`font-bold text-2xl font-mono ${quota.remaining === 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                {quota.remaining === -1 ? 'UNLIMITED' : `${quota.remaining}/${quota.limit}`}
              </div>
              {quota.remaining === 0 && (
                <a href="/pricing" className="text-[9px] text-amber-400/80 hover:text-amber-300 uppercase tracking-widest mt-1 block">
                  Want more? Join Pro waitlist →
                </a>
              )}
            </div>
          )}
        </div>

        <div className="min-h-[400px]">
          {currentStep === 'question' && (
            <>
              {error && (
                <div className="mb-6 border border-red-500 text-red-500 p-4 font-mono text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="text-lg">!</span> ERROR: {error}
                </div>
              )}
              <IdeaSubmissionForm
                onSubmit={handleEvaluate}
                isSubmitting={isAnalyzing}
                quota={quota}
                streamingSteps={streamingSteps}
                streamingThoughts={streamingThoughts}
                isConnected={isConnected}
                onConnect={connect}
                error={error}
              />
            </>
          )}

          {currentStep === 'analysis' && evaluationResult && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <IdeaEvaluationReport
                result={evaluationResult}
                onEdit={handleEdit}
                onStartNew={handleStartNew}
              />

              <div className="flex justify-end pt-8 border-t border-white/10">
                {commitStatus === 'success' ? (
                  <div className="flex items-center gap-2 text-green-400 font-bold uppercase tracking-widest text-sm">
                    <CheckCircle size={20} /> Insight Committed
                  </div>
                ) : (
                  <button
                    onClick={handleCommit}
                    disabled={commitStatus === 'committing'}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white uppercase tracking-widest font-bold text-sm hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 rounded-full shadow-lg hover:shadow-blue-500/25 transition-all"
                  >
                    {commitStatus === 'committing' ? (
                      <>Processing...</>
                    ) : (
                      <>Commit Insight to Chain →</>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {currentStep === 'commit' && commitStatus === 'success' && (
            <div className="text-center py-20 animate-in fade-in zoom-in duration-500 border border-white/10 bg-slate-900/95 p-12 max-w-2xl mx-auto rounded-2xl shadow-2xl">
              <div className="inline-flex items-center justify-center p-6 border-2 border-green-500 text-green-500 mb-6 rounded-full bg-green-500/10">
                <CheckCircle size={48} />
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-white">Insight Committed</h2>
              <p className="text-white/60 mb-8 max-w-md mx-auto text-base">
                Your evaluation has been immutably recorded on-chain.
                <br />
                <span className="font-mono text-sm mt-2 block text-white/40">ID: <span className="text-green-400">{insightId}</span></span>
              </p>

              <div className="flex flex-col gap-4 max-w-xs mx-auto">
                <a
                  href={`/idea/${insightId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 border border-white/20 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-xs transition-colors rounded-full"
                >
                  View Public Record
                </a>
                <button
                  onClick={handleStartNew}
                  className="px-6 py-3 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors rounded-full shadow-lg"
                >
                  Start New Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
