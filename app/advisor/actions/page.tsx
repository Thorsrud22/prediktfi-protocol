'use client'
import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { useSimplifiedWallet } from '../../components/wallet/SimplifiedWalletProvider'
import { useIntentDraft } from '../../lib/store/intent-draft-store'
import TradingIntentComposer from '../../components/TradingIntentComposer'
import UserIntentsList from '../../components/UserIntentsList'
import { loadIntents, removeIntent, type TradingIntent } from '../../lib/intent-persistence'
import { loadIntents as getIntents, saveIntents, upsertIntent, removeIntent as removeWalletIntent, type TradingIntent as NewTradingIntent } from '../../lib/wallet-intent-persistence'
import { loadDevIntents, type DevIntent } from '../../lib/dev-intents'

// local reader helpers for per-wallet intents
type PerWalletIntent = {
  id: string
  createdAt: number
  title: string
  side?: "long" | "short"
  payload: Record<string, unknown>
}


function intentsKey(base58?: string | null) {
  return base58 ? `predikt:intents:${base58}` : null
}

function loadIntentsFor(base58?: string | null): PerWalletIntent[] {
  try {
    const k = intentsKey(base58)
    if (!k) return []
    const raw = localStorage.getItem(k)
    return raw ? (JSON.parse(raw) as PerWalletIntent[]) : []
  } catch {
    return []
  }
}

function readIntentsAny(base58?: string | null) {
  if (!base58) return []
  try {
    const v2 = localStorage.getItem(`predikt:intents:v2:${base58}`)
    if (v2) {
      const arr = JSON.parse(v2)
      if (Array.isArray(arr) && arr.length) return arr
    }
    const v1 = localStorage.getItem(`predikt:intents:${base58}`)
    return v1 ? (JSON.parse(v1) as StoredIntent[]) : []
  } catch {
    return []
  }
}

// Robust conversion from stored intent to UI format
type StoredIntent = {
  id?: string
  title?: unknown
  side?: "long" | "short"
  symbol?: unknown
  assetSymbol?: unknown
  confidence?: unknown
  probability?: unknown
  createdAt?: unknown
  payload?: any
}

type UiIntent = {
  id: string
  assetSymbol: string
  direction: "Long" | "Short"
  confidence: number
  probability: number
  horizonDays: number
  thesis: string
  createdAt: number
  raw: StoredIntent
}

function toStringOrEmpty(v: unknown): string {
  return typeof v === "string" ? v : ""
}
function toNumberOr(v: unknown, def: number): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : def
}

function safeTitle(x: StoredIntent): string {
  const t1 = toStringOrEmpty(x.title).trim()
  if (t1) return t1
  const t2 = toStringOrEmpty(x?.payload?.predictionTitle).trim()
  if (t2) return t2
  return "Untitled"
}

function safeAssetSymbol(x: StoredIntent, title: string): string {
  const s1 = toStringOrEmpty(x.symbol).trim()
  if (s1) return s1.toUpperCase()
  const s2 = toStringOrEmpty(x.assetSymbol).trim()
  if (s2) return s2.toUpperCase()
  const firstWord = title.trim().split(/\s+/)[0] || ""
  return firstWord ? firstWord.toUpperCase() : "UNKNOWN"
}

function convertPerWalletIntentToTradingIntent(x: StoredIntent): UiIntent {
  const title = safeTitle(x)
  return {
    id: String(x.id ?? `${Date.now()}-${Math.random().toString(36).slice(2,8)}`),
    assetSymbol: safeAssetSymbol(x, title),
    direction: x.side === "short" ? "Short" : "Long",
    confidence: toNumberOr(x.confidence, 70),
    probability: toNumberOr(x.probability, 50),
    horizonDays: 30, // Default horizon
    thesis: `Trading intent: ${title}`,
    createdAt: toNumberOr(x.createdAt, Date.now()),
    raw: x,
  }
}


// Edit Intent Form Component
function EditIntentForm({ 
  intent,
  onUpdateIntent, 
  onCancel 
}: { 
  intent: NewTradingIntent;
  onUpdateIntent: (data: {
    asset: string;
    side: 'Long' | 'Short';
    probability: number;
    confidence: number;
    horizon: string;
    thesis: string;
  }) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    asset: intent.symbol || intent.title,
    side: intent.direction as 'Long' | 'Short',
    probability: intent.probability,
    confidence: intent.confidence,
    horizon: intent.horizon,
    thesis: intent.thesis
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.asset.trim() || !formData.thesis?.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    
    if ((formData.probability ?? 0) < 0 || (formData.probability ?? 0) > 100) {
      toast.error('Probability must be between 0 and 100')
      return
    }
    
    if ((formData.confidence ?? 0) < 0 || (formData.confidence ?? 0) > 100) {
      toast.error('Confidence must be between 0 and 100')
      return
    }
    
    onUpdateIntent(formData)
  }

  return (
    <div className="rounded-xl border border-blue-600 bg-blue-900/20 p-6 text-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-300">Edit Trading Intent</h3>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-200 text-sm"
        >
          ✕ Cancel
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Asset Symbol */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Asset Symbol *
            </label>
            <input
              type="text"
              value={formData.asset}
              onChange={(e) => setFormData(prev => ({ ...prev, asset: e.target.value.toUpperCase() }))}
              placeholder="e.g. BTC, ETH, SOL"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Side */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Direction *
            </label>
            <select
              value={formData.side}
              onChange={(e) => setFormData(prev => ({ ...prev, side: e.target.value as 'Long' | 'Short' }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Long">Long</option>
              <option value="Short">Short</option>
            </select>
          </div>
          
          {/* Probability */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Probability (%) *
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.probability}
              onChange={(e) => setFormData(prev => ({ ...prev, probability: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Confidence */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Confidence (%) *
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.confidence}
              onChange={(e) => setFormData(prev => ({ ...prev, confidence: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Horizon */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Time Horizon *
            </label>
            <select
              value={formData.horizon}
              onChange={(e) => setFormData(prev => ({ ...prev, horizon: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1d">1 day</option>
              <option value="7d">1 week</option>
              <option value="30d">1 month</option>
              <option value="90d">3 months</option>
              <option value="180d">6 months</option>
              <option value="365d">1 year</option>
            </select>
          </div>
        </div>
        
        {/* Thesis */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Trading Thesis *
          </label>
          <textarea
            value={formData.thesis}
            onChange={(e) => setFormData(prev => ({ ...prev, thesis: e.target.value }))}
            placeholder="Explain your reasoning for this trade..."
            rows={3}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Update Intent
          </button>
        </div>
      </form>
    </div>
  )
}

function listIntentKeys(): string[] {
  try {
    return Object.keys(localStorage).filter(k => k.startsWith("predikt:intents"))
  } catch {
    return []
  }
}

type RawIntent = {
  id?: string
  title?: string
  side?: "long" | "short"
  createdAt?: number
  payload?: Record<string, unknown>
  probability?: number
  confidence?: number
}

function parseJson<T=unknown>(raw: string | null): T | null {
  if (!raw) return null
  try { return JSON.parse(raw) as T } catch { return null }
}

function readIntentsV2(base58?: string | null): RawIntent[] {
  if (!base58) return []
  return parseJson(localStorage.getItem(`predikt:intents:v2:${base58}`)) ?? []
}

function readIntentsV1(base58?: string | null): RawIntent[] {
  if (!base58) return []
  return parseJson(localStorage.getItem(`predikt:intents:${base58}`)) ?? []
}

function readIntentsScanAll(base58?: string | null): {key:string, items:RawIntent[]} | null {
  const keys = Object.keys(localStorage).filter(k => k.startsWith("predikt:intents"))
  // 1) Prøv eksakt wallet-match
  if (base58) {
    const exact = keys.find(k => k.endsWith(`:${base58}`))
    if (exact) return { key: exact, items: parseJson(localStorage.getItem(exact)) ?? [] }
  }
  // 2) Ellers: første nøkkel med items (for å gjøre data synlig i UI)
  for (const k of keys) {
    const arr = parseJson(localStorage.getItem(k)) ?? []
    if (Array.isArray(arr) && arr.length) return { key: k, items: arr }
  }
  return null
}

function normalizeIntent(x: RawIntent) {
  if (!x || typeof x !== "object") return null
  const payload = (x.payload && typeof x.payload === "object") ? x.payload : {}
  const title = typeof x.title === "string" && x.title.trim()
    ? x.title.trim()
    : (typeof payload.predictionTitle === "string" && payload.predictionTitle.trim())
      ? payload.predictionTitle.trim()
      : "Untitled"
  const createdAtNum = Number(x.createdAt)
  return {
    id: String(x.id ?? `${Date.now()}-${Math.random().toString(36).slice(2,8)}`),
    title,
    side: x.side === "short" ? "short" : "long",
    createdAt: Number.isFinite(createdAtNum) ? createdAtNum : Date.now(),
    payload,
    probability: Number.isFinite(Number(x.probability)) ? Number(x.probability) : 50,
    confidence: Number.isFinite(Number(x.confidence)) ? Number(x.confidence) : 70,
  }
}

export default function ActionsPage() {
  const { isConnected, publicKey } = useSimplifiedWallet()
  const { draft, clearDraft } = useIntentDraft()
  
  // put this near the top of the component
  const [mounted, setMounted] = useState(false)
  const [debugKeys, setDebugKeys] = useState<string[]>([])
  const walletBase58 = publicKey?.toBase58?.() || null
  
  const [showDraft, setShowDraft] = useState(false)
  const [showComposer, setShowComposer] = useState(false)
  const [showEditIntent, setShowEditIntent] = useState(false)
  const [editingIntent, setEditingIntent] = useState<NewTradingIntent | null>(null)
  const [userIntents, setUserIntents] = useState<TradingIntent[]>([])
  const [newIntents, setNewIntents] = useState<NewTradingIntent[]>([])
  const [devIntents, setDevIntents] = useState<DevIntent[]>([])
  const [perWalletIntents, setPerWalletIntents] = useState<UiIntent[]>([])
  
  
  // Ref to track if we've loaded intents to prevent unnecessary clearing on first render
  const loadedRef = useRef(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith("predikt:intents"))
      setDebugKeys(keys)
    } catch {
      setDebugKeys([])
    }
  }, [mounted, isConnected, walletBase58, perWalletIntents?.length])
  
  // Show composer if we have a draft (for backward compatibility)
  useEffect(() => {
    if (draft) {
      setShowDraft(true)
      setShowComposer(true)
    }
  }, [draft])

  // Load intents from localStorage on mount (client-side only) - legacy system
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadedIntents = loadIntents()
      setUserIntents(loadedIntents)
    }
  }, [])

  // Load intents on mount and when wallet changes
  useEffect(() => {
    if (isConnected && publicKey) {
      // Wallet is isConnected - load intents for specific wallet
      const pubkey = publicKey // publicKey is already a string in SimplifiedWallet
      setNewIntents(loadIntents(pubkey))
    } else {
      // Wallet not isConnected - try fallback to load any intents
      setNewIntents(loadIntents()) // This will use the fallback mechanism
    }
  }, [publicKey, isConnected])

  // Load dev intents on mount and when wallet connects
  useEffect(() => {
    const owner = publicKey || ''
    setDevIntents(loadDevIntents(owner))
  }, [publicKey, isConnected])

  // Load per-wallet intents from localStorage when wallet connects
  useEffect(() => {
    if (!isConnected || !publicKey) {
      setPerWalletIntents([]) // kun skjul i UI, ikke skriv til storage
      return
    }
    const base58 = publicKey

    // one-time fix: migrate any accidental "v2:undefined" to the real wallet key
    try {
      const base58 = publicKey?.toBase58?.();
      if (base58) {
        const badKey = 'predikt:intents:v2:undefined';
        const goodKey = `predikt:intents:v2:${base58}`;
        const bad = localStorage.getItem(badKey);
        if (bad && !localStorage.getItem(goodKey)) {
          localStorage.setItem(goodKey, bad);      // move
          localStorage.removeItem(badKey);
        }
      }
    } catch {}

    // leserekkefølge
    let raw = readIntentsV2(base58)
    if (!raw?.length) raw = readIntentsV1(base58)
    if (!raw?.length) {
      const scan = readIntentsScanAll(base58)
      if (scan?.items?.length) {
        raw = scan.items
      }
    }

    const normalized = (Array.isArray(raw) ? raw : []).map(normalizeIntent).filter(Boolean)
    const sorted = [...normalized].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    setPerWalletIntents(sorted)
  }, [isConnected, publicKey])


  const handleCreateIntent = (intent: TradingIntent) => {
    // Convert legacy intent to new format and persist with wallet key
    const pubkey = publicKey
    const newIntent: NewTradingIntent = {
      id: intent.id,
      symbol: intent.assetSymbol,
      direction: intent.direction,
      probability: intent.probability,
      confidence: intent.confidence,
      horizon: `${intent.horizonDays}d`,
      thesis: intent.thesis,
      createdAt: intent.createdAt
    }
    
    // Persist to wallet-keyed storage
    upsertIntent(pubkey, newIntent)
    
    // Update local state
    setUserIntents(prev => [intent, ...prev])
    setNewIntents(loadIntents(pubkey))
    
    clearDraft()
    setShowComposer(false)
    setShowDraft(false)
    
    // Clean up URL - remove any draft banner/params and push clean URL
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      const hasDraftParams = currentUrl.searchParams.has('draft') || 
                            currentUrl.searchParams.has('banner') ||
                            currentUrl.searchParams.has('intent');
      
      if (hasDraftParams) {
        // Remove draft-related parameters
        currentUrl.searchParams.delete('draft');
        currentUrl.searchParams.delete('banner');
        currentUrl.searchParams.delete('intent');
        
        // Push clean URL to history
        window.history.pushState({}, '', currentUrl.pathname + currentUrl.search);
      }
    }
    
    
    // Show toast notification
    if (typeof window !== 'undefined') {
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      toast.textContent = 'Intent saved'
      document.body.appendChild(toast)
      setTimeout(() => {
        document.body.removeChild(toast)
      }, 3000)
    }
  }

  const handleCancelComposer = () => {
    clearDraft()
    setShowComposer(false)
    setShowDraft(false)
  }



  const handleRemoveIntent = (intentId: string) => {
    // Remove from localStorage (legacy system)
    removeIntent(intentId)
    // Update local state
    setUserIntents(prev => prev.filter(intent => intent.id !== intentId))
  }

  const handleRemoveNewIntent = (intentId: string) => {
    // Remove from new intents system
    const pubkey = publicKey
    
    // Remove from wallet-keyed storage
    removeWalletIntent(pubkey, intentId)
    
    // Update local state
    const updatedNewIntents = newIntents.filter(intent => intent.id !== intentId)
    setNewIntents(updatedNewIntents)
    
    toast.success('Intent removed')
  }

  const handleEditNewIntent = (intentId: string) => {
    // Find the intent to edit
    const intent = newIntents.find(i => i.id === intentId)
    if (!intent) {
      toast.error('Intent not found')
      return
    }
    
    // Set the intent to edit and show the edit form
    setEditingIntent(intent)
    setShowEditIntent(true)
  }

  const handleUpdateIntent = (intentData: {
    asset: string;
    side: 'Long' | 'Short';
    probability: number;
    confidence: number;
    horizon: string;
    thesis: string;
  }) => {
    if (!editingIntent) return

    const pubkey = publicKey
    
    // Create updated intent object
    const updatedIntent: NewTradingIntent = {
      ...editingIntent,
      symbol: intentData.asset,
      direction: intentData.side,
      probability: intentData.probability,
      confidence: intentData.confidence,
      horizon: intentData.horizon,
      thesis: intentData.thesis,
    }
    
    // Update in wallet-keyed storage
    upsertIntent(pubkey, updatedIntent)
    
    // Update local state
    setNewIntents(loadIntents(pubkey))
    
    // Close the edit form
    setShowEditIntent(false)
    setEditingIntent(null)
    
    // Show success message
    toast.success('Intent updated successfully!')
    
  }

  const handleCancelEditIntent = () => {
    setShowEditIntent(false)
    setEditingIntent(null)
  }

  const handleExecuteNewIntent = (intentId: string) => {
    // Find the intent to execute
    const intent = newIntents.find(i => i.id === intentId)
    if (!intent) {
      toast.error('Intent not found')
      return
    }
    
    // TODO: Implement execute functionality
    // For now, just show a message
    toast('Execute functionality coming soon', { icon: 'ℹ️' })
  }

  const handleSimulateNewIntent = (intentId: string) => {
    // Find the intent to simulate
    const intent = newIntents.find(i => i.id === intentId)
    if (!intent) {
      toast.error('Intent not found')
      return
    }
    
    // TODO: Implement simulate functionality
    // For now, just show a message
    toast('Simulate functionality coming soon', { icon: 'ℹ️' })
  }

  // Don't require wallet connection for viewing drafts and creating dev intents
  // This prevents SIWS spam during navigation
  
  
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-100 mb-2">Trading Actions</h1>
      <p className="text-sm text-slate-300 mb-6">Monitor and analyze trading opportunities. No trades are executed automatically.</p>
      
      <div className="space-y-6">
          {/* Create Intent (Dev) Button */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-200">Trading Intents</h2>
              <p className="text-sm text-slate-400">Trading intents created from AI predictions in Studio</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  if (!publicKey) return
                  const base58 = publicKey
                  
                  // leserekkefølge
                  let raw = readIntentsV2(base58)
                  if (!raw?.length) raw = readIntentsV1(base58)
                  if (!raw?.length) {
                    const scan = readIntentsScanAll(base58)
                    if (scan?.items?.length) {
                      raw = scan.items
                    }
                  }
                  
                  const normalized = (Array.isArray(raw) ? raw : []).map(normalizeIntent).filter(Boolean)
                  const sorted = [...normalized].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
                  setPerWalletIntents(sorted)
                }}
                className="px-3 py-2 rounded bg-neutral-800 text-sm"
              >
                Reload
              </button>
              <Link
                href="/studio"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Open Studio
              </Link>
            </div>
          </div>


          {/* Edit Intent Form */}
          {showEditIntent && editingIntent && (
            <EditIntentForm
              intent={editingIntent}
              onUpdateIntent={handleUpdateIntent}
              onCancel={handleCancelEditIntent}
            />
          )}

          {/* Trading Intent Composer */}
          {showComposer && draft && (
            <TradingIntentComposer
              draft={draft}
              onCreateIntent={handleCreateIntent}
              onCancel={handleCancelComposer}
            />
          )}

          {/* Show draft button when we have a draft but composer is not shown */}
          {draft && !showComposer && (
            <div className="rounded-xl border border-orange-600 bg-orange-900/20 p-4 text-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-orange-300">🎯 Trading Draft Ready</h3>
                  <p className="text-sm text-slate-400">
                    {draft.assetSymbol} {draft.direction} • {draft.probability}% probability
                  </p>
                </div>
                <button
                  onClick={() => setShowComposer(true)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Open Composer
                </button>
              </div>
            </div>
          )}

          {/* User Intents List */}
          <UserIntentsList 
            intents={perWalletIntents}
            onRemoveIntent={handleRemoveIntent}
            onSimulate={(intentId) => {
              // TODO: Implement simulation
            }}
            onExecute={(intentId) => {
              // TODO: Implement execution
            }}
            onEdit={(intentId) => {
              // TODO: Implement editing
            }}
            isWalletConnected={isConnected}
          />

          {/* New Intents System - Wallet-aware intents */}
          {newIntents.length > 0 && (
            <div className="rounded-xl border border-blue-600 bg-blue-900/20 p-6 text-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-blue-300">
                  📊 Wallet Intents {publicKey ? `(${publicKey.slice(0, 8)}...)` : '(Guest)'}
                </h2>
                <span className="text-sm text-blue-400">{newIntents.length} intent{newIntents.length !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="space-y-3">
                {newIntents.map((intent) => (
                  <div key={intent.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-semibold text-slate-200">{intent.symbol}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          intent.direction === 'Long' ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                        }`}>
                          {intent.direction}
                        </span>
                        <span className="text-sm text-blue-400">{intent.probability}%</span>
                        <span className="text-sm text-purple-400">{intent.confidence}% conf</span>
                      </div>
                      <button
                        onClick={() => handleRemoveNewIntent(intent.id)}
                        className="text-slate-400 hover:text-red-400 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="text-sm text-slate-300 mb-2">
                      {intent.thesis}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <span>Horizon: {intent.horizon}</span>
                      <span>Created: {new Date(intent.createdAt).toLocaleString()}</span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleSimulateNewIntent(intent.id)}
                        className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded text-sm hover:bg-blue-600/30 transition-colors"
                      >
                        Simulate
                      </button>
                      <button 
                        onClick={() => handleEditNewIntent(intent.id)}
                        className="px-3 py-1 bg-slate-600/20 text-slate-400 rounded text-sm hover:bg-slate-600/30 transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleExecuteNewIntent(intent.id)}
                        disabled={!isConnected}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          isConnected 
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
          )}

          {/* Dev Intents System - Development intents */}
          {devIntents.length > 0 && (
            <div className="rounded-xl border border-purple-600 bg-purple-900/20 p-6 text-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-purple-300">
                  🚀 Dev Intents {publicKey ? `(${publicKey.slice(0, 8)}...)` : '(Guest)'}
                </h2>
                <span className="text-sm text-purple-400">{devIntents.length} intent{devIntents.length !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="space-y-3">
                {devIntents.map((intent) => (
                  <div key={intent.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-semibold text-slate-200">{intent.symbol}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          intent.direction === 'Long' ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                        }`}>
                          {intent.direction}
                        </span>
                        <span className="text-sm text-blue-400">{intent.probability}%</span>
                        <span className="text-sm text-purple-400">{intent.confidence}% conf</span>
                      </div>
                      <span className="text-xs text-slate-500">Dev</span>
                    </div>
                    
                    <div className="text-sm text-slate-300 mb-2">
                      {intent.thesis}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <span>Horizon: {intent.horizon}</span>
                      <span>Created: {new Date(intent.createdAt).toLocaleString()}</span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {}}
                        className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded text-sm hover:bg-blue-600/30 transition-colors"
                      >
                        Simulate
                      </button>
                      <button 
                        onClick={() => {}}
                        className="px-3 py-1 bg-slate-600/20 text-slate-400 rounded text-sm hover:bg-slate-600/30 transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => {}}
                        disabled={!isConnected}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          isConnected 
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
          )}

          {/* Per-Wallet Intents from Studio */}
          <div className="rounded-xl border border-slate-700 p-6 text-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Trading Intents from Studio</h3>
              <button
                onClick={() => {
                  if (!publicKey) return
                  const base58 = publicKey
                  
                  // leserekkefølge
                  let raw = readIntentsV2(base58)
                  if (!raw?.length) raw = readIntentsV1(base58)
                  if (!raw?.length) {
                    const scan = readIntentsScanAll(base58)
                    if (scan?.items?.length) {
                      raw = scan.items
                    }
                  }
                  
                  const normalized = (Array.isArray(raw) ? raw : []).map(normalizeIntent).filter(Boolean)
                  const sorted = [...normalized].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
                  setPerWalletIntents(sorted)
                }}
                className="px-3 py-2 rounded bg-slate-800 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Reload
              </button>
            </div>

            {!isConnected ? (
              <p className="text-sm text-slate-400">Connect Phantom to view your saved intents.</p>
            ) : (() => {
              const ui = Array.isArray(perWalletIntents) ? perWalletIntents : []
              const sorted = [...ui].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
              return sorted.length > 0 ? (
                <ul className="space-y-2">
                  {sorted.map(i => (
                    <li key={i.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-600">
                      {/* bruk kun normaliserte felter */}
                      <div className="text-sm font-medium text-slate-200">{i.title}</div>
                      <div className="text-xs text-slate-500 mt-1">Created {new Date(i.createdAt).toLocaleString()}</div>
                      {i?.payload?.predictionId && (
                        <div className="text-xs text-blue-400 mt-1">Prediction ID: {String(i.payload.predictionId)}</div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">No trading intents yet.</p>
              )
            })()}
          </div>

          {/* Empty State - when no composer, no draft, and no intents */}
          {!showComposer && !showDraft && perWalletIntents.length === 0 && (
            <div className="rounded-xl border border-slate-700 p-8 text-center text-slate-200">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-xl font-semibold text-slate-200 mb-2">No trading intents yet</h3>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  Create AI predictions in Studio, then click "🚀 Trade This Prediction" to generate trading intents. This is the only way to create new intents.
                </p>
                <a
                  href="/studio"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Open Studio
                </a>
              </div>
            </div>
          )}

          {/* Draft from Studio */}
          {showDraft && draft && !showComposer && (
            <div className="rounded-xl border border-orange-600 bg-orange-900/20 p-6 text-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-orange-300">🚀 Trade This Prediction</h2>
                <button
                  onClick={() => {
                    clearDraft()
                    setShowDraft(false)
                  }}
                  className="text-slate-400 hover:text-slate-200 text-sm"
                >
                  ✕ Clear
                </button>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wide">Asset</label>
                    <div className="text-lg font-semibold text-orange-300">{draft.assetSymbol}</div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wide">Direction</label>
                    <div className={`text-lg font-semibold ${draft.direction === 'Long' ? 'text-green-400' : 'text-red-400'}`}>
                      {draft.direction}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wide">Probability</label>
                    <div className="text-lg font-semibold text-blue-400">{draft.probability}%</div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wide">Confidence</label>
                    <div className="text-lg font-semibold text-purple-400">{draft.confidence}%</div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Thesis</label>
                  <div className="text-sm text-slate-300 leading-relaxed">{draft.thesis}</div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Horizon: {draft.horizonDays} days</span>
                  <span>Created: {new Date(draft.createdAt).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
                  Simulate Trade
                </button>
                <button className="flex-1 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors font-medium">
                  Save for Later
                </button>
              </div>
            </div>
          )}
          
          <div className="rounded-xl border border-slate-700 p-6 text-slate-200">
            <h2 className="text-lg font-semibold mb-4">Recommended Actions</h2>
            <div className="space-y-4">
              <div className="bg-slate-800/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Portfolio Rebalancing</h3>
                  <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">Medium Priority</span>
                </div>
                <p className="text-sm text-slate-400">Consider rebalancing your portfolio based on current market conditions and your risk tolerance.</p>
              </div>
              
              <div className="bg-slate-800/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">DCA Strategy</h3>
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Low Risk</span>
                </div>
                <p className="text-sm text-slate-400">Implement a dollar-cost averaging strategy for stable long-term growth.</p>
              </div>
                
              <div className="bg-slate-800/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Stop Loss Setup</h3>
                  <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">High Priority</span>
                </div>
                <p className="text-sm text-slate-400">Set up stop-loss orders to protect your investments from significant downturns.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 p-6 text-slate-200">
            <h2 className="text-lg font-semibold mb-4">Market Signals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Bullish Signals</h3>
                <ul className="text-sm space-y-1 text-green-400">
                  <li>• Market sentiment improving</li>
                  <li>• Volume increasing</li>
                  <li>• Technical indicators positive</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Bearish Signals</h3>
                <ul className="text-sm space-y-1 text-red-400">
                  <li>• High volatility detected</li>
                  <li>• Resistance levels approaching</li>
                  <li>• Market uncertainty rising</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
    </main>
  )
}