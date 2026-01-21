'use client';

import { useState } from 'react';
import { useSimplifiedWallet } from '@/app/components/wallet/SimplifiedWalletProvider';

interface PredictionTemplate {
  id: string;
  category: string;
  title: string;
  description: string;
  timeframe: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  potentialReward: number;
}

interface PredictionFormProps {
  selectedTemplate: PredictionTemplate;
  onSuccess?: () => void;
}

export default function PredictionForm({ selectedTemplate, onSuccess }: PredictionFormProps) {
  const { isConnected, publicKey } = useSimplifiedWallet();
  const [predictionText, setPredictionText] = useState('');
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('high');
  const [timeHorizon, setTimeHorizon] = useState('24h');
  const [stakeAmount, setStakeAmount] = useState('0.5');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmitPrediction = async () => {
    if (!isConnected || !publicKey) {
      setSubmitError('Please connect your wallet to submit predictions');
      return;
    }

    if (!predictionText.trim()) {
      setSubmitError('Please enter your prediction');
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

      if (result.redirectTo) {
        window.location.href = result.redirectTo;
        return;
      }

      setSubmitSuccess(true);
      onSuccess?.();

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
    if (predictionText.trim()) {
      const draft = {
        templateId: selectedTemplate.id,
        predictionText: predictionText.trim(),
        confidence,
        timeHorizon,
        stakeAmount,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem('prediction-draft', JSON.stringify(draft));
      alert('Draft saved locally!');
    }
  };

  return (
    <div className="bg-white/10 rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
        <span className="mr-2">✏️</span>
        Create Your Prediction
      </h3>

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
  );
}