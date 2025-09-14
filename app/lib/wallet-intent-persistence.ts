// Wallet Intent Persistence - v1 and v2 storage systems
// v1: Global storage (legacy)
// v2: Per-wallet storage (new)

export type TradingIntent = {
  id: string;
  createdAt: number;
  title: string;
  side?: "long" | "short";
  symbol?: string;
  direction?: "Long" | "Short";
  probability?: number;
  confidence?: number;
  horizon?: string;
  thesis?: string;
  payload: Record<string, unknown>;
};

export type V2TradingIntent = {
  id: string;
  createdAt: number;
  title: string;
  side?: "long" | "short";
  symbol?: string;
  direction?: "Long" | "Short";
  probability?: number;
  confidence?: number;
  horizon?: string;
  thesis?: string;
  payload: Record<string, unknown>;
};

// v1 Global storage functions
export function loadIntents(): TradingIntent[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const raw = localStorage.getItem('predikt:intents');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveIntents(intents: TradingIntent[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('predikt:intents', JSON.stringify(intents));
  } catch {
    // Silent fail
  }
}

export function upsertIntent(pubkey: string, intent: TradingIntent): TradingIntent[] {
  const intents = loadIntents();
  const existingIndex = intents.findIndex(i => i.id === intent.id);
  
  if (existingIndex >= 0) {
    intents[existingIndex] = intent;
  } else {
    intents.unshift(intent);
  }
  
  saveIntents(intents);
  return intents;
}

// v2 Per-wallet storage functions
function normalizePubkey(pubkey: string): string {
  return pubkey.trim();
}

export function loadIntentsForV2(pubkey: string): V2TradingIntent[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const normalizedPubkey = normalizePubkey(pubkey);
    const v2Key = `predikt:intents:v2:${normalizedPubkey}`;
    const raw = localStorage.getItem(v2Key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveIntentsForV2(pubkey: string, intents: V2TradingIntent[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    const normalizedPubkey = normalizePubkey(pubkey);
    const v2Key = `predikt:intents:v2:${normalizedPubkey}`;
    localStorage.setItem(v2Key, JSON.stringify(intents));
  } catch {
    // Silent fail
  }
}

export function upsertIntentForV2(pubkey: string, intent: V2TradingIntent): V2TradingIntent[] {
  const normalizedPubkey = normalizePubkey(pubkey);
  const intents = loadIntentsForV2(normalizedPubkey);
  
  const existingIndex = intents.findIndex(i => i.id === intent.id);
  
  if (existingIndex >= 0) {
    intents[existingIndex] = intent;
  } else {
    intents.unshift(intent);
  }
  
  saveIntentsForV2(normalizedPubkey, intents);
  
  console.log(`[WalletIntentPersistence:v2] Saved ${intents.length} intents with key: ${normalizedPubkey}`);
  return intents;
}

// Utility functions
export function clearIntentsForWallet(pubkey: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const normalizedPubkey = normalizePubkey(pubkey);
    const v2Key = `predikt:intents:v2:${normalizedPubkey}`;
    localStorage.removeItem(v2Key);
  } catch {
    // Silent fail
  }
}

export function removeIntent(pubkey: string, intentId: string): V2TradingIntent[] {
  const normalizedPubkey = normalizePubkey(pubkey);
  const intents = loadIntentsForV2(normalizedPubkey);
  const filteredIntents = intents.filter(intent => intent.id !== intentId);
  
  saveIntentsForV2(normalizedPubkey, filteredIntents);
  return filteredIntents;
}

export function getAllWalletKeys(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith('predikt:intents:v2:'))
      .map(key => key.replace('predikt:intents:v2:', ''));
  } catch {
    // If an error occurs (e.g., localStorage is unavailable), return an empty array.
    return [];
  }
}

// Add missing getWalletKeysWithIntents function
export function getWalletKeysWithIntents(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith('predikt:intents:v2:'))
      .map(key => key.replace('predikt:intents:v2:', ''))
      .filter(pubkey => {
        const intents = loadIntentsForV2(pubkey);
        return intents.length > 0;
      });
  } catch {
    return [];
  }
}