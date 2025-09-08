'use client';

import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { CheckCircle, Clock, Zap, Star } from 'lucide-react';

interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
}

interface SubscriptionInfo {
  tier: 'free' | 'pro';
  isPro: boolean;
  isTrial: boolean;
  trialEndsAt?: string;
  quotas: {
    intentsWeekly: QuotaInfo;
    insightsDaily: QuotaInfo;
    quotesDaily: QuotaInfo;
  };
}

interface QuotaWallProps {
  quotaType: 'intents' | 'insights' | 'quotes';
  onUpgrade?: () => void;
  onTrialStart?: () => void;
  className?: string;
}

export function QuotaWall({ quotaType, onUpgrade, onTrialStart, className }: QuotaWallProps) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialEligible, setTrialEligible] = useState(false);

  useEffect(() => {
    loadSubscription();
    checkTrialEligibility();
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

  const checkTrialEligibility = async () => {
    try {
      const response = await fetch('/api/trial/eligibility');
      const data = await response.json();
      setTrialEligible(data.canStart);
    } catch (error) {
      console.error('Failed to check trial eligibility:', error);
    }
  };

  const startTrial = async () => {
    try {
      const response = await fetch('/api/trial/start', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        onTrialStart?.();
        loadSubscription(); // Refresh subscription status
      } else {
        alert(data.message || 'Failed to start trial');
      }
    } catch (error) {
      console.error('Failed to start trial:', error);
      alert('Failed to start trial. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--accent] mx-auto"></div>
        <p className="mt-2 text-[--muted]">Loading...</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <p className="text-[--muted]">Unable to load subscription status</p>
      </div>
    );
  }

  const quota = subscription.quotas[`${quotaType}${quotaType === 'intents' ? 'Weekly' : 'Daily'}` as keyof typeof subscription.quotas];
  const isExhausted = quota.remaining <= 0;

  if (subscription.isPro || !isExhausted) {
    return null; // Don't show wall if user is Pro or has quota remaining
  }

  const quotaTypeLabels = {
    intents: 'intents',
    insights: 'insights',
    quotes: 'quotes',
  };

  const quotaTypeLabelsSingular = {
    intents: 'intent',
    insights: 'insight',
    quotes: 'quote',
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-[--accent] to-[--accent]/80 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-xl font-semibold text-[--text] mb-2">
          {quotaTypeLabels[quotaType].charAt(0).toUpperCase() + quotaTypeLabels[quotaType].slice(1)} Quota Exhausted
        </h3>
        
        <p className="text-[--muted] mb-4">
          You've used all {quota.limit} {quotaTypeLabels[quotaType]} for this {quotaType === 'intents' ? 'week' : 'day'}.
          {quotaType === 'intents' ? ' Upgrade to Pro for 30 intents per week!' : ' Upgrade to Pro for more!'}
        </p>

        <div className="bg-[--background] rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[--muted]">Used this {quotaType === 'intents' ? 'week' : 'day'}</span>
            <span className="font-medium">{quota.used} / {quota.limit}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-[--accent] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(quota.used / quota.limit) * 100}%` }}
            />
          </div>
        </div>

        {/* Pro Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center space-x-3 p-3 bg-[--background] rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div className="text-left">
              <p className="font-medium text-[--text]">30 Intents/Week</p>
              <p className="text-sm text-[--muted]">6x more than Free</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-[--background] rounded-lg">
            <Zap className="w-5 h-5 text-yellow-500" />
            <div className="text-left">
              <p className="font-medium text-[--text]">Faster Quotes</p>
              <p className="text-sm text-[--muted]">Priority processing</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-[--background] rounded-lg">
            <Star className="w-5 h-5 text-teal-500" />
            <div className="text-left">
              <p className="font-medium text-[--text]">Advanced Features</p>
              <p className="text-sm text-[--muted]">Pro-only tools</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-[--background] rounded-lg">
            <Clock className="w-5 h-5 text-blue-500" />
            <div className="text-left">
              <p className="font-medium text-[--text]">No Rate Limits</p>
              <p className="text-sm text-[--muted]">Unlimited access</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {trialEligible && (
            <Button
              onClick={startTrial}
              variant="outline"
              className="w-full"
            >
              🎁 Start 24h Pro Trial (Free)
            </Button>
          )}
          
          <Button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-[--accent] to-[--accent]/80"
          >
            Upgrade to Pro - $9.99/month
          </Button>
        </div>

        <p className="text-xs text-[--muted] mt-4">
          Cancel anytime • 30-day money-back guarantee
        </p>
      </div>
    </Card>
  );
}
