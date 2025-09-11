/**
 * Trade Panel component for creating trading intents
 */

'use client';

import { useState, useEffect } from 'react';
import { getSmartDefaults, SmartDefaults, WalletSnapshot } from '../../lib/intents/smart-defaults';
import { PMFTracker } from '../../lib/analytics/pmf-tracker';
import { Connection } from '@solana/web3.js';
import { QuotaIndicator } from '../monetization/QuotaIndicator';
import { QuotaWall } from '../monetization/QuotaWall';
import MarketContext from './MarketContext';
import CopyCta from '../trade/CopyCta';
import { getBucket } from '../../../src/server/analytics/ab';
import { getExperimentBucket } from '../../../src/lib/ab/ab-utils';

interface TradePanelProps {
  walletId: string;
  templateData?: any;
  onClose: () => void;
  onIntentCreated: (intentId: string) => void;
}

interface SizeConfig {
  type: 'pct' | 'abs';
  value: number;
  token?: string;
}

interface GuardsConfig {
  dailyLossCapPct: number;
  posLimitPct: number;
  minLiqUsd: number;
  maxSlippageBps: number;
  expiresAt: string;
}

export default function TradePanel({ walletId, templateData, onClose, onIntentCreated }: TradePanelProps) {
  const [formData, setFormData] = useState({
    base: templateData?.base || 'SOL', // Fixed to SOL only
    quote: templateData?.quote || 'USDC', // Fixed to USDC only
    side: templateData?.side || 'BUY' as 'BUY' | 'SELL',
    sizeType: templateData?.sizeJson?.type || 'pct' as 'pct' | 'abs',
    sizeValue: templateData?.sizeValue || templateData?.sizeJson?.value || 3, // Conservative default
    rationale: templateData?.rationale || '',
    confidence: templateData?.confidence || 0.8,
    expectedDur: templateData?.expectedDur || '14d',
    // Guards
    dailyLossCapPct: 3, // More conservative
    posLimitPct: 10, // More conservative
    minLiqUsd: 50000, // Lower minimum
    maxSlippageBps: 30, // Tighter slippage
    expiresHours: 24
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [smartDefaults, setSmartDefaults] = useState<SmartDefaults | null>(null);
  const [calculatingDefaults, setCalculatingDefaults] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [simAccuracy, setSimAccuracy] = useState<{ accuracy30d: number; accuracy7d: number; confidence: string } | null>(null);
  const [noiseFilterWarning, setNoiseFilterWarning] = useState<string | null>(null);
  const [abBucket, setAbBucket] = useState<'A' | 'B' | null>(null);
  const [contextEventSent, setContextEventSent] = useState(false);
  const [ctaVariant, setCtaVariant] = useState<'primary_above' | 'inline_below'>('primary_above');

  // Send analytics event helper
  const sendAnalyticsEvent = async (event: { type: string; modelIdHashed?: string; variant?: string; experiment?: string }) => {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.warn('Failed to send analytics event:', error);
    }
  };

  // Set A/B bucket and send context events
  useEffect(() => {
    const bucket = getBucket(sessionId);
    setAbBucket(bucket);
    
    // Set CTA variant based on experiment bucket
    const ctaBucket = getExperimentBucket(sessionId, 'cta_copy_v1');
    setCtaVariant(ctaBucket === 'A' ? 'primary_above' : 'inline_below');
    
    // Send context event (shown for A, hidden for B)
    if (!contextEventSent) {
      const eventType = bucket === 'A' ? 'context_shown' : 'context_hidden';
      sendAnalyticsEvent({ type: eventType });
      setContextEventSent(true);
    }
  }, [sessionId, contextEventSent]);

  // Calculate smart defaults and simulation accuracy on component mount and side change
  useEffect(() => {
    const calculateDefaults = async () => {
      if (!walletId) return;
      
      setCalculatingDefaults(true);
      try {
        const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
        // Create a mock wallet snapshot for now
        const walletSnapshot: WalletSnapshot = {
          totalValueUsd: 10000, // Mock portfolio value
          holdings: [
            { asset: 'SOL', amount: 10, valueUsd: 2000 },
            { asset: 'USDC', amount: 8000, valueUsd: 8000 }
          ]
        };
        const defaults = await getSmartDefaults(walletSnapshot, formData.side, formData.base, formData.quote);
        setSmartDefaults(defaults);
        
        // Apply smart defaults to form if no template data
        if (!templateData) {
          setFormData(prev => ({
            ...prev,
            sizeValue: defaults.recommendedSizePct,
            dailyLossCapPct: Math.min(defaults.recommendedSizePct * 0.5, 5),
            posLimitPct: Math.min(defaults.recommendedSizePct * 2, 15)
          }));
        }
      } catch (error) {
        console.error('Failed to calculate smart defaults:', error);
      } finally {
        setCalculatingDefaults(false);
      }
    };

    const fetchSimAccuracy = async () => {
      try {
        const response = await fetch('/api/intents/sim-accuracy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            walletId,
            base: formData.base,
            quote: formData.quote 
          })
        });

        if (response.ok) {
          const data = await response.json();
          setSimAccuracy(data);
        }
      } catch (error) {
        console.error('Failed to fetch simulation accuracy:', error);
      }
    };

    calculateDefaults();
    fetchSimAccuracy();
  }, [walletId, formData.side, formData.base, formData.quote, templateData]);

  // Check noise filter when size changes
  useEffect(() => {
    const checkNoiseFilter = async () => {
      if (!walletId || !smartDefaults) return;
      
      const sizeUsd = formData.sizeType === 'pct' 
        ? (smartDefaults.portfolioValueUsd * formData.sizeValue / 100)
        : formData.sizeValue;
      
      try {
        const response = await fetch('/api/intents/check-noise-filter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sizeUsd,
            base: formData.base,
            quote: formData.quote 
          })
        });

        if (response.ok) {
          const data = await response.json();
          setNoiseFilterWarning(data.shouldBlock ? data.reason : null);
        }
      } catch (error) {
        console.error('Failed to check noise filter:', error);
      }
    };

    checkNoiseFilter();
  }, [walletId, formData.sizeValue, formData.sizeType, formData.base, formData.quote, smartDefaults]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Track simulation event
    await PMFTracker.trackIntentSimulation(walletId, 'pending', sessionId);

    try {
      // Calculate expiry time
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + formData.expiresHours);

      // Prepare intent data
      const sizeJson: SizeConfig = {
        type: formData.sizeType,
        value: formData.sizeValue
      };

      const guardsJson: GuardsConfig = {
        dailyLossCapPct: formData.dailyLossCapPct,
        posLimitPct: formData.posLimitPct,
        minLiqUsd: formData.minLiqUsd,
        maxSlippageBps: formData.maxSlippageBps,
        expiresAt: expiresAt.toISOString()
      };

      const intentData = {
        walletId,
        chain: 'solana',
        base: formData.base,
        quote: formData.quote,
        side: formData.side,
        sizeJson,
        rationale: formData.rationale || undefined,
        confidence: formData.confidence,
        expectedDur: formData.expectedDur,
        guardsJson,
        venuePref: 'jupiter',
        simOnly: false,
        sourceModelId: templateData?.sourceModelId || undefined, // Track model copying
        sourceModelIdHashed: templateData?.sourceModelId ? 
          require('crypto').createHash('sha256').update(templateData.sourceModelId).digest('hex').slice(0, 16) 
          : undefined
      };

      const idempotencyKey = `create_${walletId}_${Date.now()}`;

      const response = await fetch('/api/intents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: intentData,
          idempotencyKey
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create intent');
      }

      const result = await response.json();
      
      // Track successful intent creation
      await PMFTracker.trackIntentSigning(walletId, result.intentId, sessionId);
      await PMFTracker.updateUserRetention(walletId, true);
      
      // Show share options after successful creation
      setShowShareOptions(true);
      
      // Call the callback after a short delay to show the success state
      setTimeout(() => {
        onIntentCreated(result.intentId);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[color:var(--text)]">
            Create Trading Intent
          </h2>
          <button
            onClick={onClose}
            className="text-[color:var(--muted)] hover:text-[color:var(--text)]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Trading Pair - Fixed to SOL/USDC */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-900">Trading Pair</div>
                <div className="text-lg font-bold text-blue-700">SOL/USDC</div>
              </div>
              <div className="text-xs text-blue-600">
                Focused on the most liquid pair
              </div>
            </div>
          </div>

          {/* Market Context - A/B tested (only show for bucket A) */}
          {abBucket === 'A' && <MarketContext pair="SOL/USDC" className="mb-2" />}

          {/* Copy CTA - A/B tested */}
          {templateData?.sourceModelId && (
            <CopyCta
              modelIdHashed={templateData.sourceModelId}
              variant={ctaVariant}
              onClick={() => {
                // Send copy clicked event with experiment metadata
                sendAnalyticsEvent({
                  type: 'model_copy_clicked',
                  modelIdHashed: templateData.sourceModelId,
                  variant: ctaVariant,
                  experiment: 'cta_copy_v1'
                });
              }}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-[color:var(--text)] mb-1">
              Side
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, side: 'BUY' })}
                className={`px-4 py-2 rounded ${
                  formData.side === 'BUY' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-[color:var(--background)] border border-[color:var(--border)] text-[color:var(--text)]'
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, side: 'SELL' })}
                className={`px-4 py-2 rounded ${
                  formData.side === 'SELL' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-[color:var(--background)] border border-[color:var(--border)] text-[color:var(--text)]'
                }`}
              >
                SELL
              </button>
            </div>
          </div>

          {/* Simulation Accuracy Display */}
          {simAccuracy && (
            <div className={`border rounded-lg p-3 ${
              simAccuracy.accuracy7d < 50 
                ? 'bg-red-50 border-red-200' 
                : simAccuracy.accuracy7d < 70 
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="text-sm font-medium mb-2 flex items-center gap-2">
                <span>🎯 Simulation Accuracy</span>
                {simAccuracy.accuracy7d < 50 && <span className="text-red-500">⚠️</span>}
                {simAccuracy.accuracy7d >= 50 && simAccuracy.accuracy7d < 70 && <span className="text-yellow-500">⚡</span>}
                {simAccuracy.accuracy7d >= 70 && <span className="text-green-500">✅</span>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">30d accuracy:</span> 
                  <span className={`ml-1 font-medium ${
                    simAccuracy.accuracy30d >= 70 ? 'text-green-600' : 
                    simAccuracy.accuracy30d >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {simAccuracy.accuracy30d.toFixed(1)}% ±{simAccuracy.confidence === 'high' ? '50' : simAccuracy.confidence === 'medium' ? '100' : '200'} bps
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">7d accuracy:</span> 
                  <span className={`ml-1 font-medium ${
                    simAccuracy.accuracy7d >= 70 ? 'text-green-600' : 
                    simAccuracy.accuracy7d >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {simAccuracy.accuracy7d.toFixed(1)}%
                  </span>
                </div>
              </div>
              {simAccuracy.accuracy7d < 50 && (
                <div className="text-red-700 text-xs mt-2">
                  ⚠️ Low accuracy detected. Consider waiting for better conditions.
                </div>
              )}
            </div>
          )}

          {/* Smart Defaults Display */}
          {smartDefaults && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm font-medium text-green-900 mb-2">Smart Sizing</div>
              <div className="text-xs text-green-700 mb-2">Based on your portfolio size and risk profile</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-green-600">Recommended:</span> {smartDefaults.recommendedSizePct}% (${smartDefaults.recommendedSizeUsd.toFixed(0)})
                </div>
                <div>
                  <span className="text-green-600">Max Safe:</span> {smartDefaults.maxPositionPct}% (${(smartDefaults.portfolioValueUsd * smartDefaults.maxPositionPct / 100).toFixed(0)})
                </div>
              </div>
            </div>
          )}

          {/* Size */}
          <div>
            <label className="block text-sm font-medium text-[color:var(--text)] mb-1">
              Position Size
            </label>
            <div className="flex gap-2">
              <select
                value={formData.sizeType}
                onChange={(e) => setFormData({ ...formData, sizeType: e.target.value as 'pct' | 'abs' })}
                className="p-2 border border-[color:var(--border)] rounded bg-[color:var(--background)] text-[color:var(--text)]"
              >
                <option value="pct">% of Portfolio</option>
                <option value="abs">Fixed Amount (USDC)</option>
              </select>
              <input
                type="number"
                value={formData.sizeValue}
                onChange={(e) => setFormData({ ...formData, sizeValue: parseFloat(e.target.value) || 0 })}
                min="0"
                max={formData.sizeType === 'pct' ? 20 : undefined}
                step={formData.sizeType === 'pct' ? 0.1 : 1}
                className="flex-1 p-2 border border-[color:var(--border)] rounded bg-[color:var(--background)] text-[color:var(--text)]"
                placeholder={formData.sizeType === 'pct' ? '3' : '100'}
              />
            </div>
            
            {/* Quick Size Suggestions */}
            {smartDefaults && formData.sizeType === 'pct' && (
              <div className="mt-2">
                <div className="text-xs text-gray-600 mb-1">Quick suggestions:</div>
                <div className="flex gap-2">
                  {[
                    { label: 'Conservative', pct: 2, color: 'bg-green-100 text-green-800' },
                    { label: 'Moderate', pct: smartDefaults.recommendedSizePct, color: 'bg-blue-100 text-blue-800' },
                    { label: 'Aggressive', pct: Math.min(smartDefaults.maxPositionPct, 8), color: 'bg-orange-100 text-orange-800' }
                  ].map((suggestion) => (
                    <button
                      key={suggestion.label}
                      type="button"
                      onClick={() => setFormData({ ...formData, sizeValue: suggestion.pct })}
                      className={`px-2 py-1 rounded text-xs ${suggestion.color} ${
                        formData.sizeValue === suggestion.pct ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      {suggestion.label} ({suggestion.pct}%)
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rationale */}
          <div>
            <label className="block text-sm font-medium text-[color:var(--text)] mb-1">
              Rationale (Optional)
            </label>
            <textarea
              value={formData.rationale}
              onChange={(e) => setFormData({ ...formData, rationale: e.target.value })}
              rows={3}
              className="w-full p-2 border border-[color:var(--border)] rounded bg-[color:var(--background)] text-[color:var(--text)]"
              placeholder="Why are you making this trade?"
            />
          </div>

          {/* Risk Guards */}
          <div className="border-t border-[color:var(--border)] pt-4">
            <h3 className="text-sm font-medium text-[color:var(--text)] mb-3">Risk Guards</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[color:var(--muted)] mb-1">
                  Max Position %
                </label>
                <input
                  type="number"
                  value={formData.posLimitPct}
                  onChange={(e) => setFormData({ ...formData, posLimitPct: parseFloat(e.target.value) || 0 })}
                  min="0"
                  max="50"
                  className="w-full p-2 border border-[color:var(--border)] rounded bg-[color:var(--background)] text-[color:var(--text)]"
                />
              </div>
              
              <div>
                <label className="block text-xs text-[color:var(--muted)] mb-1">
                  Max Slippage (bps)
                </label>
                <input
                  type="number"
                  value={formData.maxSlippageBps}
                  onChange={(e) => setFormData({ ...formData, maxSlippageBps: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="1000"
                  className="w-full p-2 border border-[color:var(--border)] rounded bg-[color:var(--background)] text-[color:var(--text)]"
                />
              </div>
            </div>
            
            <div className="mt-3">
              <label className="block text-xs text-[color:var(--muted)] mb-1">
                Expires In (hours)
              </label>
              <input
                type="number"
                value={formData.expiresHours}
                onChange={(e) => setFormData({ ...formData, expiresHours: parseInt(e.target.value) || 1 })}
                min="1"
                max="24"
                className="w-full p-2 border border-[color:var(--border)] rounded bg-[color:var(--background)] text-[color:var(--text)]"
              />
            </div>
          </div>

          {/* Noise Filter Warning */}
          {noiseFilterWarning && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
              <p className="text-red-800 font-medium text-sm">
                🚫 Trade Blocked by Noise Filter
              </p>
              <p className="text-red-700 text-xs mt-1">
                {noiseFilterWarning}
              </p>
            </div>
          )}

          {/* TP/SL Simulation Warning */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-4">
            <p className="text-orange-800 font-medium text-sm">
              ⚠️ TP/SL is simulated in v1 – not on-chain OCO.
            </p>
            <p className="text-orange-700 text-xs mt-1">
              Take profit and stop loss orders are simulated for demonstration purposes only.
            </p>
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[color:var(--border)] rounded text-[color:var(--text)] hover:bg-[color:var(--surface)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Intent'}
            </button>
          </div>
        </form>

        {/* Quota Information */}
        <div className="mt-4 pt-4 border-t border-[color:var(--border)]">
          <div className="space-y-2">
            <QuotaIndicator quotaType="intents" showLabel={true} />
            <QuotaIndicator quotaType="quotes" showLabel={true} />
          </div>
        </div>

        {/* Quota Wall */}
        <QuotaWall 
          quotaType="intents" 
          onUpgrade={() => window.open('/pricing', '_blank')}
          onTrialStart={() => window.location.reload()}
          className="mt-4"
        />

        {/* Share Options Modal */}
        {showShareOptions && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Your Strategy</h3>
              <p className="text-sm text-gray-600 mb-4">
                Your trading intent has been created! Share your strategy with others or keep it private.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    // Create shareable template
                    try {
                      const response = await fetch('/api/copy-trade/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          intentId: 'latest', // This would be the actual intent ID
                          walletId
                        })
                      });
                      
                      if (response.ok) {
                        const data = await response.json();
                        navigator.clipboard.writeText(data.template.shareUrl);
                        alert('Share link copied to clipboard!');
                      }
                    } catch (error) {
                      console.error('Failed to create share link:', error);
                    }
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📤 Create Shareable Link
                </button>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Page link copied to clipboard!');
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  🔗 Copy Page Link
                </button>
                
                <button
                  onClick={() => setShowShareOptions(false)}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Keep Private
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
