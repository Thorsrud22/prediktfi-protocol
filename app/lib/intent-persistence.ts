/**
 * Intent Persistence Utilities
 * Handles saving and loading trading intents to/from localStorage
 * 
 * Guardrails:
 * - Only accesses localStorage in client-side effects (SSR safe)
 * - Includes version key for future migrations
 * - Comprehensive error handling and validation
 */

export interface TradingIntent {
  id: string
  assetSymbol: string
  direction: 'Long' | 'Short'
  confidence: number
  probability: number
  horizonDays: number
  thesis: string
  createdAt: number
}

// Version key for future migrations
const STORAGE_KEY = 'predikt:intents:v1'

/**
 * Generate a stable UUID for an intent
 */
export function generateIntentId(): string {
  return crypto.randomUUID()
}

/**
 * Persist an intent to localStorage
 * Generates a stable ID if not provided
 * SSR safe - only accesses localStorage on client side
 */
export function persistIntent(intent: Omit<TradingIntent, 'id'> & { id?: string }): TradingIntent {
  const intentWithId: TradingIntent = {
    ...intent,
    id: intent.id || generateIntentId()
  }

  // SSR guardrail - only access localStorage in client-side effects
  if (typeof window === 'undefined') {
    console.warn('[IntentPersistence] persistIntent called on server side, skipping localStorage save')
    return intentWithId
  }

  try {
    // Load existing intents
    const existing = loadIntents()
    
    // Add new intent to the beginning (newest first)
    const updatedIntents = [intentWithId, ...existing]
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedIntents))
    
    // Console log for debugging
    console.info('[Intent] saved', intentWithId.id)
    console.log('[IntentPersistence] Intent saved:', {
      id: intentWithId.id,
      asset: intentWithId.assetSymbol,
      direction: intentWithId.direction,
      totalIntents: updatedIntents.length
    })
    
    return intentWithId
  } catch (error) {
    console.error('[IntentPersistence] Failed to save intent:', error)
    throw new Error('Failed to save intent to localStorage')
  }
}

/**
 * Load all intents from localStorage
 * Returns empty array if no intents or on error
 * SSR safe - only accesses localStorage on client side
 */
export function loadIntents(): TradingIntent[] {
  // SSR guardrail - only access localStorage in client-side effects
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }
    
    const intents = JSON.parse(stored)
    
    // Validate that it's an array
    if (!Array.isArray(intents)) {
      console.warn('[IntentPersistence] Invalid intents data in localStorage, resetting')
      localStorage.removeItem(STORAGE_KEY)
      return []
    }
    
    // Validate each intent has required fields
    const validIntents = intents.filter((intent: any) => {
      return intent && 
             typeof intent.id === 'string' &&
             typeof intent.assetSymbol === 'string' &&
             (intent.direction === 'Long' || intent.direction === 'Short') &&
             typeof intent.confidence === 'number' &&
             typeof intent.probability === 'number' &&
             typeof intent.horizonDays === 'number' &&
             typeof intent.thesis === 'string' &&
             typeof intent.createdAt === 'number'
    })
    
    if (validIntents.length !== intents.length) {
      console.warn('[IntentPersistence] Some intents were invalid, filtering them out')
      // Save the cleaned intents back
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validIntents))
    }
    
    // Console log for debugging
    console.info('[Intent] loaded', validIntents.length)
    
    return validIntents
  } catch (error) {
    console.error('[IntentPersistence] Failed to load intents:', error)
    return []
  }
}

/**
 * Remove an intent by ID from localStorage
 */
export function removeIntent(intentId: string): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const intents = loadIntents()
    const filteredIntents = intents.filter(intent => intent.id !== intentId)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredIntents))
    
    console.log('[IntentPersistence] Intent removed:', {
      id: intentId,
      remainingIntents: filteredIntents.length
    })
  } catch (error) {
    console.error('[IntentPersistence] Failed to remove intent:', error)
  }
}

/**
 * Clear all intents from localStorage
 */
export function clearAllIntents(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log('[IntentPersistence] All intents cleared')
  } catch (error) {
    console.error('[IntentPersistence] Failed to clear intents:', error)
  }
}
