/**
 * Receipt Card Component
 * Beautiful receipt cards with social proof elements
 */

'use client';

import { useState } from 'react';
import { CopyTradingService } from '../../lib/intents/copy-trading';
import { PMFTracker } from '../../lib/analytics/pmf-tracker';

interface ReceiptCardProps {
  receipt: {
    id: string;
    intentId: string;
    status: 'simulated' | 'executed' | 'failed';
    createdAt: Date;
    simJson?: string;
    notes?: string;
  };
  walletId?: string;
  onShare?: (shareUrl: string) => void;
  onViewExplorer?: (txHash: string) => void;
}

export default function ReceiptCard({ receipt, walletId, onShare, onViewExplorer }: ReceiptCardProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const parseSimData = () => {
    try {
      if (!receipt.simJson) return {};
      try {
        return JSON.parse(receipt.simJson);
      } catch (error) {
        console.warn('[ReceiptCard] Invalid simJson data:', error);
        return {};
      }
    } catch {
      return {};
    }
  };

  const simData = parseSimData();
  const isSuccessful = receipt.status === 'simulated' || receipt.status === 'executed';
  const isExecuted = receipt.status === 'executed';

  const handleShare = async () => {
    if (shareUrl) {
      // Track social sharing
      if (walletId) {
        await PMFTracker.trackSocialShare(walletId, receipt.intentId, 'copy_trade', shareUrl);
      }
      onShare?.(shareUrl);
      return;
    }

    setIsSharing(true);
    try {
      // Create template from receipt
      const template = CopyTradingService.createTemplate({
        side: simData.side || 'BUY',
        rationale: simData.rationale || 'Successful trading strategy',
        confidence: simData.confidence || 0.8,
        expectedDur: simData.expectedDur || '14d',
        guardsJson: simData.guards || {}
      });

      // Generate share URL
      const url = CopyTradingService.generateShareUrl(template.id);
      setShareUrl(url);
      
      // Track social sharing
      if (walletId) {
        await PMFTracker.trackSocialShare(walletId, receipt.intentId, 'copy_trade', url);
      }
      
      onShare?.(url);
    } catch (error) {
      console.error('Failed to create share URL:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const getStatusColor = () => {
    switch (receipt.status) {
      case 'simulated':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'executed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (receipt.status) {
      case 'simulated':
        return '🧪';
      case 'executed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '⏳';
    }
  };

  const formatAmount = (amount: number, currency: string = 'USDC') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getStatusIcon()}</div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {simData.side || 'BUY'} SOL/USDC
              </h3>
              <p className="text-sm text-gray-600">
                {formatDate(receipt.createdAt)}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
            {receipt.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Trade Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-500">Position Size</div>
            <div className="font-semibold text-gray-900">
              {simData.sizePct ? `${simData.sizePct}%` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Expected Value</div>
            <div className="font-semibold text-gray-900">
              {simData.expectedValue ? formatAmount(simData.expectedValue) : 'N/A'}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {simData.performance && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Expected Return</div>
                <div className={`font-semibold ${simData.performance.expectedReturn > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {simData.performance.expectedReturn > 0 ? '+' : ''}{simData.performance.expectedReturn?.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-gray-500">Worst Case</div>
                <div className="font-semibold text-red-600">
                  {simData.performance.worstCase?.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-gray-500">Confidence</div>
                <div className="font-semibold text-blue-600">
                  {Math.round((simData.confidence || 0.8) * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rationale */}
        {simData.rationale && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Strategy</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {simData.rationale}
            </p>
          </div>
        )}

        {/* Risk Guards */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <h4 className="font-medium text-yellow-900 mb-2">Risk Management</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-yellow-700">Daily Loss Cap:</span> {simData.guards?.dailyLossCapPct || 'N/A'}%
            </div>
            <div>
              <span className="text-yellow-700">Max Slippage:</span> {simData.guards?.maxSlippageBps || 'N/A'} bps
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {isSuccessful && (
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSharing ? 'Creating...' : 'Share Strategy'}
            </button>
          )}
          
          {isExecuted && simData.txHash && (
            <button
              onClick={() => onViewExplorer?.(simData.txHash)}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              View on Explorer
            </button>
          )}

          <button
            onClick={() => navigator.clipboard.writeText(receipt.intentId)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            title="Copy Intent ID"
          >
            📋
          </button>
        </div>

        {/* Share URL Display */}
        {shareUrl && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-800 mb-2">Share this strategy:</div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-2 py-1 text-xs bg-white border border-green-300 rounded"
              />
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Intent ID: {receipt.intentId.slice(0, 8)}...</span>
          <span>Predikt Protocol</span>
        </div>
      </div>
    </div>
  );
}
