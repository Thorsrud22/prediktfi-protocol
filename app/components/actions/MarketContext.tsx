/**
 * Market Context Component
 * Displays lightweight market signals in TradePanel
 */

'use client';

import { useState, useEffect } from 'react';

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
  const [lastFetch, setLastFetch] = useState<string>('');

  // Load visibility preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('market-context-visible');
    if (saved !== null) {
      setIsVisible(JSON.parse(saved));
    }
  }, []);

  // Save visibility preference to localStorage
  const toggleVisibility = () => {
    const newVisible = !isVisible;
    setIsVisible(newVisible);
    localStorage.setItem('market-context-visible', JSON.stringify(newVisible));
  };

  // Fetch signals data
  useEffect(() => {
    if (!isVisible) return;

    const fetchSignals = async () => {
      try {
        const url = pair 
          ? `/api/public/signals?pair=${encodeURIComponent(pair)}`
          : '/api/public/signals';
        
        const headers: HeadersInit = {};
        if (lastFetch) {
          headers['If-None-Match'] = lastFetch;
        }

        const response = await fetch(url, { headers });
        
        if (response.status === 304) {
          // Data unchanged, no need to update
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setSignalsData(data);
          
          // Store ETag for next request
          const etag = response.headers.get('ETag');
          if (etag) {
            setLastFetch(etag);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch market signals:', error);
        // Silently fail - don't show errors to user
      }
    };

    fetchSignals();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchSignals, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isVisible, pair, lastFetch]);

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
