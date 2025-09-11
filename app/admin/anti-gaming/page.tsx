/**
 * Anti-Gaming Admin Dashboard
 * Shows spam detection metrics and violation patterns
 */

import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Anti-Gaming Dashboard | Predikt Admin',
  description: 'Monitor spam detection and anti-gaming measures.',
};

interface SpamDetectionMetrics {
  totalViolations: number;
  violationsByType: {
    burst: number;
    similar: number;
    rateLimit: number;
    notional: number;
  };
  topOffenders: Array<{
    walletId: string;
    violationCount: number;
    lastViolation: string;
    types: string[];
  }>;
  recentPatterns: Array<{
    timestamp: string;
    type: string;
    walletId: string;
    description: string;
  }>;
  timeRange: {
    start: string;
    end: string;
  };
}

async function getSpamDetectionMetrics(): Promise<SpamDetectionMetrics | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/analytics/spam-detection?days=7`, {
      headers: {
        'x-ops-signature': process.env.OPS_SECRET || 'test'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching spam detection metrics:', error);
    return null;
  }
}

function MetricCard({ title, value, color = 'blue' }: { title: string; value: number; color?: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    green: 'bg-green-50 border-green-200 text-green-800'
  };
  
  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <h3 className="text-sm font-medium opacity-75">{title}</h3>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}

function ViolationTypeCard({ type, count, description }: { type: string; count: number; description: string }) {
  const getColor = (type: string) => {
    switch (type) {
      case 'burst': return 'red';
      case 'similar': return 'yellow';
      case 'rateLimit': return 'blue';
      case 'notional': return 'green';
      default: return 'blue';
    }
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900 capitalize">{type} Violations</h4>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          getColor(type) === 'red' ? 'bg-red-100 text-red-800' :
          getColor(type) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
          getColor(type) === 'blue' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {count}
        </span>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

function TopOffenderRow({ offender, rank }: { offender: any; rank: number }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
          {rank}
        </div>
        <div>
          <p className="font-mono text-sm text-gray-900">
            {offender.walletId.substring(0, 8)}...{offender.walletId.substring(offender.walletId.length - 4)}
          </p>
          <p className="text-xs text-gray-500">
            Last: {new Date(offender.lastViolation).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">{offender.violationCount}</p>
        <p className="text-xs text-gray-500">
          {offender.types.slice(0, 2).join(', ')}
          {offender.types.length > 2 && ` +${offender.types.length - 2}`}
        </p>
      </div>
    </div>
  );
}

function RecentPatternRow({ pattern }: { pattern: any }) {
  const getTypeColor = (type: string) => {
    if (type.includes('Burst')) return 'text-red-600 bg-red-50';
    if (type.includes('Spam')) return 'text-yellow-600 bg-yellow-50';
    if (type.includes('limit')) return 'text-blue-600 bg-blue-50';
    if (type.includes('notional')) return 'text-green-600 bg-green-50';
    return 'text-gray-600 bg-gray-50';
  };
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(pattern.type)}`}>
            {pattern.type.split(' ')[0]}
          </span>
          <span className="font-mono text-xs text-gray-500">
            {pattern.walletId.substring(0, 8)}...
          </span>
          <span className="text-xs text-gray-500">
            {new Date(pattern.timestamp).toLocaleString()}
          </span>
        </div>
        <p className="text-sm text-gray-700 mt-1">{pattern.description}</p>
      </div>
    </div>
  );
}

export default async function AntiGamingDashboard() {
  const metrics = await getSpamDetectionMetrics();
  
  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Anti-Gaming Dashboard</h1>
          <p className="text-gray-600">Unable to load metrics. Please check your configuration.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Anti-Gaming Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitoring spam detection and violation patterns for the last 7 days
          </p>
        </div>
        
        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard 
            title="Total Violations" 
            value={metrics.totalViolations} 
            color="red"
          />
          <MetricCard 
            title="Burst Patterns" 
            value={metrics.violationsByType.burst} 
            color="red"
          />
          <MetricCard 
            title="Similar Predictions" 
            value={metrics.violationsByType.similar} 
            color="yellow"
          />
          <MetricCard 
            title="Rate Limit Hits" 
            value={metrics.violationsByType.rateLimit} 
            color="blue"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Violation Types */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Violation Types</h2>
            <div className="space-y-4">
              <ViolationTypeCard
                type="burst"
                count={metrics.violationsByType.burst}
                description="Multiple predictions in short time window"
              />
              <ViolationTypeCard
                type="similar"
                count={metrics.violationsByType.similar}
                description="Similar questions or probabilities"
              />
              <ViolationTypeCard
                type="rateLimit"
                count={metrics.violationsByType.rateLimit}
                description="Exceeded hourly/daily/weekly limits"
              />
              <ViolationTypeCard
                type="notional"
                count={metrics.violationsByType.notional}
                description="Below minimum notional thresholds"
              />
            </div>
          </div>
          
          {/* Top Offenders */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Offenders</h2>
            {metrics.topOffenders.length > 0 ? (
              <div className="space-y-0">
                {metrics.topOffenders.map((offender, index) => (
                  <TopOffenderRow 
                    key={offender.walletId} 
                    offender={offender} 
                    rank={index + 1} 
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No violations detected</p>
            )}
          </div>
        </div>
        
        {/* Recent Patterns */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Violation Patterns</h2>
          {metrics.recentPatterns.length > 0 ? (
            <div className="space-y-0 max-h-96 overflow-y-auto">
              {metrics.recentPatterns.map((pattern, index) => (
                <RecentPatternRow key={index} pattern={pattern} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent violations</p>
          )}
        </div>
        
        {/* Time Range Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Data from {new Date(metrics.timeRange.start).toLocaleDateString()} to{' '}
          {new Date(metrics.timeRange.end).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
