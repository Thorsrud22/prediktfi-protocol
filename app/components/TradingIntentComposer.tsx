'use client'

import React, { useState, useEffect } from 'react'
import { useSimplifiedWallet } from './wallet/SimplifiedWalletProvider'
import { toast } from 'react-hot-toast'
import { TradeDraft } from '../lib/store/intent-draft-store'
import { persistIntent, type TradingIntent } from '../lib/intent-persistence'
import { getIntents, saveIntents, type TradingIntent as NewTradingIntent } from '../lib/intents'


interface TradingIntentComposerProps {
  draft: TradeDraft
  onCreateIntent: (intent: TradingIntent) => void
  onCancel: () => void
}

const POPULAR_ASSETS = [
  'BTC', 'ETH', 'SOL', 'AVAX', 'XRP', 'ADA', 'DOGE', 'MATIC', 'DOT', 'LINK'
]

const TIME_HORIZONS = [
  { value: 7, label: '7d' },
  { value: 14, label: '14d' },
  { value: 30, label: '30d' },
  { value: 60, label: '60d' },
  { value: 90, label: '90d' }
]

export default function TradingIntentComposer({ draft, onCreateIntent, onCancel }: TradingIntentComposerProps) {
  const { publicKey } = useSimplifiedWallet()
  const [assetSymbol, setAssetSymbol] = useState(draft.assetSymbol)
  const [direction, setDirection] = useState<'Long' | 'Short'>(draft.direction)
  const [confidence, setConfidence] = useState(draft.confidence)
  const [probability] = useState(draft.probability) // readonly
  const [horizonDays, setHorizonDays] = useState(draft.horizonDays)
  const [thesis, setThesis] = useState(draft.thesis)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateIntent = async () => {
    // Validate required fields
    if (!assetSymbol || !direction) {
      alert('Asset and Direction are required')
      return
    }

    setIsCreating(true)

    try {
      const pubkey = publicKey
      
      // Create new TradingIntent object from form values
      const next: NewTradingIntent = {
        id: crypto.randomUUID(),
        symbol: assetSymbol,
        direction,
        probability,
        confidence,
        horizon: `${horizonDays}d`,
        thesis,
        createdAt: Date.now(),
      }
      
      // Read existing intents
      const items = getIntents(pubkey)
      
      // Add new intent to the beginning
      items.unshift(next)
      
      // Save updated intents
      saveIntents(pubkey, items)
      
      // Also persist using the old system for compatibility
      const intentData = {
        assetSymbol,
        direction,
        confidence,
        probability,
        horizonDays,
        thesis,
        createdAt: Date.now()
      }
      const persistedIntent = persistIntent(intentData)
      
      // Call the parent callback with the persisted intent
      onCreateIntent(persistedIntent)
      
      // Show success toast
      toast.success('Intent created')
      
    } catch (error) {
      console.error('Failed to create intent:', error)
      toast.error('Failed to create intent. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="rounded-xl border border-blue-600 bg-blue-900/20 p-6 text-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-blue-300">📝 Trading Intent Composer</h2>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-200 text-sm"
        >
          ✕ Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Asset */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Asset Symbol
            </label>
            <select
              value={assetSymbol}
              onChange={(e) => setAssetSymbol(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              {POPULAR_ASSETS.map(asset => (
                <option key={asset} value={asset}>{asset}</option>
              ))}
            </select>
          </div>

          {/* Direction */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Direction
            </label>
            <div className="flex space-x-3">
              <button
                onClick={() => setDirection('Long')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  direction === 'Long' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Long
              </button>
              <button
                onClick={() => setDirection('Short')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  direction === 'Short' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Short
              </button>
            </div>
          </div>

          {/* Confidence Slider */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Confidence: {confidence}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Time Horizon */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Time Horizon
            </label>
            <select
              value={horizonDays}
              onChange={(e) => setHorizonDays(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              {TIME_HORIZONS.map(horizon => (
                <option key={horizon.value} value={horizon.value}>
                  {horizon.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Probability (readonly) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Probability (from analysis)
            </label>
            <div className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-400">
              {probability}%
            </div>
          </div>

          {/* Thesis */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Thesis
            </label>
            <textarea
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:border-blue-500 focus:outline-none resize-none"
              placeholder="Enter your trading thesis..."
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4 mt-6">
        {/* Primary Actions */}
        <div className="flex space-x-3">
          <button
            onClick={handleCreateIntent}
            disabled={isCreating || !assetSymbol || !direction}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isCreating ? 'Creating Intent...' : 'Create Intent (Dev)'}
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>

        {/* Save & Stamp - Disabled in Dev/Free */}
        <div className="border border-slate-600 rounded-lg p-4 bg-slate-800/30">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-slate-300">Save & Stamp on Blockchain</h3>
            <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded">Pro Feature</span>
          </div>
          <p className="text-sm text-slate-400 mb-3">
            {process.env.NEXT_PUBLIC_SOLANA_CLUSTER !== 'mainnet' 
              ? 'Blockchain stamping is disabled in development environment. Available on mainnet with Pro plan.'
              : 'Upgrade to Pro to stamp trading intents on Solana blockchain for immutable record-keeping.'
            }
          </p>
          <button
            disabled={true}
            className="w-full px-4 py-2 bg-slate-700 text-slate-400 rounded-lg cursor-not-allowed opacity-50 font-medium"
          >
            🔒 Save & Stamp (Pro Only)
          </button>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}
