"use client";

import Link from "next/link";
import { MOCK_MARKETS } from "../../lib/markets.mock";
import Hero from "../Hero";
import EnhancedMarketCard from "../features/EnhancedMarketCard";
import Grid from "../ui/Grid";
import Button from "../ui/Button";
import SearchBar from "../ui/SearchBar";
import EmptyState from "../ui/EmptyState";
import { useState, useMemo } from "react";

// Categories for filtering - match the actual data structure
const CATEGORIES = [
  { id: "all", label: "All Markets" },
  { id: "KOL", label: "KOL" },
  { id: "EXPERT", label: "Expert" },
  { id: "COMMUNITY", label: "Community" },
  { id: "PREDIKT", label: "Predikt" }
];

export default function EnhancedHome() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter markets based on selected category and search
  const filteredMarkets = useMemo(() => {
    let markets = MOCK_MARKETS;
    
    // Apply category filter
    if (selectedCategory !== "all") {
      markets = markets.filter(market => market.creatorType === selectedCategory);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      markets = markets.filter(market => 
        market.title.toLowerCase().includes(query) ||
        market.summary.toLowerCase().includes(query) ||
        market.creatorName?.toLowerCase().includes(query)
      );
    }
    
    return markets;
  }, [selectedCategory, searchQuery]);

  // Markets to display
  const displayMarkets = filteredMarkets;

  return (
    <div className="min-h-screen bg-[var(--background-primary)]">
      <main>
        <h1 className="sr-only">Predikt - AI-First Prediction Markets</h1>
        
        {/* Hero Section */}
        <Hero />

        {/* Markets Section */}
        <section 
          id="markets" 
          className="relative z-[1] py-16"
        >
          <div className="container-xl">
            {/* Section Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-heading-2 text-[var(--text-primary)]">
                  Prediction Markets
                </h2>
                <div className="text-sm text-[var(--text-secondary)]">
                  {displayMarkets.length} market{displayMarkets.length !== 1 ? 's' : ''} available
                </div>
              </div>

              {/* Search Bar */}
              <SearchBar
                placeholder="Search markets, creators, or topics..."
                onSearch={setSearchQuery}
                className="mb-6"
              />

              {/* Category Filter */}
              <div className="flex flex-wrap gap-3 mb-6">
                {CATEGORIES.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="transition-all duration-200"
                  >
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Markets Grid */}
            <Grid cols={3} gap="md" className="mb-8">
            {displayMarkets.map((market) => (
              <EnhancedMarketCard
                key={market.id}
                id={market.id}
                title={market.title}
                summary={market.summary}
                endsAt={market.endsAt}
                volume={market.volume}
                creator={market.creatorId ? {
                  id: market.creatorId,
                  name: market.creatorName || "Unknown",
                  avatar: market.creatorAvatar || "",
                  type: market.creatorType || "COMMUNITY"
                } : undefined}
                featured={false}
              />
            ))}
          </Grid>

          {/* Empty State */}
          {displayMarkets.length === 0 && (
            <EmptyState
              icon={
                <svg className="w-8 h-8 text-[color:var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              title={searchQuery ? "No markets found" : "No markets in this category"}
              description={
                searchQuery 
                  ? `No markets match "${searchQuery}". Try adjusting your search terms or browse different categories.`
                  : "No markets found in this category. Try exploring other categories or check back later for new predictions."
              }
              action={{
                label: searchQuery ? "Clear search" : "View all markets",
                onClick: () => {
                  if (searchQuery) {
                    setSearchQuery("");
                  } else {
                    setSelectedCategory("all");
                  }
                },
                variant: "secondary"
              }}
            />
          )}

          {/* Call to Action */}
          <div className="text-center mt-12">
            <div className="bg-[color:var(--surface)]/50 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-8">
              <h3 className="text-xl font-bold text-[color:var(--text)] mb-2">
                Ready to make predictions?
              </h3>
              <p className="text-[color:var(--muted)] mb-6 max-w-md mx-auto">
                Join thousands of users making informed predictions with AI-powered insights on Solana.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/studio">
                  <Button size="lg">
                    Open Studio
                  </Button>
                </Link>
                <Link href="/feed">
                  <Button variant="secondary" size="lg">
                    Browse Feed
                  </Button>
                </Link>
              </div>
            </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
