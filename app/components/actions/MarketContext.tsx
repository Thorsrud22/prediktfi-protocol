/**
 * Market Context Component
 * Displays lightweight market signals in TradePanel
 */

'use client';

import { useState, useEffect } from 'react';
import { loadSignalsClient, safeLocalStorageGet, safeLocalStorageSet, safeParse } from '../../lib/safe-fetch';

interface MarketSignal {
  type: 'polymarket' | 'fear_greed' | 'trend' | 'funding' | 'sentiment';
  label: string;
  value?: number;
  prob?: number;
  direction?: 'up' | 'down' | 'neutral';
  ts: string;
}

interface SignalsFeedData {
  items: MarketSignal[];
  updatedAt: string;
}

interface MarketContextProps {
  pair?: string; // e.g., "SOL/USDC"
  className?: string;
}

function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffSeconds = Math.floor((now - then) / 1000);
  
  if (diffSeconds < 60) return `${diffSeconds}s siden`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m siden`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}t siden`;
  return `${Math.floor(diffSeconds / 86400)}d siden`;
}

function SignalItem({ signal }: { signal: MarketSignal }) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'polymarket': return 'text-purple-600 dark:text-purple-400';
      case 'fear_greed': return 'text-orange-600 dark:text-orange-400';
      case 'funding': return 'text-blue-600 dark:text-blue-400';
      case 'trend': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'polymarket': return '🎯';
      case 'fear_greed': return '😱';
      case 'funding': return '💰';
      case 'trend': return '📈';
      default: return '📊';
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-xs">{getTypeIcon(signal.type)}</span>
      <span className={`font-medium ${getTypeColor(signal.type)}`}>
        {signal.label}
      </span>
      {signal.prob && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {Math.round(signal.prob * 100)}%
        </span>
      )}
    </div>
  );
}

export default function MarketContext({ pair, className = '' }: MarketContextProps) {
  const [signalsData, setSignalsData] = useState<SignalsFeedData | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [cachedSignals, setCachedSignals] = useState<{ etag?: string; payload?: any }>({});

  // Load visibility preference and cached signals from localStorage
  useEffect(() => {
    const visible = safeLocalStorageGet('market-context-visible', true, 'MarketContext');
    setIsVisible(visible);

    // Load cached signals data
    const cached = safeParse<{ etag?: string; payload?: any }>(localStorage.getItem('signalsCache'));
    if (cached) {
      setCachedSignals(cached);
      if (cached.payload) {
        setSignalsData(cached.payload);
      }
    }
  }, []);

  // Save visibility preference to localStorage
  const toggleVisibility = () => {
    const newVisible = !isVisible;
    setIsVisible(newVisible);
    safeLocalStorageSet('market-context-visible', newVisible, 'MarketContext');
  };

  // Fetch signals data with robust error handling
  useEffect(() => {
    if (!isVisible) return;

    const fetchSignals = async () => {
      try {
        // Use the new safe signals client
        const data = await loadSignalsClient();
        
        if (data) {
          setSignalsData(data);
          console.log('[MarketContext] Signals updated successfully');
        } else {
          console.log('[MarketContext] No signals data available');
        }
      } catch (error) {
        console.warn('[MarketContext] Unexpected error fetching signals:', error);
        // Silently fail - don't show errors to user
      }
    };

    fetchSignals();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchSignals, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isVisible, pair]);

  // Don't render if not visible or no data
  if (!isVisible || !signalsData || signalsData.items.length === 0) {
    return null;
  }

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Market context
          </h4>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            · oppdatert {formatTimeAgo(signalsData.updatedAt)}
          </span>
        </div>
        <button
          onClick={toggleVisibility}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          Skjul
        </button>
      </div>
      
      <div className="space-y-1">
        {signalsData.items.slice(0, 3).map((signal, index) => (
          <SignalItem key={`${signal.type}-${index}`} signal={signal} />
        ))}
      </div>
    </div>
  );
}
