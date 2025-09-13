'use client'

import React from 'react'

interface TradingIntent {
  id: string
  assetSymbol: string
  direction: 'Long' | 'Short'
  confidence: number
  probability: number
  horizonDays: number
  thesis: string
  createdAt: number
}

interface UserIntentsListProps {
  intents: TradingIntent[]
  onRemoveIntent?: (intentId: string) => void
  onSimulate?: (intentId: string) => void
  onExecute?: (intentId: string) => void
  onEdit?: (intentId: string) => void
  isWalletConnected?: boolean
}

export default function UserIntentsList({ 
  intents, 
  onRemoveIntent, 
  onSimulate, 
  onExecute, 
  onEdit, 
  isWalletConnected = false 
}: UserIntentsListProps) {
  if (intents.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-700 p-6 text-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">📋 Your Intents</h2>
        <span className="text-sm text-slate-400">{intents.length} intent{intents.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-4">
        {intents.map((intent) => (
          <div key={intent.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="text-lg font-semibold text-blue-400">
                  {intent.assetSymbol}
                </div>
                <div className={`px-2 py-1 rounded text-sm font-medium ${
                  intent.direction === 'Long' 
                    ? 'bg-green-600/20 text-green-400' 
                    : 'bg-red-600/20 text-red-400'
                }`}>
                  {intent.direction}
                </div>
                <div className="text-sm text-slate-400">
                  {intent.horizonDays}d horizon
                </div>
              </div>
              
              {onRemoveIntent && (
                <button
                  onClick={() => onRemoveIntent(intent.id)}
                  className="text-slate-400 hover:text-red-400 transition-colors"
                  title="Remove intent"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide">Probability</label>
                <div className="text-sm font-semibold text-purple-400">{intent.probability}%</div>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide">Confidence</label>
                <div className="text-sm font-semibold text-orange-400">{intent.confidence}%</div>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide">Created</label>
                <div className="text-sm text-slate-300">
                  {new Date(intent.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide">Time</label>
                <div className="text-sm text-slate-300">
                  {new Date(intent.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>

            {intent.thesis && (
              <div className="mb-3">
                <label className="text-xs text-slate-500 uppercase tracking-wide block mb-1">Thesis</label>
                <div className="text-sm text-slate-300 leading-relaxed">
                  {intent.thesis}
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <button 
                onClick={() => onSimulate?.(intent.id)}
                className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded text-sm hover:bg-blue-600/30 transition-colors"
              >
                Simulate
              </button>
              <button 
                onClick={() => onEdit?.(intent.id)}
                className="px-3 py-1 bg-slate-600/20 text-slate-400 rounded text-sm hover:bg-slate-600/30 transition-colors"
              >
                Edit
              </button>
              <button 
                onClick={() => onExecute?.(intent.id)}
                disabled={!isWalletConnected}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  isWalletConnected 
                    ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' 
                    : 'bg-slate-600/20 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                Execute
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
