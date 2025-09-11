'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';
import { getAlertColor, getAlertIcon } from '../../lib/quality/alerts-client';

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

interface AccuracyAlertBannerProps {
  className?: string;
  onDismiss?: () => void;
}

export function AccuracyAlertBanner({ className, onDismiss }: AccuracyAlertBannerProps) {
  const [alerts, setAlerts] = useState<AccuracyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/quality/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Failed to load accuracy alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (loading || dismissed || alerts.length === 0) {
    return null;
  }

  // Get the most critical alert
  const criticalAlert = alerts.find(a => a.severity === 'critical') || alerts[0];

  return (
    <div className={`border-l-4 ${getAlertColor(criticalAlert.severity)} ${className}`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-lg mr-2">
              {getAlertIcon(criticalAlert.severity)}
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-[--text]">
                Quality Alert: {criticalAlert.severity.toUpperCase()}
              </h3>
              <button
                onClick={handleDismiss}
                className="text-[--muted] hover:text-[--text] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="mt-1 text-sm text-[--text]">
              {criticalAlert.message}
            </p>
            
            {criticalAlert.pair && (
              <p className="mt-1 text-xs text-[--muted]">
                Affected pair: {criticalAlert.pair}
              </p>
            )}
            
            <div className="mt-2 flex items-center space-x-4">
              <a
                href="/quality"
                className="inline-flex items-center text-xs font-medium text-[--accent] hover:text-[--accent]/80"
              >
                View Quality Dashboard
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
              
              <span className="text-xs text-[--muted]">
                {new Date(criticalAlert.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
