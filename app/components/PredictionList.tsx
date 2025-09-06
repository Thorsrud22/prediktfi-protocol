'use client';

import { useState, useEffect } from 'react';

interface Prediction {
  id: string;
  statement: string;
  probability: number;
  deadline: string;
  topic: string;
  status: string;
  isCommitted: boolean;
  createdAt: string;
  latestOutcome?: {
    outcome: string;
    confidence: number;
    createdAt: string;
  } | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface PredictionListProps {
  refreshTrigger?: number;
}

export default function PredictionList({ refreshTrigger }: PredictionListProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    status: '',
    topic: '',
  });

  const fetchPredictions = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: '10',
      });

      if (filters.status) params.append('status', filters.status);
      if (filters.topic) params.append('topic', filters.topic);

      const response = await fetch(`/api/prediction?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch predictions');
      }

      setPredictions(data.predictions);
      setPagination(data.pagination);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [filters, refreshTrigger]);

  const getStatusBadge = (status: string, isCommitted: boolean) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    if (isCommitted) {
      return (
        <span className={`${baseClasses} bg-purple-100 text-purple-800`}>
          ⛓️ Committed
        </span>
      );
    }

    switch (status) {
      case 'DRAFT':
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            📝 Draft
          </span>
        );
      case 'ACTIVE':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            ✅ Active
          </span>
        );
      case 'RESOLVED':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            🎯 Resolved
          </span>
        );
      case 'EXPIRED':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            ⏰ Expired
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            {status}
          </span>
        );
    }
  };

  const getTopicEmoji = (topic: string) => {
    switch (topic) {
      case 'Cryptocurrency': return '₿';
      case 'Technology': return '💻';
      case 'Politics': return '🏛️';
      case 'Sports': return '⚽';
      case 'Weather': return '🌤️';
      default: return '📊';
    }
  };

  const generateReceipt = async (predictionId: string, theme: 'light' | 'dark' = 'light') => {
    try {
      const response = await fetch(`/api/prediction/receipt?predictionId=${predictionId}&theme=${theme}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate receipt');
      }

      const svg = await response.text();
      
      // Create download link
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prediction-${predictionId.slice(0, 8)}-receipt.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Receipt generation failed:', error);
      alert('Failed to generate receipt. Please try again.');
    }
  };

  if (loading && predictions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Predictions</h2>
        <button
          onClick={fetchPredictions}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '🔄' : '↻'} Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="RESOLVED">Resolved</option>
          <option value="EXPIRED">Expired</option>
        </select>

        <select
          value={filters.topic}
          onChange={(e) => setFilters(prev => ({ ...prev, topic: e.target.value, page: 1 }))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Topics</option>
          <option value="Cryptocurrency">Cryptocurrency</option>
          <option value="Technology">Technology</option>
          <option value="Politics">Politics</option>
          <option value="Sports">Sports</option>
          <option value="Weather">Weather</option>
        </select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Predictions List */}
      {predictions.length === 0 && !loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No predictions found</p>
          <p className="text-gray-400 text-sm mt-2">Create your first prediction to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {predictions.map((prediction) => (
            <div key={prediction.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getTopicEmoji(prediction.topic)}</span>
                  <span className="text-sm text-gray-500">{prediction.topic}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(prediction.status, prediction.isCommitted)}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {prediction.statement}
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                <div>
                  <span className="font-medium">Probability:</span>
                  <div className="text-lg font-bold text-blue-600">
                    {(prediction.probability * 100).toFixed(0)}%
                  </div>
                </div>
                <div>
                  <span className="font-medium">Deadline:</span>
                  <div>{new Date(prediction.deadline).toLocaleDateString()}</div>
                </div>
                <div>
                  <span className="font-medium">Created:</span>
                  <div>{new Date(prediction.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <span className="font-medium">Days Left:</span>
                  <div>
                    {Math.max(0, Math.ceil((new Date(prediction.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
                  </div>
                </div>
              </div>

              {prediction.latestOutcome && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <div className="text-sm">
                    <span className="font-medium">Latest Outcome:</span> {prediction.latestOutcome.outcome}
                    <span className="ml-2 text-gray-500">
                      (Confidence: {(prediction.latestOutcome.confidence * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                <span>ID: {prediction.id.slice(0, 8)}...</span>
                <div className="flex items-center space-x-2">
                  {prediction.isCommitted && (
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-1"></span>
                      On-chain verified
                    </span>
                  )}
                  <button
                    onClick={() => generateReceipt(prediction.id, 'light')}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                    title="Download receipt"
                  >
                    📄 Receipt
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-8 flex items-center justify-center space-x-2">
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={filters.page <= 1}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <span className="px-4 py-2 text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </span>

          <button
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={filters.page >= pagination.pages}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
