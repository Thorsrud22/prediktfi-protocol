'use client';

import React, { useState, useEffect } from 'react';
import { useSimplifiedWallet } from '@/app/components/wallet/SimplifiedWalletProvider';
import { usePerformanceTracking, trackPageLoad } from '@/app/utils/performance';
import PerformanceMonitor from '../components/PerformanceMonitor';
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

      const result = await response.json();
      setEvaluationResult(result);
      setCurrentStep('analysis');
    } catch (error) {
      console.error('Error evaluating idea:', error);
      // Ideally show error toast here
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEdit = () => {
    setCurrentStep('question');
    setEvaluationResult(null);
  };

  const handleStartNew = () => {
    setSubmissionData(null);
    setEvaluationResult(null);
    setCurrentStep('question');
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
    <div className="min-h-screen bg-[#0B0F19] text-white selection:bg-blue-500/30">
      <PerformanceMonitor />

      {/* Navigation Bar */}
      <nav className="border-b border-white/10 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-400 rounded-lg flex items-center justify-center font-bold text-lg">
                P
              </div>
              <span className="font-bold text-xl tracking-tight">Predikt.fi Studio</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => isConnected ? null : connect()}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isConnected
                  ? 'bg-white/5 text-blue-200 border border-white/10'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  }`}
              >
                {isConnected ?
                  `${publicKey?.slice(0, 4)}...${publicKey?.slice(-4)}` :
                  'Connect Wallet'
                }
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!isStarted ? (
          /* Landing View */
          <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center justify-center p-2 bg-blue-500/10 rounded-full mb-8 border border-blue-500/20">
              <span className="px-3 py-1 text-sm font-medium text-blue-400">✨ AI-Powered Analysis</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 tracking-tight">
              AI Idea Evaluator Studio
            </h1>
            <p className="text-xl text-blue-200/60 max-w-2xl mx-auto mb-12 leading-relaxed">
              Validate your crypto, memecoin, or web3 project ideas instantly. Get comprehensive risk analysis, success probability, and strategic pivots.
            </p>
            <button
              onClick={handleStart}
              className="group relative px-8 py-4 bg-white text-black rounded-xl font-bold text-lg hover:scale-105 transition-all duration-200 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
            >
              Start new evaluation
              <span className="absolute inset-0 rounded-xl ring-2 ring-white/20 group-hover:ring-white/40 transition-all"></span>
            </button>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left">
              {[
                { title: 'Instant Analysis', desc: 'Get immediate feedback on your project concept.' },
                { title: 'Risk Assessment', desc: 'Identify potential pitfalls before you build.' },
                { title: 'Strategic Pivots', desc: 'AI-suggested improvements to increase success chance.' }
              ].map((feature, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <h3 className="font-bold text-lg mb-2 text-white">{feature.title}</h3>
                  <p className="text-blue-200/60">{feature.desc}</p>
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
                  <div key={step.id} className="flex flex-col items-center gap-3 bg-[#0B0F19] px-4">
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
                <IdeaSubmissionForm
                  onSubmit={handleEvaluate}
                  isSubmitting={isAnalyzing}
                  initialData={submissionData || undefined}
                />
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
