'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to Predikt',
      icon: '👋',
      content: (
        <div className="space-y-4">
          <p className="text-lg text-blue-100">
            Build a <strong className="text-white">verifiable track record</strong> of your predictions on Solana blockchain.
          </p>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-200 text-sm">
              💡 Every prediction you make is timestamped and immutable. 
              Over time, this builds a reputation that proves your forecasting ability.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center">
              <div className="text-3xl mb-1">🎯</div>
              <div className="text-xs text-gray-300">Make predictions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">⛓️</div>
              <div className="text-xs text-gray-300">Commit on-chain</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">📈</div>
              <div className="text-xs text-gray-300">Build reputation</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'How It Works',
      icon: '⚡',
      content: (
        <div className="space-y-5">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-lg">
              1
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">Make a Prediction</h4>
              <p className="text-sm text-blue-200">
                State what you believe will happen with a specific deadline.
                <br />
                <span className="text-blue-300 italic">
                  Example: "Bitcoin will reach $100,000 by December 31, 2024"
                </span>
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-lg">
              2
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">Get AI Analysis</h4>
              <p className="text-sm text-blue-200">
                Our AI analyzes your prediction and suggests a probability with reasoning and key factors.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-lg">
              3
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">Commit to Blockchain</h4>
              <p className="text-sm text-blue-200">
                Your prediction is timestamped on Solana. It's permanent, verifiable, and builds your track record.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Building Your Reputation',
      icon: '🏆',
      content: (
        <div className="space-y-4">
          <p className="text-blue-100">
            When your prediction deadline passes, you mark it as resolved. Your <strong className="text-white">accuracy score</strong> updates automatically.
          </p>

          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">✓</div>
              <div>
                <h4 className="font-semibold text-green-300 mb-1">Correct Predictions</h4>
                <p className="text-sm text-green-200">
                  Increase your accuracy score and climb the leaderboard
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">📊</div>
              <div>
                <h4 className="font-semibold text-blue-300 mb-1">Track Record</h4>
                <p className="text-sm text-blue-200">
                  All predictions are permanent - honest forecasting builds trust over time
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-blue-300 pt-2">
            💡 Your reputation is based on accuracy, not just winning. Even wrong predictions contribute to your calibration score!
          </p>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // Don't close on backdrop click during onboarding
      // User should actively skip or complete it
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-xl border border-white/20 max-w-2xl w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentStepData.icon}</span>
            <h2 className="text-2xl font-bold text-white">{currentStepData.title}</h2>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-white transition-colors text-sm"
            aria-label="Skip onboarding"
          >
            Skip
          </button>
        </div>

        {/* Progress indicator */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index <= currentStep ? 'bg-blue-500' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px]">{currentStepData.content}</div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/20">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-2 text-blue-200 hover:text-white transition-colors disabled:opacity-0 disabled:cursor-default font-medium"
          >
            ← Back
          </button>

          <div className="flex gap-3">
            {!isLastStep && (
              <button
                onClick={handleSkip}
                className="px-6 py-2 border border-white/30 text-blue-200 rounded-lg hover:bg-white/10 transition-colors font-medium"
              >
                Skip Tour
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-teal-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
            >
              {isLastStep ? (
                <Link href="/studio" className="flex items-center gap-2">
                  Create First Prediction →
                </Link>
              ) : (
                'Next →'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
