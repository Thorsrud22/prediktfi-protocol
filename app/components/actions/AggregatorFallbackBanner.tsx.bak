/**
 * Aggregator Fallback Banner
 * Shows warning when Jupiter is unavailable and trades are simulation-only
 */

'use client';

import { useState, useEffect } from 'react';

interface FallbackStatus {
  isActive: boolean;
  message: string;
  type: 'info' | 'warning' | 'error';
}

export default function AggregatorFallbackBanner() {
  const [status, setStatus] = useState<FallbackStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/aggregator/status');
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (error) {
        console.error('Failed to check aggregator status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !status || !status.isActive) {
    return null;
  }

  const getBannerStyles = () => {
    switch (status.type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    switch (status.type) {
      case 'warning':
        return '⚠️';
      case 'error':
        return '🚨';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`border rounded-lg p-4 mb-6 ${getBannerStyles()}`}>
      <div className="flex items-start gap-3">
        <div className="text-lg flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">
            {status.type === 'warning' ? 'Aggregator Fallback Mode' : 'System Status'}
          </h3>
          <p className="text-sm leading-relaxed">
            {status.message}
          </p>
          {status.type === 'warning' && (
            <div className="mt-2 text-xs opacity-90">
              <p>
                <strong>What this means:</strong> Your trades will be simulated but not executed. 
                This protects you from potential execution issues while Jupiter is unavailable.
              </p>
              <p className="mt-1">
                <strong>Receipt marking:</strong> All receipts will be marked as "simulate-only" 
                during this period for transparency.
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => setStatus(null)}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          title="Dismiss banner"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
