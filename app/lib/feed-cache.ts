export type FeedItem = {
  id: string;
  createdAt: number;           // ms epoch
  title: string;
  category: 'crypto' | 'stocks' | 'tech' | 'politics' | 'sports' | 'general' | 'studio' | 'dev' | 'wallet';
  probability: number;         // 0-100
  confidence: number;          // 0-100
  source: 'studio' | 'dev' | 'wallet' | 'server';
};

export const FEED_KEY = 'predikt:feed:v1';

export function loadLocalFeed(): FeedItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    return JSON.parse(localStorage.getItem(FEED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveLocalFeed(items: FeedItem[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(FEED_KEY, JSON.stringify(items));
  } catch {
    // Silent fail
  }
}

export function pushLocalFeed(item: FeedItem): void {
  if (typeof window === 'undefined') return;
  
  try {
    const arr = loadLocalFeed();
    arr.unshift(item);
    saveLocalFeed(arr);
    console.log('[Feed:push]', item, 'size=', arr.length);
  } catch {
    // Silent fail
  }
}
