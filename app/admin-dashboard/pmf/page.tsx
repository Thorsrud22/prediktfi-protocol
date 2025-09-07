/**
 * PMF Dashboard
 * /admin-dashboard/pmf
 * Product-Market Fit metrics and analytics
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Target, Users, Share2, MousePointer, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface PMFMetric {
  value: number;
  target: number;
  status: 'pass' | 'fail' | 'warning';
  percentage: number;
  description: string;
}

interface PMFData {
  period: string;
  overallStatus: 'excellent' | 'good' | 'warning' | 'critical';
  pmfScore: number;
  metrics: {
    clickSimRate: PMFMetric;
    simSignRate: PMFMetric;
    d7Retention: PMFMetric;
    socialSharing: PMFMetric;
    signalFollowing: PMFMetric;
  };
  summary: {
    passed: number;
    total: number;
    critical: number;
    warning: number;
  };
}

export default function PMFDashboard() {
  const [data, setData] = useState<PMFData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/analytics/pmf?period=${period}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage >= 100) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (percentage >= 80) {
      return <TrendingUp className="h-4 w-4 text-yellow-500" />;
    } else {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading PMF metrics...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center text-red-600">
              <XCircle className="h-5 w-5 mr-2" />
              <span>Error loading PMF data: {error}</span>
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">PMF Dashboard</h1>
          <p className="text-gray-600">
            Product-Market Fit metrics and analytics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <Badge className={getOverallStatusColor(data.overallStatus)}>
              {data.overallStatus.toUpperCase()}
            </Badge>
          </div>
          <div className="flex space-x-2">
            {(['daily', 'weekly', 'monthly'] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall PMF Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Overall PMF Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-6xl font-bold mb-2" style={{ color: data.pmfScore >= 80 ? '#10b981' : data.pmfScore >= 60 ? '#3b82f6' : data.pmfScore >= 40 ? '#f59e0b' : '#ef4444' }}>
              {data.pmfScore}%
            </div>
            <div className="text-lg text-gray-600 mb-4">
              {data.summary.passed} of {data.summary.total} metrics passing
            </div>
            <div className="flex justify-center space-x-4 text-sm">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span>{data.summary.passed} Passing</span>
              </div>
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                <span>{data.summary.warning} Warning</span>
              </div>
              <div className="flex items-center">
                <XCircle className="h-4 w-4 text-red-500 mr-1" />
                <span>{data.summary.critical} Critical</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PMF Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Click→Sim Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <MousePointer className="h-5 w-5 mr-2" />
                Click→Sim Rate
              </div>
              {getStatusIcon(data.metrics.clickSimRate.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {data.metrics.clickSimRate.percentage}%
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Target: {Math.round(data.metrics.clickSimRate.target * 100)}%</span>
              {getTrendIcon(data.metrics.clickSimRate.value, data.metrics.clickSimRate.target)}
            </div>
            <div className="text-xs text-gray-500">
              {data.metrics.clickSimRate.description}
            </div>
            <div className="mt-2">
              <Badge className={getStatusColor(data.metrics.clickSimRate.status)}>
                {data.metrics.clickSimRate.status.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Sim→Sign Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Sim→Sign Rate
              </div>
              {getStatusIcon(data.metrics.simSignRate.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {data.metrics.simSignRate.percentage}%
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Target: {Math.round(data.metrics.simSignRate.target * 100)}%</span>
              {getTrendIcon(data.metrics.simSignRate.value, data.metrics.simSignRate.target)}
            </div>
            <div className="text-xs text-gray-500">
              {data.metrics.simSignRate.description}
            </div>
            <div className="mt-2">
              <Badge className={getStatusColor(data.metrics.simSignRate.status)}>
                {data.metrics.simSignRate.status.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* D7 Retention */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                D7 Retention
              </div>
              {getStatusIcon(data.metrics.d7Retention.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {data.metrics.d7Retention.percentage}%
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Target: {Math.round(data.metrics.d7Retention.target * 100)}%</span>
              {getTrendIcon(data.metrics.d7Retention.value, data.metrics.d7Retention.target)}
            </div>
            <div className="text-xs text-gray-500">
              {data.metrics.d7Retention.description}
            </div>
            <div className="mt-2">
              <Badge className={getStatusColor(data.metrics.d7Retention.status)}>
                {data.metrics.d7Retention.status.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Social Sharing */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Share2 className="h-5 w-5 mr-2" />
                Social Sharing
              </div>
              {getStatusIcon(data.metrics.socialSharing.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {data.metrics.socialSharing}
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Target: {data.metrics.socialSharing.target}/week</span>
              {getTrendIcon(data.metrics.socialSharing.value, data.metrics.socialSharing.target)}
            </div>
            <div className="text-xs text-gray-500">
              {data.metrics.socialSharing.description}
            </div>
            <div className="mt-2">
              <Badge className={getStatusColor(data.metrics.socialSharing.status)}>
                {data.metrics.socialSharing.status.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Signal Following */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Signal Following
              </div>
              {getStatusIcon(data.metrics.signalFollowing.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {data.metrics.signalFollowing.percentage}%
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Target: {Math.round(data.metrics.signalFollowing.target * 100)}%</span>
              {getTrendIcon(data.metrics.signalFollowing.value, data.metrics.signalFollowing.target)}
            </div>
            <div className="text-xs text-gray-500">
              {data.metrics.signalFollowing.description}
            </div>
            <div className="mt-2">
              <Badge className={getStatusColor(data.metrics.signalFollowing.status)}>
                {data.metrics.signalFollowing.status.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.summary.critical > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  <div>
                    <div className="font-semibold text-red-900">Critical Issues</div>
                    <div className="text-sm text-red-700">
                      {data.summary.critical} metrics are failing. Immediate action required.
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {data.summary.warning > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                  <div>
                    <div className="font-semibold text-yellow-900">Warning Signs</div>
                    <div className="text-sm text-yellow-700">
                      {data.summary.warning} metrics need attention to prevent issues.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {data.summary.passed === data.summary.total && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <div>
                    <div className="font-semibold text-green-900">Excellent Performance</div>
                    <div className="text-sm text-green-700">
                      All PMF metrics are meeting targets. Great job!
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
