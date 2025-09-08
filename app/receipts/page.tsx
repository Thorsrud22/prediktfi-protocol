'use client';

import { useState, useEffect } from 'react';
import ReceiptList from '../components/receipts/ReceiptList';
import PnLWidget from '../components/actions/PnLWidget';

interface ReceiptItem {
  id: string;
  pair: string;
  side: 'BUY' | 'SELL';
  size: string;
  txSig: string;
  ts: string;
  pnl?: string;
}

interface ReceiptsResponse {
  items: ReceiptItem[];
  nextCursor: string | null;
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReceipts = async (cursor?: string, append = false) => {
    try {
      const url = new URL('/api/public/receipts', window.location.origin);
      if (cursor) {
        url.searchParams.set('cursor', cursor);
      }
      
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch receipts: ${response.status}`);
      }
      
      const data: ReceiptsResponse = await response.json();
      
      if (append) {
        setReceipts(prev => [...prev, ...data.items]);
      } else {
        setReceipts(data.items);
      }
      setNextCursor(data.nextCursor);
      setError(null);
    } catch (err) {
      console.error('Error fetching receipts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch receipts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      setLoadingMore(true);
      fetchReceipts(nextCursor, true);
    }
  };

  const handleCopyTrade = (receipt: ReceiptItem) => {
    // Create copy trade URL with template data
    const templateData = {
      pair: receipt.pair,
      side: receipt.side,
      size: receipt.size,
      rationale: `Copy trade from executed receipt ${receipt.id}`,
      source: 'receipts_page'
    };
    
    const templateId = btoa(JSON.stringify(templateData));
    const copyTradeUrl = `/copy-trade/${templateId}`;
    
    // Store template data in localStorage for the copy trade page
    localStorage.setItem('copyTradeData', JSON.stringify(templateData));
    
    // Navigate to copy trade page
    window.open(copyTradeUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading receipts...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Error Loading Receipts
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => fetchReceipts()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Latest Executed Trades
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time feed of executed trading receipts from the community
          </p>
        </div>

        {/* Copy Trade CTA Banner */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                🚀 Copy Successful Trades
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                See a trade you like? Click "Copy Trade" to replicate the strategy with your own risk settings.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Pre-filled with original strategy
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Customize position size & risk
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  One-click to ACTIONS
                </span>
              </div>
            </div>
            <div className="ml-6">
              <a
                href="/advisor/actions"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Go to ACTIONS
              </a>
            </div>
          </div>
        </div>

        {/* P&L Widget */}
        <div className="mb-8">
          <PnLWidget />
        </div>

        {/* Receipts List */}
        <ReceiptList
          receipts={receipts}
          nextCursor={nextCursor}
          loading={loading}
          loadingMore={loadingMore}
          onLoadMore={handleLoadMore}
          onCopyTrade={handleCopyTrade}
        />
      </div>
    </div>
  );
}
