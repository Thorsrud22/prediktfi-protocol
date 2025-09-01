"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MOCK_MARKETS } from "../lib/markets.mock";
import { formatRelative } from "../lib/format";
import { SkeletonCard } from "../components/Skeleton";

// Stable formatting functions to avoid hydration mismatches
function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

type SortOption = "ending-soon" | "highest-volume";

function MarketsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "ending-soon"
  );
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
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

  // Update URL with search params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (sortBy !== "ending-soon") params.set("sort", sortBy);
    
    const newUrl = params.toString() ? `?${params.toString()}` : "/markets";
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearch, sortBy, router]);

  // Filtered and sorted markets
  const filteredAndSortedMarkets = useMemo(() => {
    let markets = MOCK_MARKETS.filter((market) => {
      if (!debouncedSearch) return true;
      const query = debouncedSearch.toLowerCase();
      return (
        market.title.toLowerCase().includes(query) ||
        market.summary.toLowerCase().includes(query)
      );
    });

    // Sort markets
    markets.sort((a, b) => {
      if (sortBy === "ending-soon") {
        return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
      } else if (sortBy === "highest-volume") {
        return b.volume - a.volume;
      }
      return 0;
    });

    return markets;
  }, [debouncedSearch, sortBy]);

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-8">All Markets</h1>

      {/* Filter Bar */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/50 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-white/70 whitespace-nowrap">
            Sort by:
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="ending-soon">Ending soon</option>
            <option value="highest-volume">Highest volume</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="mb-6 text-sm text-white/60">
          {filteredAndSortedMarkets.length} market{filteredAndSortedMarkets.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Markets Grid */}
      <div className="grid gap-6 xl:gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)
        ) : filteredAndSortedMarkets.length > 0 ? (
          // Market cards
          filteredAndSortedMarkets.map((market) => (
            <Link
              key={market.id}
              href={`/market/${market.id}`}
              data-testid={`market-card-${market.id}`}
              className="block rounded-xl border border-white/10 bg-white/5 p-5 transition-all hover:shadow-lg/10 hover:ring-1 hover:ring-white/10 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <h2 className="text-lg font-semibold text-white mb-2">{market.title}</h2>
              <p className="text-sm text-white/60 line-clamp-2 mb-4">{market.summary}</p>

              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">
                  Ends {formatRelative(market.endsAt)}
                </span>
                <span className="rounded-full bg-white/10 px-2 py-1 text-white/60">
                  {formatNumber(market.volume)} SOL
                </span>
              </div>
            </Link>
          ))
        ) : (
          // No results
          <div className="col-span-full text-center py-12">
            <p className="text-white/60 mb-2">No markets found</p>
            <p className="text-sm text-white/40">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function MarketsPage() {
  return (
    <Suspense fallback={
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-white mb-8">All Markets</h1>
        <div className="grid gap-6 xl:gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      </main>
    }>
      <MarketsPageContent />
    </Suspense>
  );
}
