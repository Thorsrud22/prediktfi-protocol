'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Play, 
  Square, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Zap
} from 'lucide-react';

interface ChaosTest {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  startTime?: string;
  endTime?: string;
  config: any;
}

interface ChaosTestResult {
  testId: string;
  success: boolean;
  message: string;
  timestamp: string;
  details?: any;
}

export function ChaosControlPanel() {
  const [tests, setTests] = useState<ChaosTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadTests();
    // Refresh every 10 seconds
    const interval = setInterval(loadTests, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadTests = async () => {
    try {
      const response = await fetch('/api/chaos/status');
      if (response.ok) {
        const data = await response.json();
        setTests(data.tests || []);
      } else {
        throw new Error('Failed to load chaos tests');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const controlTest = async (action: 'enable' | 'disable', testId: string, config?: any) => {
    setActionLoading(testId);
    try {
      const response = await fetch('/api/chaos/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, testId, config }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          loadTests(); // Refresh the list
        } else {
          setError(result.message || 'Failed to control test');
        }
      } else {
        throw new Error('Failed to control test');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setActionLoading(null);
    }
  };

  const getTestStatus = (test: ChaosTest) => {
    if (!test.enabled) return 'inactive';
    if (test.startTime && test.config?.duration) {
      const startTime = new Date(test.startTime).getTime();
      const duration = test.config.duration;
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) return 'expired';
    }
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-yellow-600 bg-yellow-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Zap className="w-4 h-4" />;
      case 'expired': return <Clock className="w-4 h-4" />;
      case 'inactive': return <Square className="w-4 h-4" />;
      default: return <Square className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--accent]"></div>
        <span className="ml-3 text-[--muted]">Loading chaos tests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[--text] mb-2">Failed to load tests</h3>
        <p className="text-[--muted] mb-4">{error}</p>
        <Button onClick={loadTests}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[--text]">Chaos Tests</h2>
          <p className="text-sm text-[--muted]">
            Control chaos testing scenarios to validate system resilience
          </p>
        </div>
        <Button onClick={loadTests} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Chaos testing can disrupt normal system operation. Only use in staging/development environments.
              Tests will automatically expire after their configured duration.
            </p>
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => {
          const status = getTestStatus(test);
          const isActionLoading = actionLoading === test.id;
          
          return (
            <Card key={test.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-[--text] mb-1">{test.name}</h3>
                  <p className="text-sm text-[--muted]">{test.description}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                  {getStatusIcon(status)}
                  <span className="ml-1 capitalize">{status}</span>
                </span>
              </div>

              {test.enabled && test.startTime && (
                <div className="mb-4 text-xs text-[--muted]">
                  Started: {new Date(test.startTime).toLocaleString()}
                  {test.config?.duration && (
                    <div>
                      Duration: {Math.round(test.config.duration / 1000)}s
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {!test.enabled ? (
                  <Button
                    onClick={() => controlTest('enable', test.id, test.config)}
                    disabled={isActionLoading}
                    size="sm"
                    className="flex-1"
                  >
                    {isActionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        Enable
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => controlTest('disable', test.id)}
                    disabled={isActionLoading}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    {isActionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <>
                        <Square className="w-4 h-4 mr-1" />
                        Disable
                      </>
                    )}
                  </Button>
                )}
              </div>

              {test.config && (
                <div className="mt-4 text-xs text-[--muted]">
                  <div className="font-medium mb-1">Configuration:</div>
                  <pre className="bg-[--background] p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(test.config, null, 2)}
                  </pre>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Available Tests Info */}
      <Card className="p-6">
        <h3 className="font-semibold text-[--text] mb-4">Available Chaos Tests</h3>
        <div className="space-y-3 text-sm">
          <div>
            <strong>Disable Aggregator:</strong> Temporarily disables Jupiter aggregator to test fallback behavior
          </div>
          <div>
            <strong>Force Simulation Only:</strong> Forces all intents to simulation-only mode
          </div>
          <div>
            <strong>Test Idempotency:</strong> Tests idempotency by allowing duplicate requests
          </div>
        </div>
      </Card>
    </div>
  );
}
