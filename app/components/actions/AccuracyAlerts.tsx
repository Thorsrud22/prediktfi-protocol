/**
 * Accuracy Alerts component for dashboard red light system
 */

'use client';

import { useState, useEffect } from 'react';

interface AccuracyAlert {
  pair: string;
  period: '7d';
  currentAccuracy: number;
  threshold: number;
  alertLevel: 'warning' | 'critical';
  message: string;
}

export default function AccuracyAlerts() {
  const [alerts, setAlerts] = useState<AccuracyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('/api/intents/accuracy?alerts=true');
        const data = await response.json();
        
        if (data.success) {
          setAlerts(data.alerts);
        }
      } catch (error) {
        console.error('Failed to fetch accuracy alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    
    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Checking accuracy alerts...</span>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-700 font-medium">
            All trading pairs within accuracy thresholds
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-6">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className={`border rounded-lg p-4 ${
            alert.alertLevel === 'critical'
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-3 h-3 rounded-full ${
                alert.alertLevel === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
              }`}
            ></div>
            <span
              className={`text-sm font-medium ${
                alert.alertLevel === 'critical' ? 'text-red-700' : 'text-yellow-700'
              }`}
            >
              {alert.alertLevel === 'critical' ? '🚨 Critical Alert' : '⚠️ Warning'}
            </span>
            <span className="text-sm text-gray-600">•</span>
            <span className="text-sm font-medium text-gray-700">{alert.pair}</span>
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            {alert.message}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>
              Current: {alert.currentAccuracy.toFixed(1)}%
            </span>
            <span>
              Threshold: {alert.threshold}%
            </span>
            <span>
              Period: {alert.period}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
