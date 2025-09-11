/**
 * Signals Admin Panel
 * /admin/signals
 * 
 * Internal admin interface for signals rollout management
 * - View current health metrics and rollout status
 * - Control rollout percentage (0, 10, 50, 100)
 * - HMAC-signed requests for security
 */

'use client';

import { useState, useEffect } from 'react';

interface HealthData {
  nowIso: string;
  p95_ms: number;
  rate_5xx: number;
  rate_304_or_cdn: number;
  mttr_minutes: number | null;
  health_status: 'green' | 'red';
  cache_status: {
    hasFresh: boolean;
    hasStale: boolean;
  };
  per_source: Array<{
    name: string;
    success_rate: number;
    timeout_rate: number;
    p95_ms: number;
    last_ok_ts: string | null;
    breaker_state: 'closed' | 'open' | 'half-open';
  }>;
}

interface RolloutData {
  rollout: {
    percent: number;
    updatedAt: string;
    updatedBy: string;
    previousPercent: number;
  };
  audit: Array<{
    timestamp: string;
    action: string;
    before: number;
    after: number;
    updatedBy: string;
    ip: string;
    userAgent: string;
  }>;
}

export default function SignalsAdminPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [rolloutData, setRolloutData] = useState<RolloutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fetch health data
  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/ops/signals-health');
      if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
      
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Expected JSON, got ${contentType}`);
      }
      
      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      console.error('Failed to fetch health data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Fetch rollout data
  const fetchRollout = async () => {
    try {
      const response = await fetch('/api/ops/rollout');
      if (!response.ok) throw new Error(`Rollout check failed: ${response.status}`);
      
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Expected JSON, got ${contentType}`);
      }
      
      const data = await response.json();
      setRolloutData(data);
    } catch (err) {
      console.error('Failed to fetch rollout data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Update rollout percentage
  const updateRollout = async (percent: number) => {
    setUpdating(true);
    try {
      // Generate HMAC signature
      const body = JSON.stringify({ percent });
      const response = await fetch('/api/admin/hmac-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: body })
      });
      
      if (!response.ok) throw new Error('Failed to generate signature');
      const { signature } = await response.json();
      
      // Send rollout update
      const updateResponse = await fetch('/api/ops/rollout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ops-signature': signature
        },
        body
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Update failed');
      }
      
      // Refresh data
      await Promise.all([fetchHealth(), fetchRollout()]);
      
    } catch (err) {
      console.error('Failed to update rollout:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUpdating(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchHealth(), fetchRollout()]);
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green': return 'text-green-600 bg-green-100';
      case 'red': return 'text-red-600 bg-red-100';
      case 'open': return 'text-red-600 bg-red-100';
      case 'closed': return 'text-green-600 bg-green-100';
      case 'half-open': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading && !healthData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading signals admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Signals Admin Panel</h1>
          <p className="mt-2 text-gray-600">Monitor and control signals API rollout</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Health Status */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Health Status</h2>
            
            {healthData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Overall Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthData.health_status)}`}>
                    {healthData.health_status.toUpperCase()}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">P95 Latency</span>
                    <p className="text-2xl font-bold text-gray-900">{healthData.p95_ms}ms</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">5xx Error Rate</span>
                    <p className="text-2xl font-bold text-gray-900">{(healthData.rate_5xx * 100).toFixed(3)}%</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">304/CDN Rate</span>
                    <p className="text-2xl font-bold text-gray-900">{(healthData.rate_304_or_cdn * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">MTTR</span>
                    <p className="text-2xl font-bold text-gray-900">
                      {healthData.mttr_minutes ? `${healthData.mttr_minutes}m` : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <span className="text-sm font-medium text-gray-500">Cache Status</span>
                  <div className="mt-2 flex space-x-4">
                    <span className={`px-2 py-1 rounded text-xs ${healthData.cache_status.hasFresh ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      Fresh: {healthData.cache_status.hasFresh ? 'Yes' : 'No'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${healthData.cache_status.hasStale ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                      Stale: {healthData.cache_status.hasStale ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No health data available</p>
            )}
          </div>

          {/* Rollout Control */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Rollout Control</h2>
            
            {rolloutData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Current Rollout</span>
                  <span className="text-2xl font-bold text-blue-600">{rolloutData.rollout.percent}%</span>
                </div>
                
                <div className="text-sm text-gray-500">
                  <p>Updated: {formatTimestamp(rolloutData.rollout.updatedAt)}</p>
                  <p>By: {rolloutData.rollout.updatedBy}</p>
                  <p>Previous: {rolloutData.rollout.previousPercent}%</p>
                </div>
                
                <div className="pt-4 border-t">
                  <span className="text-sm font-medium text-gray-500 mb-3 block">Change Rollout</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 10, 50, 100].map(percent => (
                      <button
                        key={percent}
                        onClick={() => updateRollout(percent)}
                        disabled={updating || rolloutData.rollout.percent === percent}
                        className={`px-3 py-2 rounded text-sm font-medium ${
                          rolloutData.rollout.percent === percent
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {percent}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No rollout data available</p>
            )}
          </div>
        </div>

        {/* Per-Source Status */}
        {healthData && (
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Per-Source Status</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeout Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P95 (ms)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Circuit Breaker</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last OK</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {healthData.per_source.map((source) => (
                    <tr key={source.name}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {source.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(source.success_rate * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(source.timeout_rate * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {source.p95_ms}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(source.breaker_state)}`}>
                          {source.breaker_state}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {source.last_ok_ts ? formatTimestamp(source.last_ok_ts) : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Audit Log */}
        {rolloutData && rolloutData.audit.length > 0 && (
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Changes</h2>
            
            <div className="space-y-3">
              {rolloutData.audit.slice(0, 5).map((entry, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {entry.before}% → {entry.after}%
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      by {entry.updatedBy}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatTimestamp(entry.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
