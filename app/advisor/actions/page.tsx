/**
 * Actions page - Trading intents management
 * /advisor/actions
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { isFeatureEnabled } from '../../lib/flags';
import { safeParse } from '../../lib/safe-fetch';
import TradePanel from '../../components/actions/TradePanel';
import IntentCard from '../../components/actions/IntentCard';
import SimResult from '../../components/actions/SimResult';
import AccuracyAlerts from '../../components/actions/AccuracyAlerts';
import PnLWidget from '../../components/actions/PnLWidget';
import InviteCodeWidget from '../../components/actions/InviteCodeWidget';
import AggregatorFallbackBanner from '../../components/actions/AggregatorFallbackBanner';
import { priceMonitor } from '../../lib/intents/price-monitor';
import KillSwitchStatus from '../../components/actions/KillSwitchStatus';
import ToSAcceptance from '../../components/actions/ToSAcceptance';
import { AccuracyAlertBanner } from '../../components/quality/AccuracyAlertBanner';
import { SimulateOnlyBanner } from '../../components/chaos/SimulateOnlyBanner';

interface Intent {
  id: string;
  walletId: string;
  base: string;
  quote: string;
  side: 'BUY' | 'SELL';
  sizeJson: any;
  rationale?: string;
  confidence?: number;
  backtestWin?: number;
  expectedDur?: string;
  createdAt: string;
  receipts: Array<{
    id: string;
    status: 'simulated' | 'executed' | 'failed';
    txSig?: string;
    realizedPx?: number;
    feesUsd?: number;
    slippageBps?: number;
    createdAt: string;
  }>;
}

interface Wallet {
  id: string;
  address: string;
  chain: string;
}

export default function ActionsPage() {
  const searchParams = useSearchParams();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [intents, setIntents] = useState<Intent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allActionsPaused, setAllActionsPaused] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSimResult, setShowSimResult] = useState<any>(null);
  const [templateData, setTemplateData] = useState<any>(null);

  // Check if actions feature is enabled
  if (!isFeatureEnabled('ACTIONS')) {
    return (
      <div className="min-h-screen bg-[color:var(--background)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[color:var(--text)] mb-4">
            Actions Feature Not Available
          </h1>
          <p className="text-[color:var(--muted)]">
            The trading actions feature is currently disabled.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadWallets();
    
    // Check for template parameter (legacy base64 format)
    const template = searchParams.get('template');
    const sourceModelId = searchParams.get('sourceModelId');
    
    if (template === 'model' && sourceModelId) {
      // Handle model copying template
      setTemplateData({
        sourceModelId: sourceModelId,
        type: 'model_copy',
        // Add default template values for model copying
        base: 'SOL',
        quote: 'USDC',
        side: 'BUY',
        sizeValue: 5, // 5% default
        rationale: `Copying strategy from model ${sourceModelId}`
      });
      setShowCreateForm(true);
    } else if (template) {
      // Legacy base64 template format
      try {
        const decoded = safeParse(atob(template));
        if (decoded) {
          setTemplateData(decoded);
          setShowCreateForm(true);
        }
      } catch (error) {
        console.error('Failed to decode template:', error);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedWallet) {
      loadIntents();
    }
  }, [selectedWallet]);

  // Cleanup price monitoring on unmount
  useEffect(() => {
    return () => {
      priceMonitor.stopAll();
    };
  }, []);

  const loadWallets = async () => {
    try {
      // Mock wallet data for now
      setWallets([
        { id: 'wallet1', address: 'ABC123...', chain: 'solana' },
        { id: 'wallet2', address: 'DEF456...', chain: 'solana' }
      ]);
    } catch (err) {
      setError('Failed to load wallets');
    }
  };

  const loadIntents = async () => {
    if (!selectedWallet) return;
    
    setLoading(true);
    try {
      // Mock intent data for now
      setIntents([
        {
          id: 'intent1',
          walletId: selectedWallet,
          base: 'SOL',
          quote: 'USDC',
          side: 'BUY',
          sizeJson: { type: 'pct', value: 5 },
          rationale: 'Strong bullish signal from AI analysis',
          confidence: 0.85,
          backtestWin: 0.72,
          expectedDur: '14d',
          createdAt: new Date().toISOString(),
          receipts: []
        }
      ]);
    } catch (err) {
      setError('Failed to load intents');
    } finally {
      setLoading(false);
    }
  };

  const simulateIntent = async (intentId: string) => {
    try {
      const response = await fetch('/api/intents/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intentId })
      });
      
      if (response.ok) {
        const result = await response.json();
        setShowSimResult(result);
        loadIntents(); // Refresh to show new receipt
        
        // Start price monitoring for auto-re-simulation
        const intent = intents.find(i => i.id === intentId);
        if (intent && result.data?.expectedPrice) {
          const sizeTokens = intent.sizeJson.type === 'pct' ? 
            (1000 * intent.sizeJson.value / 100) : // Assume $1000 portfolio for demo
            intent.sizeJson.value;
            
          priceMonitor.startMonitoring(
            intentId,
            intent.base,
            intent.quote,
            intent.side,
            sizeTokens,
            result.data.expectedPrice,
            (newPrice, oldPrice) => {
              console.log(`🔄 Price changed: ${oldPrice.toFixed(6)} → ${newPrice.toFixed(6)}`);
              // Auto-re-simulate when price changes significantly
              simulateIntent(intentId);
            },
            { thresholdBps: 10, checkIntervalMs: 3000, maxChecks: 20 }
          );
        }
      } else {
        alert('Simulation failed');
      }
    } catch (err) {
      alert('Error running simulation');
    }
  };

  const executeIntent = async (intentId: string) => {
    if (!confirm('Are you sure you want to execute this trade?')) {
      return;
    }
    
    try {
      const idempotencyKey = `execute_${intentId}_${Date.now()}`;
      const response = await fetch('/api/intents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intentId, idempotencyKey })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Trade executed! Transaction: ${result.txSig}`);
        loadIntents(); // Refresh to show new receipt
      } else {
        alert('Execution failed');
      }
    } catch (err) {
      alert('Error executing trade');
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[color:var(--text)] mb-2">
              Trading Actions
            </h1>
            <p className="text-[color:var(--muted)]">
              Manage your trading intents, simulate outcomes, and execute trades
            </p>
            
            {/* Monitor Only Warning */}
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="font-medium">Monitor only. No trades are executed automatically.</span>
            </div>
          </div>

          {/* Wallet Selection */}
          {!selectedWallet ? (
            <div className="bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] p-6 mb-8">
              <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">
                Select Wallet
              </h2>
              <div className="grid gap-3">
                {wallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => setSelectedWallet(wallet.id)}
                    className="p-4 text-left border border-[color:var(--border)] rounded-lg hover:bg-[color:var(--surface)] transition-colors"
                  >
                    <div className="font-medium text-[color:var(--text)]">
                      {wallet.address}
                    </div>
                    <div className="text-sm text-[color:var(--muted)]">
                      {wallet.chain}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Kill Switch Status */}
              <KillSwitchStatus />

              {/* Aggregator Fallback Banner */}
              <AggregatorFallbackBanner />

              {/* ToS Acceptance */}
              <ToSAcceptance />

              {/* Accuracy Alerts */}
              <AccuracyAlerts />

              {/* Quality Alert Banner */}
              <AccuracyAlertBanner className="mb-6" />

              {/* Simulate-Only Banner (Chaos Testing) */}
              <SimulateOnlyBanner className="mb-6" />

              {/* P&L Widget */}
              <PnLWidget walletId={selectedWallet} className="mb-6" />

              {/* Invite Code Widget */}
              {isFeatureEnabled('INVITE_CODES') && (
                <div className="mb-6">
                  <InviteCodeWidget walletId={selectedWallet} />
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedWallet('')}
                    className="text-sm text-[color:var(--muted)] hover:text-[color:var(--text)] transition-colors"
                  >
                    ← Back to wallet selection
                  </button>
                  <span className="text-sm text-[color:var(--muted)]">
                    Wallet: {wallets.find(w => w.id === selectedWallet)?.address}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Intent
                  </button>
                  
                  <label className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
                    <input
                      type="checkbox"
                      checked={allActionsPaused}
                      onChange={(e) => setAllActionsPaused(e.target.checked)}
                      className="rounded border-[color:var(--border)]"
                    />
                    Pause all actions
                  </label>
                </div>
              </div>

              {/* Intents List */}
              <div className="bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] p-6">
                <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">
                  Trading Intents
                </h2>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-[color:var(--muted)]">Loading intents...</div>
                  </div>
                ) : intents.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-[color:var(--muted)] mb-4">
                      No trading intents created yet.
                    </div>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create First Intent
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {intents.map((intent) => (
                      <IntentCard
                        key={intent.id}
                        intent={intent}
                        onSimulate={simulateIntent}
                        onExecute={executeIntent}
                        disabled={allActionsPaused}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Trade Panel Modal */}
      {showCreateForm && (
        <TradePanel
          walletId={selectedWallet}
          templateData={templateData}
          onClose={() => {
            setShowCreateForm(false);
            setTemplateData(null);
          }}
          onIntentCreated={(intentId) => {
            setShowCreateForm(false);
            setTemplateData(null);
            loadIntents();
          }}
        />
      )}

      {/* Simulation Result Modal */}
      {showSimResult && (
        <SimResult
          simulation={showSimResult.simulation}
          historicalAccuracy={showSimResult.historicalAccuracy}
          onClose={() => setShowSimResult(null)}
        />
      )}
    </div>
  );
}
