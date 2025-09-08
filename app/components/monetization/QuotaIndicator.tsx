'use client';

import { useState, useEffect } from 'react';
import { Progress } from '../ui/Progress';
import { Zap, Clock } from 'lucide-react';

interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
}

interface SubscriptionInfo {
  tier: 'free' | 'pro';
  isPro: boolean;
  isTrial: boolean;
  quotas: {
    intentsWeekly: QuotaInfo;
    insightsDaily: QuotaInfo;
    quotesDaily: QuotaInfo;
  };
}

interface QuotaIndicatorProps {
  quotaType: 'intents' | 'insights' | 'quotes';
  className?: string;
  showLabel?: boolean;
}

export function QuotaIndicator({ quotaType, className, showLabel = true }: QuotaIndicatorProps) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !subscription) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
        {showLabel && <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>}
      </div>
    );
  }

  const quota = subscription.quotas[`${quotaType}${quotaType === 'intents' ? 'Weekly' : 'Daily'}` as keyof typeof subscription.quotas];
  const percentage = (quota.used / quota.limit) * 100;
  const isNearLimit = percentage >= 80;
  const isExhausted = quota.remaining <= 0;

  const quotaTypeLabels = {
    intents: 'Intents',
    insights: 'Insights',
    quotes: 'Quotes',
  };

  const periodLabels = {
    intents: 'week',
    insights: 'day',
    quotes: 'day',
  };

  const getProgressColor = () => {
    if (isExhausted) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getIcon = () => {
    if (subscription.isPro) return <Zap className="w-3 h-3 text-purple-500" />;
    if (isExhausted) return <Clock className="w-3 h-3 text-red-500" />;
    return null;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {getIcon()}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs">
          {showLabel && (
            <span className="text-[--muted] truncate">
              {quotaTypeLabels[quotaType]}
            </span>
          )}
          <span className={`font-medium ${
            isExhausted ? 'text-red-500' : 
            isNearLimit ? 'text-yellow-600' : 
            'text-[--text]'
          }`}>
            {quota.used} / {quota.limit}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
          <div 
            className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        
        {quota.remaining > 0 && (
          <div className="text-xs text-[--muted] mt-1">
            {quota.remaining} remaining this {periodLabels[quotaType]}
          </div>
        )}
        
        {isExhausted && (
          <div className="text-xs text-red-500 mt-1">
            Quota exhausted - upgrade to Pro for more
          </div>
        )}
      </div>
    </div>
  );
}
