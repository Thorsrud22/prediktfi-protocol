/**
 * P2A Monitoring Dashboard
 * Real-time monitoring of synthetic tests and SLO compliance
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface MonitoringData {
  status: 'healthy' | 'warning' | 'critical' | 'error';
  timestamp: string;
  features: {
    actions: boolean;
    embed: boolean;
  };
  synthetic: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    successRate: number;
    consecutiveFailures: number;
    lastTestTime: string | null;
    p95Latency: number;
    averageLatency: number;
  };
  slo: {
    totalAlerts: number;
    criticalAlerts: number;
    warningAlerts: number;
    lastAlertTime: string | null;
    activeViolations: number;
  };
  simulation: {
    totalSimulations: number;
    averageLatency: number;
    p95Latency: number;
    maxLatency: number;
    minLatency: number;
  };
  recentTests: Array<{
    intentId: string;
    status: string;
    timestamp: string;
    notes: string;
  }>;
  recentAlerts: Array<{
    intentId: string;
    timestamp: string;
    notes: string;
  }>;
}

export default function MonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/monitoring/dashboard');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const formatLatency = (latency: number) => {
    return `${latency.toFixed(0)}ms`;
  };

  if (loading && !data) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading monitoring data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center text-red-600">
              <XCircle className="h-5 w-5 mr-2" />
              <span>Error loading monitoring data: {error}</span>
            </div>
            <Button onClick={fetchData} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">P2A Monitoring Dashboard</h1>
          <p className="text-gray-600">
            Real-time monitoring of synthetic tests and SLO compliance
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon(data.status)}
            <Badge className={getStatusColor(data.status)}>
              {data.status.toUpperCase()}
            </Badge>
          </div>
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Last Refresh */}
      {lastRefresh && (
        <div className="text-sm text-gray-500 flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          Last updated: {lastRefresh.toLocaleString()}
        </div>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Synthetic Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.synthetic.totalTests}</div>
            <div className="text-sm text-gray-600">
              {data.synthetic.passedTests} passed, {data.synthetic.failedTests} failed
            </div>
            <div className="text-sm text-gray-600">
              Success rate: {data.synthetic.successRate.toFixed(1)}%
            </div>
            {data.synthetic.consecutiveFailures > 0 && (
              <div className="text-sm text-red-600">
                {data.synthetic.consecutiveFailures} consecutive failures
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SLO Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.slo.totalAlerts}</div>
            <div className="text-sm text-gray-600">
              {data.slo.criticalAlerts} critical, {data.slo.warningAlerts} warning
            </div>
            <div className="text-sm text-gray-600">
              Active violations: {data.slo.activeViolations}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Simulations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.simulation.totalSimulations}</div>
            <div className="text-sm text-gray-600">
              P95 latency: {formatLatency(data.simulation.p95Latency)}
            </div>
            <div className="text-sm text-gray-600">
              Avg latency: {formatLatency(data.simulation.averageLatency)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Synthetic Test Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Synthetic Test Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">P95 Latency</div>
                <div className="text-lg font-semibold">
                  {formatLatency(data.synthetic.p95Latency)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Average Latency</div>
                <div className="text-lg font-semibold">
                  {formatLatency(data.synthetic.averageLatency)}
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Last Test</div>
              <div className="text-sm">
                {formatTimestamp(data.synthetic.lastTestTime)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SLO Compliance */}
        <Card>
          <CardHeader>
            <CardTitle>SLO Compliance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Critical Alerts</div>
                <div className="text-lg font-semibold text-red-600">
                  {data.slo.criticalAlerts}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Warning Alerts</div>
                <div className="text-lg font-semibold text-yellow-600">
                  {data.slo.warningAlerts}
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Last Alert</div>
              <div className="text-sm">
                {formatTimestamp(data.slo.lastAlertTime)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Synthetic Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentTests.length === 0 ? (
                <div className="text-sm text-gray-500">No recent tests</div>
              ) : (
                data.recentTests.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      {test.status === 'simulated' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-mono">{test.intentId}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTimestamp(test.timestamp)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent SLO Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentAlerts.length === 0 ? (
                <div className="text-sm text-gray-500">No recent alerts</div>
              ) : (
                data.recentAlerts.map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-mono">{alert.intentId}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTimestamp(alert.timestamp)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
