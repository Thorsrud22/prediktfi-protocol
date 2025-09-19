"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// Types
export interface TradeDraft {
  id: string;
  assetSymbol: string;      // f.eks. BTC/ETH/SOL (best guess)
  direction: 'Long' | 'Short';
  probability: number;      // 0–100
  confidence: number;       // 0–100
  thesis: string;           // kort sammendrag/begrunnelse
  horizonDays: number;      // default 30
  createdAt: number;
}

export interface IntentDraftState {
  // State
  draft: TradeDraft | null;
  
  // Actions
  setDraft: (draft: TradeDraft) => void;
  getDraft: () => TradeDraft | null;
  clearDraft: () => void;
  
  // Helper to create new draft with defaults
  createDraft: (partial: Partial<TradeDraft>) => TradeDraft;
}

// Helper function to generate unique ID
const generateDraftId = (): string => {
  return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Custom storage implementation for sessionStorage
const sessionStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const item = window.sessionStorage.getItem(name);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: any): void => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(name, JSON.stringify(value));
    } catch {
      // Silently fail if sessionStorage is not available
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.removeItem(name);
    } catch {
      // Silently fail if sessionStorage is not available
    }
  },
};

export const useIntentDraftStore = create<IntentDraftState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        draft: null,

        // Actions
        setDraft: (draft: TradeDraft) => {
          set({ draft });
        },

        getDraft: () => {
          return get().draft;
        },

        clearDraft: () => {
          set({ draft: null });
        },

        createDraft: (partial: Partial<TradeDraft> = {}): TradeDraft => {
          const now = Date.now();
          return {
            id: generateDraftId(),
            assetSymbol: '',
            direction: 'Long',
            probability: 50,
            confidence: 50,
            thesis: '',
            horizonDays: 30,
            createdAt: now,
            ...partial,
          };
        },
      }),
      {
        name: 'predikt.intentDraft', // sessionStorage key
        storage: sessionStorage,
      }
    ),
    { name: "intent-draft-store" }
  )
);

// Convenience hook that matches the requested interface
export const useIntentDraft = () => {
  const store = useIntentDraftStore();
  
  return {
    draft: store.draft,
    setDraft: store.setDraft,
    getDraft: store.getDraft,
    clearDraft: store.clearDraft,
    createDraft: store.createDraft,
  };
};
