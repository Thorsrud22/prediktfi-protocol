// Tiny storage helpers (client-only)
type DevIntent = {
  id: string;                  // e.g. Date.now().toString()
  owner: string;               // wallet publicKey (base58)
  symbol: string;              // 'BTC', 'ETH', 'SOL', ...
  direction: 'Long' | 'Short';
  probability: number;         // from analysis
  confidence: number;          // slider value
  thesis: string;              // text
  horizon: string;             // '30d', etc.
  createdAt: number;
};

const intentsKey = (owner: string) => `predikt:intents:${owner}`;

export function saveDevIntent(intent: DevIntent) {
  if (!intent.owner) return;
  const key = intentsKey(intent.owner);
  const list: DevIntent[] = JSON.parse(localStorage.getItem(key) || '[]');
  // de-dup by id
  const next = [intent, ...list.filter(i => i.id !== intent.id)].slice(0, 50);
  localStorage.setItem(key, JSON.stringify(next));
}

export function loadDevIntents(owner: string): DevIntent[] {
  if (!owner) return [];
  return JSON.parse(localStorage.getItem(intentsKey(owner)) || '[]');
}

export function removeDevIntent(owner: string, id: string) {
  if (!owner) return;
  const key = intentsKey(owner);
  const list: DevIntent[] = JSON.parse(localStorage.getItem(key) || '[]');
  localStorage.setItem(key, JSON.stringify(list.filter(i => i.id !== id)));
}

export type { DevIntent };
