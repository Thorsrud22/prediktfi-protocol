import { Suspense } from "react";
import { markets } from "../lib/markets";
import MarketCard from "../components/MarketCard";
import { MarketCardSkeleton } from "../components/MarketCardSkeleton";
import MarketsClient from "../components/MarketsClient";

// ISR: Revalidate every hour like PredictionSwap
export const revalidate = 3600;

// Server Component - pre-render market data
async function getMarketData() {
  // Simulate API fetch in real app
  const activeMarkets = markets.filter(market => {
    const now = new Date();
    const endDate = new Date(market.endDate);
    return market.isActive && endDate > now;
  });

  return {
    markets: activeMarkets,
    totalActive: activeMarkets.length,
    totalVolume: activeMarkets.reduce((sum, m) => sum + m.totalVolume, 0),
  };
}

export default async function MarketsPage() {
  // Pre-fetch data on server
  const marketData = await getMarketData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Legacy banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">Legacy Markets View</h2>
        <p className="text-yellow-700">
          This is a legacy view from the old prediction markets system. 
          Predikt has evolved into an AI-first prediction studio. 
          <a href="/studio" className="underline ml-1">Try the new Studio →</a>
        </p>
      </div>

      {/* Header with server-rendered stats */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-100 mb-2">
          Prediction Markets
        </h1>
        <p className="text-blue-200/80">
          {marketData.totalActive} active markets • ${(marketData.totalVolume / 1000000).toFixed(1)}M total volume
        </p>
      </div>

      {/* Client-side filtering and interaction */}
      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      }>
        <MarketsClient initialMarkets={marketData.markets} />
      </Suspense>
    </div>
  );
}
