"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Types
export interface Creator {
  handle: string;
  badge: "KOL" | "Expert" | "Sports" | "Crypto" | "Culture" | "Predikt";
  avatarUrl: string;
}

export interface Market {
  id: string;
  title: string;
  subtitle?: string;
  endsAt: number;
  poolLamports: number;
  participants: number;
  creator: Creator;
  category: "KOL" | "Expert" | "Sports" | "Crypto" | "Culture" | "Predikt";
  featured?: boolean;
  probability?: number;
  isActive?: boolean;
}

export interface MarketState {
  // State
  markets: Market[];
  selectedMarket: Market | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setMarkets: (markets: Market[]) => void;
  setSelectedMarket: (market: Market | null) => void;
  addMarket: (market: Market) => void;
  updateMarket: (id: string, updates: Partial<Market>) => void;
  removeMarket: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Selectors
  getFeaturedMarkets: () => Market[];
  getMarketsByCategory: (category: string) => Market[];
  getActiveMarkets: () => Market[];
}

export const useMarketStore = create<MarketState>()(
  devtools(
    (set, get) => ({
      // Initial state
      markets: [],
      selectedMarket: null,
      loading: false,
      error: null,

      // Actions
      setMarkets: (markets) => set({ markets }),
      setSelectedMarket: (market) => set({ selectedMarket: market }),
      addMarket: (market) => set((state) => ({ 
        markets: [...state.markets, market] 
      })),
      updateMarket: (id, updates) => set((state) => ({
        markets: state.markets.map(market => 
          market.id === id ? { ...market, ...updates } : market
        )
      })),
      removeMarket: (id) => set((state) => ({
        markets: state.markets.filter(market => market.id !== id)
      })),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Selectors
      getFeaturedMarkets: () => {
        return get().markets.filter(market => market.featured);
      },
      getMarketsByCategory: (category) => {
        return get().markets.filter(market => market.category === category);
      },
      getActiveMarkets: () => {
        return get().markets.filter(market => market.isActive !== false);
      }
    }),
    { name: "market-store" }
  )
);
