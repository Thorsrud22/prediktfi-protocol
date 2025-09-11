'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { X, Gift, Clock } from 'lucide-react';

interface TrialStatus {
  isOnTrial: boolean;
  trialEndsAt?: string;
  timeRemaining?: number;
}

interface ProTrialBannerProps {
  onDismiss?: () => void;
  className?: string;
}

export function ProTrialBanner({ onDismiss, className }: ProTrialBannerProps) {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    loadTrialStatus();
  }, []);

  const loadTrialStatus = async () => {
    try {
      const response = await fetch('/api/trial/status');
      const data = await response.json();
      setTrialStatus(data);
    } catch (error) {
      console.error('Failed to load trial status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (loading || dismissed || !trialStatus?.isOnTrial) {
    return null;
  }

  const formatTimeRemaining = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m remaining`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m remaining`;
  };

  return (
    <div className={`bg-gradient-to-r from-teal-500 to-orange-500 text-white p-4 rounded-lg relative ${className}`}>
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-white/80 hover:text-white"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <Gift className="w-6 h-6" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-sm">
            🎉 Pro Trial Active!
          </h3>
          <p className="text-xs text-white/90">
            You have access to all Pro features
            {trialStatus.timeRemaining && (
              <span className="ml-2">
                • <Clock className="w-3 h-3 inline mr-1" />
                {formatTimeRemaining(trialStatus.timeRemaining)}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            onClick={() => window.open('/pricing', '_blank')}
          >
            Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  );
}
