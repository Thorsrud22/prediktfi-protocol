'use client';

import { useState, useEffect } from 'react';
import { useSimplifiedWallet } from '@/app/components/wallet/SimplifiedWalletProvider';
import ResolveModal from '@/app/components/resolution/ResolveModal';
import ResolutionStatusBadge from '@/app/components/resolution/ResolutionStatusBadge';
import Link from 'next/link';

interface Prediction {
  id: string;
  canonical: string;
  p: number;
  deadline: string;
  status: 'OPEN' | 'COMMITTED' | 'RESOLVED';
  createdAt: string;
  outcome?: {
    result: 'YES' | 'NO' | 'INVALID';
    evidenceUrl?: string;
    decidedAt: string;
  } | null;
}

export default function MyPredictionsPage() {
  const { isConnected, publicKey } = useSimplifiedWallet();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'ready' | 'resolved'>('all');

  useEffect(() => {
    if (isConnected && publicKey) {
      fetchPredictions();
    } else {
      setLoading(false);
    }
  }, [isConnected, publicKey]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/my-predictions', {
        headers: publicKey ? {
          'x-wallet-address': publicKey,
        } : {},
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch predictions');
      }

      const data = await response.json();
      setPredictions(data.predictions || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveSuccess = () => {
    fetchPredictions(); // Refresh the list
  };

  const now = new Date();
  const filteredPredictions = predictions.filter((pred) => {
    const deadlineDate = new Date(pred.deadline);
    const isPastDeadline = deadlineDate < now;

    switch (filter) {
      case 'active':
        return pred.status !== 'RESOLVED' && !isPastDeadline;
      case 'ready':
        return pred.status !== 'RESOLVED' && isPastDeadline;
      case 'resolved':
        return pred.status === 'RESOLVED';
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading predictions...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Wallet Connection Required</h2>
          <p className="text-gray-400 mb-6">
            Please connect your wallet to view and manage your predictions
          </p>
          <button
            onClick={() => {
              // Trigger wallet connection
              document.getElementById('wallet-connect-button')?.click();
            }}
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Predictions</h1>
          <p className="text-blue-200/80">View and resolve your predictions</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {[
            { key: 'all', label: 'All', count: predictions.length },
            {
              key: 'active',
              label: 'Active',
              count: predictions.filter(
                (p) => p.status !== 'RESOLVED' && new Date(p.deadline) >= now
              ).length,
            },
            {
              key: 'ready',
              label: 'Ready to Resolve',
              count: predictions.filter(
                (p) => p.status !== 'RESOLVED' && new Date(p.deadline) < now
              ).length,
            },
            {
              key: 'resolved',
              label: 'Resolved',
              count: predictions.filter((p) => p.status === 'RESOLVED').length,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-blue-200 hover:bg-white/20'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300">❌ {error}</p>
          </div>
        )}

        {/* Predictions List */}
        {filteredPredictions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {filter === 'all'
                ? 'No predictions yet'
                : filter === 'ready'
                ? 'No predictions ready to resolve'
                : filter === 'resolved'
                ? 'No resolved predictions'
                : 'No active predictions'}
            </h3>
            <p className="text-gray-400 mb-6">
              {filter === 'all'
                ? 'Create your first prediction to start building your track record'
                : 'Check back later or try a different filter'}
            </p>
            {filter === 'all' && (
              <Link
                href="/studio"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                Create Prediction
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPredictions.map((prediction) => {
              const deadlineDate = new Date(prediction.deadline);
              const isPastDeadline = deadlineDate < now;
              const canResolve = isPastDeadline && prediction.status !== 'RESOLVED';

              return (
                <div
                  key={prediction.id}
                  className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 hover:border-blue-400/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {prediction.canonical}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span>Probability: {Math.round(prediction.p * 100)}%</span>
                        <span>•</span>
                        <span>Deadline: {deadlineDate.toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Created: {new Date(prediction.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <ResolutionStatusBadge
                      status={prediction.status}
                      result={prediction.outcome?.result || null}
                      deadline={prediction.deadline}
                    />
                  </div>

                  {prediction.outcome && (
                    <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-sm text-blue-200">
                        <strong>Outcome:</strong> {prediction.outcome.result} •
                        Resolved on {new Date(prediction.outcome.decidedAt).toLocaleDateString()}
                      </p>
                      {prediction.outcome.evidenceUrl && (
                        <a
                          href={prediction.outcome.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:underline"
                        >
                          View evidence →
                        </a>
                      )}
                    </div>
                  )}

                  {canResolve && (
                    <button
                      onClick={() => setSelectedPrediction(prediction)}
                      className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all font-semibold"
                    >
                      Resolve Prediction
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {selectedPrediction && (
        <ResolveModal
          insight={{
            id: selectedPrediction.id,
            question: selectedPrediction.canonical,
            probability: Math.round(selectedPrediction.p * 100),
            deadline: selectedPrediction.deadline,
          }}
          isOpen={!!selectedPrediction}
          onClose={() => setSelectedPrediction(null)}
          onSuccess={handleResolveSuccess}
        />
      )}
    </div>
  );
}
