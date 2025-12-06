'use client';

import { useState, useEffect } from 'react';

interface MetricsData {
  volume: {
    totalPredictions: number;
    commitRate: number;
    resolveRate: number;
    averageTimeToCommit: number;
  };
  resolution: {
    totalResolutions: number;
    outcomeBreakdown: {
      YES: number;
      NO: number;
      INVALID: number;
    };
  };
  retention: {
    topCreators: Array<{
      handle: string;
      score: number;
    }>;
  };
}

export default function AdminMetricsDashboard() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      const metricsData = await response.json();
      setData(metricsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        <p>Error: {error}</p>
        <button 
          onClick={fetchMetrics}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-gray-600">No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Volume Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Predictions</h3>
          <p className="text-2xl font-bold text-gray-900">{data.volume.totalPredictions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Commit Rate</h3>
          <p className="text-2xl font-bold text-gray-900">{data.volume.commitRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Resolve Rate</h3>
          <p className="text-2xl font-bold text-gray-900">{data.volume.resolveRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Avg Time to Commit</h3>
          <p className="text-2xl font-bold text-gray-900">{data.volume.averageTimeToCommit.toFixed(2)}s</p>
        </div>
      </div>

      {/* Resolution Metrics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resolution Breakdown</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{data.resolution.outcomeBreakdown.YES}</p>
            <p className="text-sm text-gray-500">YES</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{data.resolution.outcomeBreakdown.NO}</p>
            <p className="text-sm text-gray-500">NO</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">{data.resolution.outcomeBreakdown.INVALID}</p>
            <p className="text-sm text-gray-500">INVALID</p>
          </div>
        </div>
      </div>

      {/* Top Creators */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Creators</h3>
        <div className="space-y-2">
          {data.retention.topCreators.map((creator, index) => (
            <div key={creator.handle} className="flex justify-between items-center">
              <span className="font-medium">{creator.handle}</span>
              <span className="text-sm text-gray-500">{(creator.score * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
