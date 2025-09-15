'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { loadLocalFeed, type FeedItem } from '../lib/feed-cache';
import { useOptimizedFetch } from '../hooks/useOptimizedFetch';
import { ErrorBoundary, FeedErrorFallback } from '../components/ui/ErrorBoundary';
import { SkeletonCard } from '../components/ui/Skeleton';

// Extended type for items that can come from server API
type ExtendedFeedItem = FeedItem & {
  author?: { handle: string };
  stamped?: boolean;
  status?: string;
  subtitle?: string;
  creator?: { handle: string; score: number };
  question?: string;
};

// Type guards for safe property access
const hasSubtitle = (item: ExtendedFeedItem): item is ExtendedFeedItem & { subtitle: string } => {
  return 'subtitle' in item && typeof item.subtitle === 'string';
};

const hasCreator = (
  item: ExtendedFeedItem,
): item is ExtendedFeedItem & { creator: { handle: string; score: number } } => {
  return 'creator' in item && item.creator != null;
};

const hasStatus = (item: ExtendedFeedItem): item is ExtendedFeedItem & { status: string } => {
  return 'status' in item && typeof item.status === 'string';
};

const hasStamped = (item: ExtendedFeedItem): item is ExtendedFeedItem & { stamped: boolean } => {
  return 'stamped' in item && typeof item.stamped === 'boolean';
};

// ---- Local feed overlay from v2 wallet intents ----
type LocalOverlayItem = {
  id: string;
  title: string;
  subtitle: string;
  probability: number;
  confidence: number;
  createdAt: number;
  category: string;
  author?: { handle: string };
  _source: 'localIntentV2';
};

function parseAssetSymbolFrom(title?: string): string | undefined {
  if (!title) return;
  const m = title.match(/\b([A-Z]{2,6})(?:\/[A-Z]{2,6})?\b/);
  return m?.[1];
}

function normN(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function deriveFromSideAndAsset(side?: string, assetSymbol?: string): string {
  const sideText = side === 'long' ? 'Long' : 'Short';
  const asset = assetSymbol || 'Unknown';
  return `${sideText} ${asset}`;
}

function mapIntentToFeedItem(v2Intent: any): LocalOverlayItem {
  const assetSymbol =
    v2Intent.payload?.assetSymbol ||
    v2Intent.payload?.symbol ||
    parseAssetSymbolFrom(v2Intent.title) ||
    'Unknown';

  const side = v2Intent.side;
  const question = v2Intent.payload?.question;

  // Fallback to "Short BTC"/"Long ETH" style if question is missing
  const title = question || v2Intent.title || deriveFromSideAndAsset(side, assetSymbol);

  // Build subtitle with fallback handling
  let subtitle: string;
  if (assetSymbol === 'Unknown') {
    subtitle = `Your intent: ${side?.toUpperCase() || 'UNKNOWN'}`;
  } else {
    subtitle = `Your intent: ${side?.toUpperCase() || 'UNKNOWN'} ${assetSymbol}`;
  }

  // Extract wallet address from the key if available
  const walletAddress = v2Intent._walletAddress || 'Unknown';
  const shortWallet =
    walletAddress.length > 8
      ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
      : walletAddress;

  const mappedItem: LocalOverlayItem = {
    id: `local:${v2Intent.id}`,
    title: title,
    subtitle: subtitle,
    probability: normN(v2Intent.payload?.probability ?? v2Intent.probability, 50),
    confidence: normN(v2Intent.payload?.confidence ?? v2Intent.confidence, 70),
    createdAt: Number(v2Intent.createdAt ?? Date.now()),
    category: String(v2Intent.payload?.category ?? 'General'),
    author: { handle: `You (${shortWallet})` },
    _source: 'localIntentV2' as const,
  };

  // Console logging for testing
  console.log('[Feed:test] mapped item', {
    title: mappedItem.title,
    subtitle: mappedItem.subtitle,
    probability: mappedItem.probability,
    confidence: mappedItem.confidence,
  });

  return mappedItem;
}

function getLocalOverlayFromV2(pubkey?: string): LocalOverlayItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const prefix = 'predikt:intents:v2:';
    const wantedKey = pubkey ? `${prefix}${pubkey}` : undefined;

    const keys = Object.keys(localStorage).filter(
      k => k.startsWith(prefix) && (!wantedKey || k === wantedKey),
    );

    const items: LocalOverlayItem[] = [];

    for (const k of keys) {
      const raw = localStorage.getItem(k);
      const list = raw ? (JSON.parse(raw) as Array<any>) : [];
      for (const it of list) {
        // Add wallet address to the intent for the mapper
        const intentWithWallet = { ...it, _walletAddress: k.replace(prefix, '') };
        items.push(mapIntentToFeedItem(intentWithWallet));
      }
    }

    // Sort by createdAt (newest first) - no pinning
    items.sort((a, b) => b.createdAt - a.createdAt);
    return items;
  } catch (e) {
    console.warn('[FeedOverlay] failed to parse local v2 intents', e);
    return [];
  }
}

function dedupeById<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter(x => (seen.has(x.id) ? false : (seen.add(x.id), true)));
}

function dedupeByPredictionId<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((x: any) => {
    const pid = x?.payload?.predictionId || x.id;
    if (seen.has(pid)) return false;
    seen.add(pid);
    return true;
  });
}

interface FeedInsight {
  id: string;
  question: string;
  canonical?: string;
  category: string;
  probability: number;
  p?: number;
  confidence: number;
  stamped: boolean;
  status?: 'OPEN' | 'COMMITTED' | 'RESOLVED';
  createdAt: string;
  creator?: {
    handle: string;
    score: number;
  };
}

interface FeedResponse {
  insights: FeedInsight[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    current: string;
    available: string[];
  };
  // New fields from enhanced API
  nextCursor: string | null;
  query: string;
  category: string;
  sort: string;
  timeframe: string;
}

export default function FeedPage() {
  // Normalize category to lowercase slug - defined early for use in useMemo
  const normalizeCategory = (category: string): string => {
    return category.toLowerCase().trim();
  };

  const [localItems, setLocalItems] = useState<FeedItem[]>([]);
  const [localOverlayItems, setLocalOverlayItems] = useState<LocalOverlayItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [showMine, setShowMine] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Build API URL with parameters
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: '20',
      category: normalizeCategory(currentFilter),
      sort: 'recent',
    });

    // Add search query only if it's not empty
    if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
      params.set('q', debouncedSearchQuery.trim());
    }

    return `/api/feed?${params}`;
  }, [currentFilter, currentPage, debouncedSearchQuery]);

  // Use optimized fetch with smart caching
  const {
    data: feedData,
    loading,
    error: fetchError,
    refetch,
  } = useOptimizedFetch<FeedResponse>(apiUrl, {
    revalidate: 30, // Cache for 30 seconds
    staleWhileRevalidate: true, // Return cached data immediately, then fetch fresh
    dedupe: true, // Deduplicate identical requests
  });

  // Extract server items from feed data
  const serverItems = useMemo(() => {
    return feedData?.insights || [];
  }, [feedData]);

  // Robust normalization utilities
  const num = (v: any, d = 0) => {
    const n = typeof v === 'string' ? Number(v.replace('%', '')) : Number(v);
    return Number.isFinite(n) ? n : d;
  };

  const mapCategory = (x: any): FeedItem['category'] => {
    const t = String(x || '').toLowerCase();
    if (/crypto|btc|eth|sol|token|coin/.test(t)) return 'crypto';
    if (/stock|equity|tesla|nvda/.test(t)) return 'stocks';
    if (/tech|ai|software/.test(t)) return 'tech';
    if (/politic|election|gov/.test(t)) return 'politics';
    if (/sport|cup|league/.test(t)) return 'sports';
    return 'general';
  };

  function normalizeServerItemToFeedItem(s: any): ExtendedFeedItem {
    return {
      id: s.id || s._id || s.slug || crypto.randomUUID(),
      createdAt: Number.isFinite(s.createdAt)
        ? s.createdAt
        : Date.parse(s.createdAt || new Date().toISOString()),
      title: s.title || s.question || s.text || 'Untitled',
      category: mapCategory(s.category || s.topic || s.tag) as FeedItem['category'],
      probability: num(s.probability ?? s.p ?? s.pct, 50),
      confidence: num(s.confidence ?? s.conf, 60),
      source: 'server',
      // Extended fields from server
      stamped: s.stamped,
      status: s.status,
      creator: s.creator,
    };
  }

  // Mount effect for hydration safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load local items after mount
  useEffect(() => {
    setLocalItems(loadLocalFeed());
    console.log('[Feed:boot] local=', loadLocalFeed().length);
  }, []);

  // Load local overlay items from v2 intents after mount
  useEffect(() => {
    const overlayItems = getLocalOverlayFromV2();
    setLocalOverlayItems(overlayItems);
    console.log('[Feed:boot] localOverlay=', overlayItems.length);
  }, []);

  // Debounce search query to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const merged = useMemo((): ExtendedFeedItem[] => {
    const normalizedServer = (serverItems || []).map(normalizeServerItemToFeedItem);

    // Convert local items to extended format
    const normalizedLocal = localItems.map(item => ({ ...item } as ExtendedFeedItem));

    // Convert local overlay items to FeedItem format
    const normalizedOverlay = localOverlayItems.map(
      item =>
        ({
          id: item.id,
          createdAt: item.createdAt,
          title: item.title,
          category: mapCategory(item.category),
          probability: item.probability,
          confidence: item.confidence,
          source: 'wallet' as const,
          subtitle: item.subtitle,
          author: item.author,
        } as ExtendedFeedItem),
    );

    // Merge all items with local items first (priority), then dedupe by predictionId
    const allItems = [...normalizedLocal, ...normalizedOverlay, ...normalizedServer];
    const deduped = dedupeByPredictionId(allItems);
    const arr = deduped.sort((a, b) => b.createdAt - a.createdAt);

    console.log('[Feed:merge]', {
      local: localItems.length,
      overlay: normalizedOverlay.length,
      server: normalizedServer.length,
      merged: arr.length,
    });
    return arr;
  }, [serverItems, localItems, localOverlayItems]);

  // Filter: 'all' shows everything, including local items
  const visible = useMemo(() => {
    const cat = String(currentFilter || 'all').toLowerCase();
    let result = cat === 'all' ? merged : merged.filter(it => it.category === cat);

    // Apply "Mine" filter if active
    if (showMine) {
      result = result.filter(
        it => it.source === 'wallet' || (it as ExtendedFeedItem).author?.handle?.includes('You'),
      );
    }

    console.log('[Feed:visible]', { cat, showMine, len: result.length });
    return result;
  }, [merged, currentFilter, showMine]);

  // No need for manual loading - useOptimizedFetch handles this automatically

  const handleFilterChange = (filter: string) => {
    setCurrentFilter(filter);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const timeAgo = (dateInput: string | number) => {
    const date = typeof dateInput === 'number' ? new Date(dateInput) : new Date(dateInput);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      crypto: '₿',
      stocks: '📈',
      tech: '💻',
      politics: '🏛️',
      sports: '⚽',
      general: '💭',
    };
    return icons[category.toLowerCase()] || '💭';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      crypto: 'from-orange-500 to-yellow-500',
      stocks: 'from-green-500 to-emerald-500',
      tech: 'from-blue-500 to-cyan-500',
      politics: 'from-red-500 to-orange-500',
      sports: 'from-teal-500 to-cyan-500',
      general: 'from-gray-500 to-slate-500',
    };
    return colors[category.toLowerCase()] || 'from-gray-500 to-slate-500';
  };

  return (
    <ErrorBoundary fallback={FeedErrorFallback}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-teal-600/20 to-cyan-600/20"></div>
          <div className="relative bg-[#0B1426]/80 border-b border-blue-800/30 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                    Insights Feed
                  </h1>
                  <p className="text-blue-200/80 mt-2 text-lg">
                    Discover predictions from the community and track market sentiment
                  </p>

                  {/* Search Bar */}
                  <div className="mt-6 max-w-md">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search insights..."
                        value={searchQuery}
                        onChange={e => handleSearchChange(e.target.value)}
                        className="w-full px-4 py-3 pl-10 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm"
                      />
                      <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/studio"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Create Insight
                  </Link>
                  <button className="inline-flex items-center px-4 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors border border-white/20">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                    Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Enhanced Filters */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3">
              {/* Mine filter */}
              <button
                onClick={() => setShowMine(!showMine)}
                className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  showMine
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                    : 'bg-white/10 text-blue-200 hover:bg-white/20 hover:scale-105'
                }`}
              >
                <span className="mr-2 text-lg">👤</span>
                Mine
              </button>

              {['all', 'crypto', 'stocks', 'tech', 'politics', 'sports', 'general'].map(filter => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    currentFilter === filter
                      ? 'bg-gradient-to-r from-blue-500 to-teal-600 text-white shadow-lg'
                      : 'bg-white/10 text-blue-200 hover:bg-white/20 hover:scale-105'
                  }`}
                >
                  {filter !== 'all' && (
                    <span className="mr-2 text-lg">{getCategoryIcon(filter)}</span>
                  )}
                  {filter === 'all'
                    ? 'All Categories'
                    : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-blue-300 mt-2">Loading insights...</p>
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && mounted && visible.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-blue-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No insights found</h3>
              <p className="text-blue-300 mb-6">
                {currentFilter === 'all'
                  ? 'No insights have been created yet.'
                  : `No insights found for ${currentFilter} filter.`}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/studio"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create First Insight
                </Link>
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium"
                >
                  View Leaderboard
                </Link>
              </div>

              {/* Dev-only seed button */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-8 pt-6 border-t border-white/10">
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/dev/seed-demo-data', { method: 'POST' });
                        if (response.ok) {
                          window.location.reload();
                        } else {
                          console.error('Failed to seed demo data');
                        }
                      } catch (error) {
                        console.error('Error seeding demo data:', error);
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                  >
                    🌱 Seed Demo Data
                  </button>
                  <p className="text-xs text-gray-400 mt-2">Development only</p>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Insights List */}
          {!loading && mounted && visible.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {visible.map(insight => (
                <Link
                  key={insight.id}
                  href={`/i/${insight.id}`}
                  className="group block bg-gradient-to-br from-white/5 to-white/10 rounded-2xl shadow-xl border border-white/10 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-200 backdrop-blur-sm hover:border-white/20"
                >
                  {/* Header with category and status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-r ${getCategoryColor(
                          insight.category,
                        )} flex items-center justify-center text-white text-sm font-bold`}
                      >
                        {getCategoryIcon(insight.category)}
                      </div>
                      <span className="text-sm font-medium text-blue-200 capitalize">
                        {insight.category}
                      </span>
                    </div>

                    {((hasStamped(insight) && insight.stamped) ||
                      (hasStatus(insight) &&
                        (insight.status === 'COMMITTED' || insight.status === 'RESOLVED'))) && (
                      <div className="inline-flex items-center px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {hasStatus(insight) && insight.status === 'RESOLVED'
                          ? 'Resolved'
                          : 'Verified'}
                      </div>
                    )}
                  </div>

                  {/* Question */}
                  <h3 className="font-semibold text-white mb-2 line-clamp-3 group-hover:text-blue-200 transition-colors">
                    {insight.title || 'Untitled'}
                  </h3>

                  {/* Your Intent Row - only for local intents */}
                  {insight.source === 'wallet' && hasSubtitle(insight) && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs text-blue-300">Your intent:</span>
                      {insight.subtitle.includes('LONG') ? (
                        <span className="inline-flex items-center px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                          Long {insight.subtitle.split(' ').pop()}
                        </span>
                      ) : insight.subtitle.includes('SHORT') ? (
                        <span className="inline-flex items-center px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full border border-red-500/30">
                          Short {insight.subtitle.split(' ').pop()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full border border-gray-500/30">
                          {insight.subtitle}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Probability Display */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                        {Math.round(insight.probability)}%
                      </div>
                      <div className="text-sm text-blue-200">
                        Confidence: {Math.round(insight.confidence)}%
                      </div>
                    </div>
                    <div className="text-xs text-blue-300/60">{timeAgo(insight.createdAt)}</div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${insight.probability}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Creator Info */}
                  {hasCreator(insight) && (
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {insight.creator.handle.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            @{insight.creator.handle}
                          </div>
                          <div className="text-xs text-blue-300">
                            Score: {insight.creator.score.toFixed(1)}
                          </div>
                        </div>
                      </div>
                      <div className="text-blue-300/60">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Enhanced Pagination */}
          {!loading && feedData && feedData.pagination.pages > 1 && (
            <div className="mt-12 flex items-center justify-center space-x-3">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!feedData.pagination.hasPrev}
                className="inline-flex items-center px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 transition-all duration-200 hover:scale-105"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Previous
              </button>

              <div className="flex items-center space-x-2">
                {Array.from({ length: Math.min(5, feedData.pagination.pages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                        currentPage === pageNum
                          ? 'bg-gradient-to-r from-blue-500 to-teal-600 text-white shadow-lg'
                          : 'bg-white/10 text-blue-200 hover:bg-white/20 border border-white/20'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!feedData.pagination.hasNext}
                className="inline-flex items-center px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 transition-all duration-200 hover:scale-105"
              >
                Next
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Enhanced Stats */}
          {!loading && mounted && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center px-6 py-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                <svg
                  className="w-5 h-5 mr-2 text-blue-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span className="text-blue-200 font-medium">
                  Showing <span className="text-white font-bold">{visible.length}</span> insights
                  {feedData && feedData.pagination.total > 0 && (
                    <>
                      {' '}
                      of{' '}
                      <span className="text-white font-bold">
                        {feedData.pagination.total + localItems.length}
                      </span>{' '}
                      total
                    </>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
