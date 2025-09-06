'use client';

import React, { useState, useEffect } from 'react';
import { sloMonitor, SLOStatus } from '../../../lib/observability/slo';

interface SLOPanelProps {
  className?: string;
}

export default function SLOPanel({ className = '' }: SLOPanelProps) {
  const [sloStatus, setSLOStatus] = useState<SLOStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch SLO status
  const fetchSLOStatus = async () => {
    try {
      setLoading(true);
      
      // Get SLO status from global monitor
      const status = sloMonitor.getSLOStatus();
      setSLOStatus(status);
      setLastRefresh(new Date());
      
    } catch (error) {
      console.error('Failed to fetch SLO status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and auto-refresh
  useEffect(() => {
    fetchSLOStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSLOStatus, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !sloStatus) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SLO Status</h3>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading SLO status...</span>
        </div>
      </div>
    );
  }

  if (!sloStatus) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SLO Status</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">SLO data unavailable</p>
        </div>
      </div>
    );
  }

  // Overall status styling
  const getOverallStatusStyle = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Metric status styling
  const getMetricStatusStyle = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'critical':
        return '❌';
      default:
        return '⚪';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">SLO Status</h3>
        <div className="text-sm text-gray-500">
          Last updated: {lastRefresh.toLocaleTimeString()}
          {loading && (
            <span className="ml-2 inline-flex items-center">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              <span className="ml-1">Refreshing...</span>
            </span>
          )}
        </div>
      </div>

      {/* Overall Status */}
      <div className={`rounded-lg border p-4 mb-6 ${getOverallStatusStyle(sloStatus.overall)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-3">
              {getStatusIcon(sloStatus.overall)}
            </span>
            <div>
              <h4 className="font-semibold text-lg capitalize">
                System {sloStatus.overall}
              </h4>
              <p className="text-sm opacity-80">
                Overall SLO compliance status
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-lg">
              {sloStatus.uptime.current.toFixed(2)}%
            </div>
            <div className="text-sm opacity-80">
              Uptime (Target: {sloStatus.uptime.target}%)
            </div>
          </div>
        </div>
      </div>

      {/* SLO Metrics */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">SLO Metrics</h4>
        
        {sloStatus.metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <span className="text-lg mr-3">
                {getStatusIcon(metric.status)}
              </span>
              <div>
                <div className="font-medium text-gray-900">
                  {metric.name}
                </div>
                <div className="text-sm text-gray-600">
                  Target: {metric.target}{metric.name.includes('Rate') ? '%' : 'ms'}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`font-semibold text-lg ${getMetricStatusStyle(metric.status)}`}>
                {metric.value.toFixed(metric.name.includes('Rate') ? 1 : 0)}
                {metric.name.includes('Rate') ? '%' : 'ms'}
              </div>
              <div className="text-sm text-gray-500 flex items-center">
                <span className="mr-1">
                  {metric.trend === 'up' ? '↗️' : metric.trend === 'down' ? '↘️' : '➡️'}
                </span>
                {metric.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SLO Targets Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">SLO Targets</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-blue-50 p-3 rounded">
            <div className="font-medium text-blue-900">API Latency P95</div>
            <div className="text-blue-700">Target: &lt; 300ms</div>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <div className="font-medium text-blue-900">Error Rate</div>
            <div className="text-blue-700">Target: &lt; 1%</div>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <div className="font-medium text-blue-900">Uptime</div>
            <div className="text-blue-700">Target: &gt; 99.9%</div>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <div className="font-medium text-blue-900">Resolver Success</div>
            <div className="text-blue-700">Target: &gt; 99%</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={fetchSLOStatus}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh SLOs'}
          </button>
          
          <div className="text-xs text-gray-500">
            Auto-refresh: 30s
          </div>
        </div>
      </div>
    </div>
  );
}
