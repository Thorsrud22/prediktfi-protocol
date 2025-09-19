'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSimplifiedWallet } from './wallet/SimplifiedWalletProvider'
import { upsertIntent, upsertIntentForV2, type TradingIntent as NewTradingIntent } from '../lib/wallet-intent-persistence'
import { useIntentDraft } from '../lib/store/intent-draft-store'

// v2 helpers scoped in denne fila
type TradingIntent = {
  id: string
  createdAt: number
  title: string
  side?: "long" | "short"
  payload: Record<string, unknown>
}



// Helpers for per-wallet intent storage in localStorage (legacy v1)
function intentsKey(base58?: string | null) {
  return base58 ? `predikt:intents:${base58}` : null
}

function loadIntentsFor(base58?: string | null): TradingIntent[] {
  try {
    const k = intentsKey(base58)
    if (!k) return []
    const raw = localStorage.getItem(k)
    return raw ? (JSON.parse(raw) as TradingIntent[]) : []
  } catch {
    return []
  }
}

function saveIntentsFor(base58: string | null | undefined, intents: TradingIntent[]) {
  try {
    const k = intentsKey(base58)
    if (!k) return
    localStorage.setItem(k, JSON.stringify(intents))
  } catch {}
}

function upsertIntentFor(base58: string, intent: TradingIntent) {
  const list = loadIntentsFor(base58)
  const i = list.findIndex(x => x.id === intent.id)
  if (i >= 0) list[i] = intent
  else list.unshift(intent)
  saveIntentsFor(base58, list)
  return list
}

interface InsightResponse {
  probability: number; // 0 to 1
  confidence: number; // 0 to 1
  rationale: string;
  scenarios?: Array<{
    label: string;
    probability: number;
    drivers: string[];
  }>;
  p?: number; // Alternative probability field
  reasoning?: string; // Alternative rationale field
  analysis?: any; // Advanced analysis data
}

interface TradeButtonProps {
  children: React.ReactNode
  className?: string
  title?: string
  disabled?: boolean
  insight?: InsightResponse | null
}

// Helper function to extract asset symbol from insight text
function extractAssetSymbol(text: string): string {
  const assets = ['BTC', 'ETH', 'SOL', 'AVAX', 'XRP', 'ADA', 'DOGE'];
  
  // Look for assets in the text (case insensitive)
  const upperText = text.toUpperCase();
  for (const asset of assets) {
    if (upperText.includes(asset)) {
      return asset;
    }
  }
  
  // Fallback to BTC
  return 'BTC';
}

// Helper function to build TradeDraft from InsightResponse
function buildTradeDraftFromInsight(insight: InsightResponse) {
  // Use either probability or p field
  const probValue = insight.probability || insight.p || 0.5;
  const confValue = insight.confidence || 0.5;
  const rationaleText = insight.rationale || insight.reasoning || '';
  
  // Extract asset symbol from rationale text
  const assetSymbol = extractAssetSymbol(rationaleText);
  
  // Map direction based on probability
  const direction: 'Long' | 'Short' = probValue >= 0.5 ? 'Long' : 'Short';
  
  // Convert to percentages (0-100)
  const probability = Math.round(probValue * 100);
  const confidence = Math.round(confValue * 100);
  
  // Extract thesis from first few lines of rationale (Executive Summary)
  const rationaleLines = rationaleText.split('\n').filter(line => line.trim());
  const thesis = rationaleLines
    .slice(0, 3) // Take first 3 lines
    .join(' ')
    .replace(/\*\*/g, '') // Remove markdown formatting
    .replace(/#{1,6}\s*/g, '') // Remove markdown headers
    .trim();
  
  return {
    assetSymbol,
    direction,
    probability,
    confidence,
    thesis: thesis || `${direction} position on ${assetSymbol} with ${probability}% probability`,
    horizonDays: 30, // Default
  };
}

// Helper function to convert TradeDraft to NewTradingIntent
function convertDraftToNewIntent(draft: ReturnType<typeof buildTradeDraftFromInsight>): NewTradingIntent {
  return {
    id: `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    symbol: draft.assetSymbol,
    direction: draft.direction,
    probability: draft.probability,
    confidence: draft.confidence,
    horizon: `${draft.horizonDays}d`,
    thesis: draft.thesis,
    createdAt: Date.now(),
    title: `${draft.direction} ${draft.assetSymbol}`,
    payload: {
      symbol: draft.assetSymbol,
      direction: draft.direction,
      probability: draft.probability,
      confidence: draft.confidence
    }
  };
}

export default function TradeButton({ children, className, title, disabled, insight }: TradeButtonProps) {
  const router = useRouter()
  const { publicKey } = useSimplifiedWallet()
  const { setDraft, createDraft } = useIntentDraft()

  const handleClick = useCallback(async () => {
    if (disabled) return

    // Build draft from insight if available
    if (insight) {
      try {
        const draftData = buildTradeDraftFromInsight(insight);
        
        // Create draft in the draft store for backward compatibility
        const draft = createDraft(draftData);
        setDraft(draft);
        
        // Also save to wallet-keyed storage if wallet is connected
        if (publicKey) {
          const newIntent = convertDraftToNewIntent(draftData);
          upsertIntent(publicKey, newIntent);
          
          // Save using the new v2 per-wallet storage system
          const base58 = publicKey;
          const intent: TradingIntent = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
            createdAt: Date.now(),
            title: `${draftData.direction} ${draftData.assetSymbol}`,
            side: draftData.direction.toLowerCase() as "long" | "short",
            payload: { 
              predictionId: newIntent.id,
              symbol: draftData.assetSymbol,
              assetSymbol: draftData.assetSymbol,
              category: 'Crypto', // Default category for now
              probability: draftData.probability,
              confidence: draftData.confidence,
              side: draftData.direction.toLowerCase(),
              mode: "dev"
            }
          };
          const after = upsertIntentForV2(base58, intent);
          console.log("[Trade:v2] saved len:", after.length, "key:", `predikt:intents:v2:${base58}`);
          
          console.log('[Trade] Intent created and saved to wallet storage:', { 
            id: newIntent.id, 
            symbol: newIntent.symbol, 
            direction: newIntent.direction,
            probability: newIntent.probability,
            confidence: newIntent.confidence,
            wallet: publicKey.slice(0, 8) + '...'
          });
        } else {
          console.log('[Trade] Draft created (no wallet connected):', { 
            asset: draft.assetSymbol, 
            direction: draft.direction,
            probability: draft.probability,
            confidence: draft.confidence
          });
        }
      } catch (error) {
        console.error('[Trade] Failed to create draft from insight:', error);
        // Continue with navigation even if draft creation fails
      }
    }

    // Navigate to actions page
    router.push('/advisor/actions')
  }, [disabled, insight, router, publicKey, setDraft, createDraft])

  return (
    <button
      onClick={handleClick}
      className={className}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
