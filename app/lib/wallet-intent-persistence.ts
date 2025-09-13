/**
 * Wallet-Keyed Intent Persistence Utilities
 * Handles saving and loading trading intents to/from localStorage keyed by wallet pubkey
 * 
 * Features:
 * - Keys intents by wallet pubkey (falls back to '__no_wallet__' if no wallet)
 * - Safe JSON parsing with fallback to empty array
 * - SSR safe - only accesses localStorage on client side
 * - Comprehensive error handling and validation
 */

export interface TradingIntent {
  id: string;
  symbol: string;
  direction: 'Long' | 'Short';
  probability: number; // %
  confidence: number;  // %
  horizon: string;     // e.g. "30d"
  thesis: string;
  createdAt: number;
}

/**
 * Normalize pubkey to string format
 * Handles both PublicKey objects and strings
 */
function normalizePubkey(pubkey?: string | any): string | undefined {
  if (!pubkey) return undefined;
  if (typeof pubkey === 'string') return pubkey;
  if (pubkey.toBase58) return pubkey.toBase58();
  return String(pubkey);
}

/**
 * Get the localStorage key for a wallet's intents
 */
function getStorageKey(pubkey?: string | any): string {
  const normalizedPubkey = normalizePubkey(pubkey);
  const walletKey = normalizedPubkey || '__no_wallet__';
  return `predikt:intents:${walletKey}`;
}

/**
 * Safe JSON parse with fallback
 */
function safeParse<T>(input: string | null, fallback: T): T {
  if (!input) return fallback;
  try {
    return JSON.parse(input);
  } catch (error) {
    console.warn('[WalletIntentPersistence] Failed to parse JSON:', error);
    return fallback;
  }
}

/**
 * Load intents for a specific wallet
 * @param pubkey - Wallet public key (base58 string or PublicKey object)
 * @returns Array of trading intents
 */
export function loadIntents(pubkey?: string | any): TradingIntent[] {
  // SSR guardrail - only access localStorage on client side
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    // If no pubkey provided, try to find intents from any wallet
    if (!pubkey) {
      console.log('[WalletIntentPersistence] No pubkey provided, searching for intents from any wallet');
      return loadIntentsFromAnyWallet();
    }

    const key = getStorageKey(pubkey);
    const stored = localStorage.getItem(key);
    const intents = safeParse<TradingIntent[]>(stored, []);
    
    // Validate that it's an array
    if (!Array.isArray(intents)) {
      console.warn('[WalletIntentPersistence] Invalid intents data, resetting');
      localStorage.removeItem(key);
      return [];
    }
    
    // Validate each intent has required fields
    const validIntents = intents.filter((intent: any) => {
      return intent && 
             typeof intent.id === 'string' &&
             typeof intent.symbol === 'string' &&
             (intent.direction === 'Long' || intent.direction === 'Short') &&
             typeof intent.confidence === 'number' &&
             typeof intent.probability === 'number' &&
             typeof intent.horizon === 'string' &&
             typeof intent.thesis === 'string' &&
             typeof intent.createdAt === 'number';
    });
    
    if (validIntents.length !== intents.length) {
      console.warn('[WalletIntentPersistence] Some intents were invalid, filtering them out');
      // Save the cleaned intents back
      localStorage.setItem(key, JSON.stringify(validIntents));
    }
    
    const normalizedPubkey = normalizePubkey(pubkey);
    console.log(`[WalletIntentPersistence] Loaded ${validIntents.length} intents for wallet: ${normalizedPubkey?.slice(0, 8) || 'no_wallet'}...`);
    
    return validIntents;
  } catch (error) {
    console.error('[WalletIntentPersistence] Failed to load intents:', error);
    return [];
  }
}

/**
 * Load intents from any wallet when pubkey is not available
 * This is useful during page refresh when wallet connection is still initializing
 */
function loadIntentsFromAnyWallet(): TradingIntent[] {
  try {
    const allIntents: TradingIntent[] = [];
    
    // Search through all localStorage keys for intent data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('predikt:intents:')) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const intents = safeParse<TradingIntent[]>(stored, []);
          if (Array.isArray(intents)) {
            // Validate each intent has required fields
            const validIntents = intents.filter((intent: any) => {
              return intent && 
                     typeof intent.id === 'string' &&
                     typeof intent.symbol === 'string' &&
                     (intent.direction === 'Long' || intent.direction === 'Short') &&
                     typeof intent.confidence === 'number' &&
                     typeof intent.probability === 'number' &&
                     typeof intent.horizon === 'string' &&
                     typeof intent.thesis === 'string' &&
                     typeof intent.createdAt === 'number';
            });
            allIntents.push(...validIntents);
          }
        }
      }
    }
    
    // Sort by creation time (newest first)
    allIntents.sort((a, b) => b.createdAt - a.createdAt);
    
    console.log(`[WalletIntentPersistence] Loaded ${allIntents.length} intents from any wallet`);
    return allIntents;
  } catch (error) {
    console.error('[WalletIntentPersistence] Failed to load intents from any wallet:', error);
    return [];
  }
}

/**
 * Save intents for a specific wallet
 * @param pubkey - Wallet public key (base58 string or PublicKey object)
 * @param intents - Array of trading intents to save
 */
export function saveIntents(pubkey: string | any, intents: TradingIntent[]): void {
  // SSR guardrail - only access localStorage on client side
  if (typeof window === 'undefined') {
    console.warn('[WalletIntentPersistence] saveIntents called on server side, skipping localStorage save');
    return;
  }

  try {
    const key = getStorageKey(pubkey);
    localStorage.setItem(key, JSON.stringify(intents));
    const normalizedPubkey = normalizePubkey(pubkey);
    console.log(`[WalletIntentPersistence] Saved ${intents.length} intents for wallet: ${normalizedPubkey?.slice(0, 8) || 'no_wallet'}...`);
  } catch (error) {
    console.error('[WalletIntentPersistence] Failed to save intents:', error);
    throw new Error('Failed to save intents to localStorage');
  }
}

/**
 * Add or update an intent for a specific wallet
 * @param pubkey - Wallet public key (base58 string or PublicKey object)
 * @param intent - Trading intent to add or update
 */
export function upsertIntent(pubkey: string | any, intent: TradingIntent): void {
  try {
    const intents = loadIntents(pubkey);
    
    // Find existing intent by ID
    const existingIndex = intents.findIndex(i => i.id === intent.id);
    
    const normalizedPubkey = normalizePubkey(pubkey);
    if (existingIndex >= 0) {
      // Update existing intent
      intents[existingIndex] = intent;
      console.log(`[WalletIntentPersistence] Updated intent ${intent.id} for wallet: ${normalizedPubkey?.slice(0, 8) || 'no_wallet'}...`);
    } else {
      // Add new intent to the beginning (newest first)
      intents.unshift(intent);
      console.log(`[WalletIntentPersistence] Added intent ${intent.id} for wallet: ${normalizedPubkey?.slice(0, 8) || 'no_wallet'}...`);
    }
    
    saveIntents(pubkey, intents);
  } catch (error) {
    console.error('[WalletIntentPersistence] Failed to upsert intent:', error);
    throw new Error('Failed to save intent');
  }
}

/**
 * Remove an intent by ID for a specific wallet
 * @param pubkey - Wallet public key (base58 string or PublicKey object)
 * @param intentId - ID of the intent to remove
 */
export function removeIntent(pubkey: string | any, intentId: string): void {
  try {
    const intents = loadIntents(pubkey);
    const filteredIntents = intents.filter(intent => intent.id !== intentId);
    
    const normalizedPubkey = normalizePubkey(pubkey);
    if (filteredIntents.length !== intents.length) {
      saveIntents(pubkey, filteredIntents);
      console.log(`[WalletIntentPersistence] Removed intent ${intentId} for wallet: ${normalizedPubkey?.slice(0, 8) || 'no_wallet'}...`);
    } else {
      console.warn(`[WalletIntentPersistence] Intent ${intentId} not found for wallet: ${normalizedPubkey?.slice(0, 8) || 'no_wallet'}...`);
    }
  } catch (error) {
    console.error('[WalletIntentPersistence] Failed to remove intent:', error);
    throw new Error('Failed to remove intent');
  }
}

/**
 * Clear all intents for a specific wallet
 * @param pubkey - Wallet public key (base58 string or PublicKey object)
 */
export function clearIntents(pubkey: string | any): void {
  // SSR guardrail - only access localStorage on client side
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const key = getStorageKey(pubkey);
    localStorage.removeItem(key);
    const normalizedPubkey = normalizePubkey(pubkey);
    console.log(`[WalletIntentPersistence] Cleared all intents for wallet: ${normalizedPubkey?.slice(0, 8) || 'no_wallet'}...`);
  } catch (error) {
    console.error('[WalletIntentPersistence] Failed to clear intents:', error);
  }
}

/**
 * Get all wallet keys that have stored intents
 * @returns Array of wallet pubkeys that have intents stored
 */
export function getWalletKeysWithIntents(): string[] {
  // SSR guardrail - only access localStorage on client side
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('predikt:intents:')) {
        const walletKey = key.replace('predikt:intents:', '');
        if (walletKey !== '__no_wallet__') {
          keys.push(walletKey);
        }
      }
    }
    return keys;
  } catch (error) {
    console.error('[WalletIntentPersistence] Failed to get wallet keys:', error);
    return [];
  }
}
