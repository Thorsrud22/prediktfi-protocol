'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { upsertIntent, type TradingIntent as NewTradingIntent } from '../lib/wallet-intent-persistence'
import { useIntentDraft } from '../lib/store/intent-draft-store'

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
    createdAt: Date.now()
  };
}

export default function TradeButton({ children, className, title, disabled, insight }: TradeButtonProps) {
  const router = useRouter()
  const { publicKey } = useWallet()
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
          upsertIntent(publicKey.toBase58(), newIntent);
          
          console.log('[Trade] Intent created and saved to wallet storage:', { 
            id: newIntent.id, 
            symbol: newIntent.symbol, 
            direction: newIntent.direction,
            probability: newIntent.probability,
            confidence: newIntent.confidence,
            wallet: publicKey.toBase58().slice(0, 8) + '...'
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
