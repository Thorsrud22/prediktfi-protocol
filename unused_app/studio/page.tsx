'use client';

import React, { useState, useEffect } from 'react';
import { useSimplifiedWallet } from '@/app/components/wallet/SimplifiedWalletProvider';
import { usePerformanceTracking, trackPageLoad } from '@/app/utils/performance';
import PerformanceMonitor from '../components/PerformanceMonitor';
import Aurora from '../components/ui/Aurora';
import EvaluationLoadingOverlay from './EvaluationLoadingOverlay';
import IdeaSubmissionForm from './IdeaSubmissionForm';
import IdeaEvaluationReport from './IdeaEvaluationReport';
import { IdeaSubmission } from '@/lib/ideaSchema';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';

type Step = 'question' | 'analysis' | 'commit';

export default function StudioPage() {
  const { isConnected, connect, publicKey } = useSimplifiedWallet();
  const [isStarted, setIsStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('question');
  const [submissionData, setSubmissionData] = useState<IdeaSubmission | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<IdeaEvaluationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commitStatus, setCommitStatus] = useState<'idle' | 'committing' | 'success' | 'error'>('idle');
  const [insightId, setInsightId] = useState<string | null>(null);

  // Performance tracking
  usePerformanceTracking('StudioPage');

  useEffect(() => {
    const finishTracking = trackPageLoad('StudioPage');
    return () => {
      finishTracking.end();
    };
  }, []);

  const handleStart = () => {
    setIsStarted(true);
  };

  const handleEvaluate = async (data: IdeaSubmission) => {
    setSubmissionData(data);
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/idea-evaluator/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Evaluation failed');
      }

      const responseData = await response.json();
      setEvaluationResult(responseData.result);
      setCurrentStep('analysis');
    } catch (error) {
      console.error('Error evaluating idea:', error);
      setError('Evaluation service is temporarily unavailable. Please try again.');
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
    setSubmissionData(null);
    setEvaluationResult(null);
    setCurrentStep('question');
    setError(null);
  };

  const handleCommit = async () => {
    if (!isConnected) {
      connect();
      return;
    }

    setCommitStatus('committing');
    try {
      // Simulate commit delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real app, we would save the evaluation result to the chain/db here
      // const response = await fetch('/api/insight/commit', { ... });

      setInsightId(`insight_${Date.now()}`);
      setCommitStatus('success');
      setCurrentStep('commit');
    } catch (error) {
      console.error('Error committing insight:', error);
      setCommitStatus('error');
    }
  };

  return (
    <div className="relative min-h-screen text-white selection:bg-blue-500/30">
      {/* Aurora Background */}
      <Aurora
        colorStops={['#0ea5e9', '#3b82f6', '#8b5cf6']} // Blue to purple gradient
        amplitude={1.2}
        blend={0.6}
        speed={0.8}
        className="fixed inset-0 -z-10"
      />

      {/* Gradient overlay for better text readability */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900 -z-[9]" />

      <PerformanceMonitor />



      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!isStarted ? (
          /* Landing View */
          /* Landing View */
          <div className="relative text-center py-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

            <div className="inline-flex items-center justify-center px-4 py-1.5 bg-blue-500/10 rounded-full mb-8 border border-blue-500/20 backdrop-blur-sm">
              <span className="text-sm font-medium text-blue-400 tracking-wide">✨ AI-POWERED ANALYSIS</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50">
                AI Idea Evaluator
              </span>
              <br />
              <span className="text-white">Studio</span>
            </h1>

            <p className="text-xl md:text-2xl text-blue-200/70 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
              Validate your crypto, memecoin, or web3 project ideas instantly. <br className="hidden md:block" />
              Get comprehensive risk analysis, success probability, and strategic pivots.
            </p>

            <button
              onClick={handleStart}
              className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl font-bold text-xl hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-105 transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start New Evaluation
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-blue-300 opacity-0 group-hover:opacity-20 transition-opacity blur-lg"></div>
            </button>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 text-left">
              {[
                {
                  icon: '⚡️',
                  title: 'Instant Analysis',
                  desc: 'Get immediate feedback on your project concept with deep AI insights.'
                },
                {
                  icon: '🛡️',
                  title: 'Risk Assessment',
                  desc: 'Identify potential pitfalls and security risks before you write a single line of code.'
                },
                {
                  icon: '💡',
                  title: 'Strategic Pivots',
                  desc: 'Receive actionable suggestions to improve your product-market fit and tokenomics.'
                }
              ].map((feature, i) => (
                <div key={i} className="group p-8 rounded-3xl bg-slate-900/80 border border-white/[0.05] hover:bg-slate-800 hover:border-white/10 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-white group-hover:text-blue-200 transition-colors">{feature.title}</h3>
                  <p className="text-blue-200/50 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Evaluation Flow */
          <div className="max-w-3xl mx-auto">
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
                  {isAnalyzing ? (
                    <EvaluationLoadingOverlay />
                  ) : (
                    <>
                      {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm text-center animate-in fade-in slide-in-from-top-2">
                          {error}
                        </div>
                      )}

                      <IdeaSubmissionForm
                        onSubmit={handleEvaluate}
                        isSubmitting={isAnalyzing}
                        initialData={submissionData || undefined}
                      />
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
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={handleStartNew}
                      className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-lg transition-all"
                    >
                      Start New Evaluation
                    </button>
                    <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-lg shadow-blue-500/20">
                      View on Explorer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
