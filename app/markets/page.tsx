"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { markets } from "../lib/markets";
import MarketCard from "../components/MarketCard";
import CategoryBar from "../components/CategoryBar";
import { MarketCardSkeleton } from "../components/MarketCardSkeleton";

type SortOption = "ending-soon" | "most-volume";

function MarketsContent() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("ending-soon");
  const [hideEnded, setHideEnded] = useState(true); // Default to true
  const [isLoading, setIsLoading] = useState(true);

  // Load initial state from URL params or sessionStorage
  useEffect(() => {
    try {
      // Check URL params first
      const urlSearch = searchParams.get("search");
      const urlCategory = searchParams.get("category");
      
      if (urlSearch || urlCategory) {
        if (urlSearch) setSearchQuery(urlSearch);
        if (urlCategory) setSelectedCategory(urlCategory);
      } else {
        // Fall back to sessionStorage
        const saved = sessionStorage.getItem("predikt-ui-markets");
        if (saved) {
          const { search, category } = JSON.parse(saved);
          if (search) setSearchQuery(search);
          if (category) setSelectedCategory(category);
        }
      }
    } catch (error) {
      console.warn("Failed to load filter state:", error);
    }
  }, [searchParams]);

  // Save filter state to sessionStorage when it changes
  useEffect(() => {
    // Debounce sessionStorage writes to avoid excessive writes
    const timeoutId = setTimeout(() => {
      try {
        const state = {
          search: searchQuery,
          category: selectedCategory,
        };
        sessionStorage.setItem("predikt-ui-markets", JSON.stringify(state));
      } catch (error) {
        console.warn("Failed to save filter state:", error);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory]);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Debounced search - increased to 300ms
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Filter and sort markets
  const filteredAndSortedMarkets = useMemo(() => {
    let filtered = markets.filter((market) => {
      // Category filter
      const categoryMatch = selectedCategory === "All" || market.category === selectedCategory;
      
      // Search filter (case insensitive)
      const searchMatch = debouncedSearch === "" || 
        market.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        market.description.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      // Hide ended filter
      const now = new Date();
      const endDate = new Date(market.endDate);
      const endedFilter = hideEnded ? endDate > now : true;
      
      return categoryMatch && searchMatch && endedFilter && market.isActive;
    });

    // Sort markets
    if (sortBy === "ending-soon") {
      filtered.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    } else if (sortBy === "most-volume") {
      filtered.sort((a, b) => b.totalVolume - a.totalVolume);
    }

    return filtered;
  }, [debouncedSearch, selectedCategory, sortBy, hideEnded]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[color:var(--text)] mb-2">
          Prediction Markets
        </h1>
        <p className="text-[color:var(--muted)]">
          Bet on future outcomes with real SOL
        </p>
      </div>

      {/* Controls */}
      <div className="space-y-6 mb-8">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-[color:var(--surface)] border border-[var(--border)] rounded-[var(--radius)] text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[color:var(--muted)]">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Category filter */}
        <CategoryBar 
          onSelect={setSelectedCategory} 
          selectedCategory={selectedCategory} 
        />

        {/* Sort dropdown and Hide ended toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label htmlFor="sort" className="text-sm font-medium text-[color:var(--text)]">
              Sort by:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 bg-[color:var(--surface)] border border-[var(--border)] rounded-[var(--radius)] text-[color:var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
            >
              <option value="ending-soon">Ending soon</option>
              <option value="most-volume">Most volume</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="hide-ended" className="text-sm font-medium text-[color:var(--text)] cursor-pointer">
              Hide ended
            </label>
            <input
              id="hide-ended"
              type="checkbox"
              checked={hideEnded}
              onChange={(e) => setHideEnded(e.target.checked)}
              className="w-4 h-4 text-[color:var(--primary)] bg-[color:var(--surface)] border-[var(--border)] rounded focus:ring-[color:var(--primary)] focus:ring-2"
            />
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Markets grid */}
      {!isLoading && (
        <>
          {filteredAndSortedMarkets.length === 0 ? (
            /* Empty state */
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-[color:var(--surface-2)] rounded-full flex items-center justify-center mb-4">
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-[color:var(--muted)]">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0118 12a8 8 0 01-8 8 8 8 0 01-8-8 8 8 0 018-8 7.962 7.962 0 014.291 1.709" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[color:var(--text)] mb-2">
                No markets found
              </h3>
              <p className="text-[color:var(--muted)] mb-4">
                {debouncedSearch || selectedCategory !== "All" 
                  ? "Try adjusting your search or filters to find markets." 
                  : "No active markets are available right now."}
              </p>
              {(debouncedSearch || selectedCategory !== "All") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                    setHideEnded(true);
                  }}
                  className="px-4 py-2 bg-[color:var(--primary)] text-white rounded-[var(--radius)] hover:opacity-90 transition-opacity"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedMarkets.map((market) => (
                <MarketCard
                  key={market.id}
                  id={market.id}
                  title={market.title}
                  subtitle={market.description}
                  endsAt={new Date(market.endDate).getTime()}
                  poolLamports={market.poolLamports}
                  participants={market.participants}
                  creator={{
                    handle: market.creatorName || "Unknown",
                    badge: market.creatorType || "COMMUNITY",
                    avatarUrl: market.creatorAvatar || "https://api.dicebear.com/7.x/shapes/svg?seed=default",
                  }}
                  category={market.category}
                />
              ))}
            </div>
          )}

          {/* Results summary */}
          {filteredAndSortedMarkets.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-sm text-[color:var(--muted)]">
                Showing {filteredAndSortedMarkets.length} of {markets.filter(m => m.isActive).length} active markets
                {selectedCategory !== "All" && ` in ${selectedCategory}`}
                {debouncedSearch && ` matching "${debouncedSearch}"`}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function MarketsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">Legacy Markets View</h2>
            <p className="text-yellow-700">
              This is a legacy view from the old prediction markets system. 
              Predikt has evolved into an AI-first prediction studio. 
              <a href="/studio" className="underline ml-1">Try the new Studio →</a>
            </p>
          </div>
          <h1 className="text-3xl font-bold mb-6">Legacy Prediction Markets</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <MarketCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    }>
      <MarketsContent />
    </Suspense>
  );
}
