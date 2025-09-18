"use client";

import { useState, useMemo, useEffect, type ComponentProps } from "react";
import { useSearchParams } from "next/navigation";
import MarketCard from "./MarketCard";
import CategoryBar from "./CategoryBar";
import { MarketCardSkeleton } from "./MarketCardSkeleton";
import { safeParse } from "../lib/safe-fetch";

type SortOption = "ending-soon" | "most-volume";
type Market = {
  id: string;
  title: string;
  description: string;
  endDate: string;
  poolLamports: number;
  participants: number;
  totalVolume: number;
  category: string;
  isActive: boolean;
  creatorName?: string;
  creatorType?: string;
  creatorAvatar?: string;
};

interface MarketsClientProps {
  initialMarkets: Market[];
}

export default function MarketsClient({ initialMarkets }: MarketsClientProps) {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("ending-soon");
  const [hideEnded, setHideEnded] = useState(true);
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
          const parsed = safeParse<{ search?: string; category?: string }>(saved);
          if (parsed) {
            if (parsed.search) setSearchQuery(parsed.search);
            if (parsed.category) setSelectedCategory(parsed.category);
          }
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

  // Simulate quick loading since data is pre-fetched
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Filter and sort markets
  const filteredAndSortedMarkets = useMemo(() => {
    let filtered = initialMarkets.filter((market) => {
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
  }, [initialMarkets, debouncedSearch, selectedCategory, sortBy, hideEnded]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <MarketCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Controls */}
      <div className="space-y-6 mb-8">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-[#0B1426]/50 border border-blue-800/40 rounded-lg text-blue-100 placeholder:text-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300/60">
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
            <label htmlFor="sort" className="text-sm font-medium text-slate-300">
              Sort by:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ending-soon">Ending soon</option>
              <option value="most-volume">Most volume</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="hide-ended" className="text-sm font-medium text-slate-300 cursor-pointer">
              Hide ended
            </label>
            <input
              id="hide-ended"
              type="checkbox"
              checked={hideEnded}
              onChange={(e) => setHideEnded(e.target.checked)}
              className="w-4 h-4 text-blue-500 bg-slate-900/50 border-slate-700 rounded focus:ring-blue-500 focus:ring-2"
            />
          </div>
        </div>
      </div>

      {/* Markets grid */}
      {filteredAndSortedMarkets.length === 0 ? (
        /* Empty state */
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
            <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-slate-500">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0118 12a8 8 0 01-8 8 8 8 0 01-8-8 8 8 0 018-8 7.962 7.962 0 014.291 1.709" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">
            No markets found
          </h3>
          <p className="text-slate-400 mb-4">
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
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
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
                category={
                  ["KOL", "Expert", "Sports", "Crypto", "Culture", "Predikt"].includes(market.category)
                    ? (market.category as ComponentProps<typeof MarketCard>["category"])
                    : "Predikt"
                }
              />
            ))}
          </div>

          {/* Results summary */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[color:var(--muted)]">
              Showing {filteredAndSortedMarkets.length} of {initialMarkets.length} active markets
              {selectedCategory !== "All" && ` in ${selectedCategory}`}
              {debouncedSearch && ` matching "${debouncedSearch}"`}
            </p>
          </div>
        </>
      )}
    </>
  );
}