"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

// MOCK implementation for Coming Soon / Private Alpha build
// This replaces the real wallet provider to avoid 'self is not defined' errors
// and to disable wallet functionality globally.

const SimplifiedWalletContext = createContext({
  connected: false,
  publicKey: null as string | null,
  connect: async () => { },
  disconnect: async () => { },
  select: (name: string) => { },
  wallet: null as any,
  wallets: [] as any[],
  connecting: false,
  disconnecting: false,
  isConnected: false, // Helper for some components
  isConnecting: false,
  signMessage: async (message: Uint8Array) => null as Uint8Array | null,
});

export const useSimplifiedWallet = () => useContext(SimplifiedWalletContext);

export default function SimplifiedWalletProvider({ children }: { children: React.ReactNode }) {
  // Always return disconnected state
  const value = useMemo(() => ({
    connected: false,
    publicKey: null,
    connect: async () => console.log("Wallet disabled"),
    disconnect: async () => console.log("Wallet disabled"),
    select: () => { },
    wallet: null,
    wallets: [],
    connecting: false,
    disconnecting: false,
    isConnected: false,
    isConnecting: false,
    signMessage: async () => null,
  }), []);

  return (
    <SimplifiedWalletContext.Provider value={value}>
      {children}
    </SimplifiedWalletContext.Provider>
  );
}
