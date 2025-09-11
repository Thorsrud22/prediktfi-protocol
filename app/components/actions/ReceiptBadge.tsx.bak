/**
 * Receipt Badge component for sharing trading results
 */

'use client';

interface ReceiptBadgeProps {
  receipt: {
    id: string;
    status: 'simulated' | 'executed' | 'failed';
    txSig?: string;
    realizedPx?: number;
    feesUsd?: number;
    slippageBps?: number;
    createdAt: string;
  };
  intent: {
    id: string;
    base: string;
    quote: string;
    side: 'BUY' | 'SELL';
    sizeJson: any;
  };
  compact?: boolean;
}

export default function ReceiptBadge({ receipt, intent, compact = false }: ReceiptBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executed': return 'bg-green-100 text-green-800 border-green-200';
      case 'simulated': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executed': return '✓';
      case 'simulated': return '📊';
      case 'failed': return '✗';
      default: return '?';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'executed': return 'Executed';
      case 'simulated': return 'Simulated';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = () => {
    const text = `Predikt Trade ${getStatusText(receipt.status)}: ${intent.side} ${intent.sizeJson.value}% ${intent.base}/${intent.quote}${receipt.txSig ? ` - ${receipt.txSig}` : ''}`;
    navigator.clipboard.writeText(text);
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm ${getStatusColor(receipt.status)}`}>
        <span>{getStatusIcon(receipt.status)}</span>
        <span className="font-medium">{getStatusText(receipt.status)}</span>
        {receipt.txSig && (
          <span className="font-mono text-xs">
            {receipt.txSig.slice(0, 6)}...
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-lg p-4 max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm ${getStatusColor(receipt.status)}`}>
          <span>{getStatusIcon(receipt.status)}</span>
          <span className="font-medium">{getStatusText(receipt.status)}</span>
        </div>
        <button
          onClick={copyToClipboard}
          className="text-[color:var(--muted)] hover:text-[color:var(--text)] transition-colors"
          title="Copy to clipboard"
        >
          📋
        </button>
      </div>

      {/* Trade Details */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded ${
            intent.side === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {intent.side}
          </span>
          <span className="font-medium text-[color:var(--text)]">
            {intent.sizeJson.value}% {intent.base}/{intent.quote}
          </span>
        </div>
        
        <div className="text-sm text-[color:var(--muted)]">
          {formatDate(receipt.createdAt)}
        </div>
        
        <div className="text-xs text-[color:var(--muted)]">
          Consent: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Execution Details */}
      {receipt.status === 'executed' && (
        <div className="space-y-1 text-sm">
          {receipt.realizedPx && (
            <div className="flex justify-between">
              <span className="text-[color:var(--muted)]">Price</span>
              <span className="text-[color:var(--text)]">${receipt.realizedPx.toFixed(2)}</span>
            </div>
          )}
          {receipt.feesUsd && (
            <div className="flex justify-between">
              <span className="text-[color:var(--muted)]">Fees</span>
              <span className="text-[color:var(--text)]">${receipt.feesUsd.toFixed(4)}</span>
            </div>
          )}
          {receipt.slippageBps && (
            <div className="flex justify-between">
              <span className="text-[color:var(--muted)]">Slippage</span>
              <span className="text-[color:var(--text)]">{receipt.slippageBps} bps</span>
            </div>
          )}
        </div>
      )}

      {/* Transaction Hash */}
      {receipt.txSig && (
        <div className="mt-3 pt-3 border-t border-[color:var(--border)]">
          <div className="text-xs text-[color:var(--muted)] mb-1">Transaction</div>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono text-[color:var(--text)] bg-[color:var(--background)] px-2 py-1 rounded">
              {receipt.txSig}
            </code>
            <button
              onClick={() => {
                const explorerUrl = `https://solscan.io/tx/${receipt.txSig}`;
                window.open(explorerUrl, '_blank');
              }}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              View
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-[color:var(--border)]">
        <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
          <span>Powered by Predikt</span>
          <span>Jupiter</span>
        </div>
      </div>
    </div>
  );
}
