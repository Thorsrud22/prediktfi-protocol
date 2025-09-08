'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  BarChart3,
  Target
} from 'lucide-react';

interface QualityMetrics {
  simAccuracy7d: number;
  simAccuracy30d: number;
  quoteFillDeviation: {
    pair: string;
    sizeRange: string;
    avgDeviationBps: number;
    sampleCount: number;
  }[];
  simToSignRate: number;
  executeFailRate: number;
  totalSimulations: number;
  totalSigns: number;
  totalExecutions: number;
  totalFailures: number;
}

interface AccuracyAlert {
  id: string;
  type: 'accuracy_threshold';
  severity: 'warning' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  pair?: string;
  createdAt: string;
}

interface QualityData {
  metrics: QualityMetrics;
  alerts: AccuracyAlert[];
  timestamp: string;
}

export function QualityDashboard() {
  const [data, setData] = useState<QualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/quality/dashboard');
      if (!response.ok) {
        throw new Error('Failed to load quality data');
      }
      
      const qualityData = await response.json();
      setData(qualityData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--accent]"></div>
        <span className="ml-3 text-[--muted]">Loading quality metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[--text] mb-2">Failed to load data</h3>
        <p className="text-[--muted] mb-4">{error}</p>
        <Button onClick={loadData}>Try Again</Button>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, alerts } = data;

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[--text]">Quality Metrics</h2>
          <p className="text-sm text-[--muted]">
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[--text] flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
            Active Alerts ({alerts.length})
          </h3>
          {alerts.map((alert) => (
            <Card key={alert.id} className={`p-4 border-l-4 ${
              alert.severity === 'critical' 
                ? 'border-red-500 bg-red-50' 
                : 'border-yellow-500 bg-yellow-50'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">
                      {alert.severity === 'critical' ? '🚨' : '⚠️'}
                    </span>
                    <span className="font-semibold text-[--text]">
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[--text] mb-1">{alert.message}</p>
                  <p className="text-sm text-[--muted]">
                    {alert.pair && `Pair: ${alert.pair} • `}
                    Created: {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Simulation Accuracy 7d */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[--text]">7-Day Accuracy</h3>
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-[--text] mb-2">
            {metrics.simAccuracy7d.toFixed(1)}%
          </div>
          <div className="flex items-center text-sm">
            {metrics.simAccuracy7d >= 70 ? (
              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={metrics.simAccuracy7d >= 70 ? 'text-green-600' : 'text-red-600'}>
              {metrics.simAccuracy7d >= 70 ? 'Good' : 'Below Threshold'}
            </span>
          </div>
        </Card>

        {/* Simulation Accuracy 30d */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[--text]">30-Day Accuracy</h3>
            <BarChart3 className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-[--text] mb-2">
            {metrics.simAccuracy30d.toFixed(1)}%
          </div>
          <div className="flex items-center text-sm">
            {metrics.simAccuracy30d >= 75 ? (
              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={metrics.simAccuracy30d >= 75 ? 'text-green-600' : 'text-red-600'}>
              {metrics.simAccuracy30d >= 75 ? 'Good' : 'Below Threshold'}
            </span>
          </div>
        </Card>

        {/* Sim to Sign Rate */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[--text]">Sim → Sign Rate</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-[--text] mb-2">
            {metrics.simToSignRate.toFixed(1)}%
          </div>
          <div className="text-sm text-[--muted]">
            {metrics.totalSigns} signs / {metrics.totalSimulations} sims
          </div>
        </Card>

        {/* Execute Fail Rate */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[--text]">Execute Fail Rate</h3>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-[--text] mb-2">
            {metrics.executeFailRate.toFixed(1)}%
          </div>
          <div className="text-sm text-[--muted]">
            {metrics.totalFailures} failures / {metrics.totalExecutions} executions
          </div>
        </Card>
      </div>

      {/* Quote-Fill Deviation Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[--text] mb-4">Quote-Fill Deviation by Pair</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[--border]">
                <th className="text-left py-2 text-[--text] font-medium">Pair</th>
                <th className="text-left py-2 text-[--text] font-medium">Size Range</th>
                <th className="text-left py-2 text-[--text] font-medium">Avg Deviation</th>
                <th className="text-left py-2 text-[--text] font-medium">Samples</th>
                <th className="text-left py-2 text-[--text] font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics.quoteFillDeviation.map((deviation, index) => (
                <tr key={index} className="border-b border-[--border]">
                  <td className="py-2 text-[--text] font-mono">{deviation.pair}</td>
                  <td className="py-2 text-[--text]">{deviation.sizeRange}</td>
                  <td className="py-2 text-[--text]">
                    {deviation.avgDeviationBps.toFixed(1)} bps
                  </td>
                  <td className="py-2 text-[--text]">{deviation.sampleCount}</td>
                  <td className="py-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      deviation.avgDeviationBps <= 100
                        ? 'bg-green-100 text-green-800'
                        : deviation.avgDeviationBps <= 200
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {deviation.avgDeviationBps <= 100 ? 'Good' : 
                       deviation.avgDeviationBps <= 200 ? 'Warning' : 'Critical'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
