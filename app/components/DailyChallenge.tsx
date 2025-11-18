'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/Button';

interface DailyChallengeData {
  challenge: {
    id: string;
    title: string;
    category: string;
    deadline: string;
    description: string;
    createdBy: {
      id: string;
      handle: string;
      score: number;
      accuracy: number;
    };
    createdAt: string;
  };
  participantCount: number;
  crowdConsensus: number;
  timeRemaining: {
    hours: number;
    minutes: number;
    total: number;
  };
  userHasPredicted: boolean;
}

interface PredictionResult {
  success: boolean;
  message: string;
  prediction: {
    confidence: number;
    timestamp: string;
  };
  stats: {
    participantCount: number;
    crowdConsensus: number;
    yourDifference: number;
  };
}

export default function DailyChallenge() {
  const [data, setData] = useState<DailyChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(50);
  const [submitting, setSubmitting] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  useEffect(() => {
    fetchDailyChallenge();
  }, []);

  const fetchDailyChallenge = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/daily-challenge');
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to load Daily Challenge');
        return;
      }

      const challengeData = await response.json();
      setData(challengeData);
    } catch (err) {
      setError('Unable to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPrediction = async () => {
    if (!data) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/daily-challenge/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confidence }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Failed to submit prediction');
        return;
      }

      setPrediction(result);
      
      // Update local data with new stats
      setData({
        ...data,
        participantCount: result.stats.participantCount,
        crowdConsensus: result.stats.crowdConsensus,
        userHasPredicted: true,
      });
    } catch (err) {
      setError('Failed to submit prediction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse rounded-3xl bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-2 border-purple-500/30 h-96">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-slate-700 rounded"></div>
            <div className="h-8 w-32 bg-slate-700 rounded"></div>
          </div>
          <div className="h-12 bg-slate-700 rounded w-3/4"></div>
          <div className="h-24 bg-slate-700 rounded"></div>
          <div className="h-16 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    // Show placeholder when no challenge is set
    return (
      <div className="relative overflow-hidden rounded-3xl border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/40 via-slate-800/30 to-slate-900/40 shadow-xl">
        <div className="relative z-10 p-8 lg:p-12 text-center">
          <div className="mb-4">
            <div className="inline-flex rounded-full bg-slate-800/80 p-4 mb-4">
              <span className="text-5xl">🎯</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-300 mb-2">
              No Daily Challenge Yet
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Check back soon! Admins can set a Daily Challenge from the admin dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { challenge, participantCount, crowdConsensus, timeRemaining, userHasPredicted } = data;

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      crypto: '₿',
      stocks: '📈',
      tech: '💻',
      politics: '🏛️',
      sports: '⚽',
      general: '💬',
    };
    return icons[category.toLowerCase()] || '💬';
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 75) return 'from-green-500 to-emerald-600';
    if (conf >= 50) return 'from-blue-500 to-cyan-600';
    if (conf >= 25) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-purple-500/50 bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-indigo-900/40 shadow-2xl shadow-purple-500/20">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 p-8 lg:p-12">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* Challenge Badge */}
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 p-3 shadow-lg shadow-yellow-500/50 animate-pulse">
              <span className="text-2xl">✨</span>
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 uppercase tracking-wider">
                🎯 Daily Challenge
              </h3>
              <p className="text-sm text-slate-400 font-medium">
                Everyone predicts the same event
              </p>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center gap-2 rounded-full bg-red-500/20 border border-red-500/50 px-6 py-3 backdrop-blur">
            <span className="text-lg animate-pulse">⏱️</span>
            <div className="text-right">
              <div className="text-2xl font-bold text-red-400 tabular-nums">
                {timeRemaining.hours}h {timeRemaining.minutes}m
              </div>
              <div className="text-xs text-red-300 uppercase tracking-wide">
                Time Left
              </div>
            </div>
          </div>
        </div>

        {/* Category Badge */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-800/80 border border-slate-700 px-4 py-2">
          <span className="text-lg">{getCategoryIcon(challenge.category)}</span>
          <span className="text-sm font-semibold text-slate-300 uppercase">
            {challenge.category}
          </span>
        </div>

        {/* Question */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
          {challenge.title}
        </h2>

        {/* Description */}
        {challenge.description && (
          <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed line-clamp-3">
            {challenge.description}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-8">
          <div className="flex items-center gap-3 rounded-full bg-slate-800/60 border border-slate-700/50 px-5 py-3 backdrop-blur">
            <span className="text-xl">👥</span>
            <div>
              <div className="text-xl font-bold text-white">
                {participantCount.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 uppercase">Predictions</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-full bg-slate-800/60 border border-slate-700/50 px-5 py-3 backdrop-blur">
            <span className="text-xl">📊</span>
            <div>
              <div className="text-xl font-bold text-white">
                {Math.round(crowdConsensus)}%
              </div>
              <div className="text-xs text-slate-400 uppercase">Crowd Says</div>
            </div>
          </div>
        </div>

        {/* Prediction Interface or Result */}
        {!userHasPredicted && !prediction ? (
          <>
            {/* Confidence Slider */}
            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-lg font-semibold text-slate-200">
                  Your Prediction
                </span>
                <span className={`text-4xl sm:text-5xl font-black bg-gradient-to-r ${getConfidenceColor(confidence)} text-transparent bg-clip-text`}>
                  {confidence}%
                </span>
              </div>

              {/* Custom Slider */}
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidence}
                  onChange={(e) => setConfidence(Number(e.target.value))}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                  style={{
                    background: `linear-gradient(to right, rgb(239, 68, 68) 0%, rgb(234, 179, 8) 50%, rgb(34, 197, 94) 100%)`
                  }}
                />
                <div className="flex justify-between mt-3 text-xs text-slate-500 font-medium">
                  <span>0% Unlikely</span>
                  <span>50% Even</span>
                  <span>100% Certain</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitPrediction}
              disabled={submitting}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-1 shadow-2xl shadow-purple-500/50 transition-all hover:shadow-purple-500/70 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="relative rounded-xl bg-slate-900/80 px-8 py-5 backdrop-blur transition-colors group-hover:bg-slate-900/60">
                <div className="flex items-center justify-center gap-3 text-lg sm:text-xl font-black text-white">
                  <span className="text-2xl">⚡</span>
                  {submitting ? 'Locking In...' : '🔒 Lock In Your Prediction'}
                </div>
              </div>
            </button>
          </>
        ) : (
          /* Success State */
          <div className="rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 p-6 sm:p-8 text-center backdrop-blur">
            <div className="mb-4 inline-flex rounded-full bg-green-500/20 p-4">
              <span className="text-4xl animate-pulse">✨</span>
            </div>
            <h3 className="text-2xl font-bold text-green-400 mb-2">
              ✅ Prediction Locked!
            </h3>
            <p className="text-lg text-green-300 mb-4">
              You predicted <span className="font-black">{prediction?.prediction.confidence || confidence}%</span> confidence
            </p>

            {prediction && (
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-2xl font-bold text-white">{prediction.stats.participantCount}</div>
                  <div className="text-xs text-slate-400 mt-1">Total</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-2xl font-bold text-white">{prediction.stats.crowdConsensus}%</div>
                  <div className="text-xs text-slate-400 mt-1">Crowd</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className={`text-2xl font-bold ${prediction.stats.yourDifference > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {prediction.stats.yourDifference > 0 ? '+' : ''}{prediction.stats.yourDifference}%
                  </div>
                  <div className="text-xs text-slate-400 mt-1">vs Crowd</div>
                </div>
              </div>
            )}

            <p className="mt-6 text-xs text-slate-500">
              Come back tomorrow at midnight UTC for a new challenge! 🎯
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
