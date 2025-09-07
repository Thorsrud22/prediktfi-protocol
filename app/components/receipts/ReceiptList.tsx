'use client';

import { useState } from 'react';
import { ArrowTopRightOnSquareIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';

interface ReceiptItem {
  id: string;
  pair: string;
  side: 'BUY' | 'SELL';
  size: string;
  txSig: string;
  ts: string;
  pnl?: string;
}

interface ReceiptListProps {
  receipts: ReceiptItem[];
  nextCursor: string | null;
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onCopyTrade: (receipt: ReceiptItem) => void;
}

export default function ReceiptList({
  receipts,
  nextCursor,
  loading,
  loadingMore,
  onLoadMore,
  onCopyTrade
}: ReceiptListProps) {
  const getExplorerUrl = (txSig: string) => {
    // Use Solscan for mainnet, adjust as needed
    return `https://solscan.io/tx/${txSig}`;
  };

  const formatDate = (ts: string) => {
    return new Date(ts).toLocaleString('no-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading receipts...</span>
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Receipts Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          No executed trades have been recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {receipts.map((receipt) => (
        <div
          key={receipt.id}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Trade Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                  receipt.side === 'BUY' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {receipt.side}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {receipt.pair}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {receipt.size}
                </span>
                {receipt.pnl && (
                  <span className={`text-xs sm:text-sm font-medium ${
                    receipt.pnl.startsWith('-') 
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {receipt.pnl}
                  </span>
                )}
              </div>
              
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {formatDate(receipt.ts)}
              </div>
              
              <div className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-1 break-all sm:break-normal">
                {receipt.txSig.slice(0, 8)}...{receipt.txSig.slice(-8)}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onCopyTrade(receipt)}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm rounded-md transition-colors"
                title="Copy this trade"
              >
                <ClipboardDocumentIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Copy Trade</span>
                <span className="sm:hidden">Copy</span>
              </button>
              
              <a
                href={getExplorerUrl(receipt.txSig)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs sm:text-sm rounded-md transition-colors"
                title="View on Solscan"
              >
                <ArrowTopRightOnSquareIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Explorer</span>
              </a>
            </div>
          </div>
        </div>
      ))}

      {/* Load More Button */}
      {nextCursor && (
        <div className="mt-8 text-center">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors flex items-center gap-2 mx-auto"
          >
            {loadingMore ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
