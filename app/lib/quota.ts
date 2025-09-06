// Client-side quota management for free users
interface QuotaData {
  date: string; // YYYYMMDD
  used: number;
  limit: number;
}

const DEFAULT_FREE_LIMIT = 999999; // Unlimited for development
const QUOTA_KEY_PREFIX = 'predikt:quota:';

function getTodayKey(): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${QUOTA_KEY_PREFIX}${yyyy}${mm}${dd}`;
}

function getStoredQuota(): QuotaData | null {
  if (typeof window === 'undefined') return null;
  
  const key = getTodayKey();
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function setStoredQuota(quota: QuotaData): void {
  if (typeof window === 'undefined') return;
  
  const key = getTodayKey();
  localStorage.setItem(key, JSON.stringify(quota));
}

export function getQuota(): {
  used: number;
  limit: number;
  remaining: number;
  resetAtIso: string;
} {
  const stored = getStoredQuota();
  const limit = stored?.limit || DEFAULT_FREE_LIMIT;
  const used = stored?.used || 0;
  
  // Reset time is tomorrow at midnight
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetAtIso: tomorrow.toISOString()
  };
}

export function bumpQuota(): boolean {
  const current = getQuota();
  if (current.remaining <= 0) return false;
  
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  
  const newQuota: QuotaData = {
    date: dateStr,
    used: current.used + 1,
    limit: current.limit
  };
  
  setStoredQuota(newQuota);
  return true;
}

export function resetIfNewDay(): void {
  const stored = getStoredQuota();
  if (!stored) return;
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  
  if (stored.date !== todayStr) {
    // New day, reset quota
    const newQuota: QuotaData = {
      date: todayStr,
      used: 0,
      limit: stored.limit || DEFAULT_FREE_LIMIT
    };
    setStoredQuota(newQuota);
  }
}

export function isExhausted(): boolean {
  const quota = getQuota();
  return quota.remaining <= 0;
}

export function setLimitForTesting(newLimit: number): void {
  if (typeof window === 'undefined') return;
  
  const current = getStoredQuota();
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  
  const quota: QuotaData = {
    date: dateStr,
    used: current?.used || 0,
    limit: newLimit
  };
  
  setStoredQuota(quota);
}

export function resetQuotaForUpgrade(): void {
  if (typeof window === 'undefined') return;
  
  // Clear all quota keys to reset limits after upgrade
  const keys = Object.keys(localStorage).filter(key => key.startsWith(QUOTA_KEY_PREFIX));
  keys.forEach(key => localStorage.removeItem(key));
}

export function resetQuotaForDevelopment(): void {
  if (typeof window === 'undefined') return;
  
  // Clear all quota keys for development
  const keys = Object.keys(localStorage).filter(key => key.startsWith(QUOTA_KEY_PREFIX));
  keys.forEach(key => localStorage.removeItem(key));
  
  // Set unlimited quota for development
  setLimitForTesting(999999);
}
