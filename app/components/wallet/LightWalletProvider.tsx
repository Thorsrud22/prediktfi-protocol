'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface LightWalletContextType {
  isConnected: boolean;
  publicKey: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  isInitialized: boolean;
}

const LightWalletContext = createContext<LightWalletContextType | null>(null);

export function LightWalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [walletAdapter, setWalletAdapter] = useState<any>(null);

  // Lazy load the heavy wallet components only when needed
  const loadWalletAdapter = useCallback(async () => {
    if (walletAdapter) return walletAdapter;

    try {
      const [
        { PhantomWalletAdapter },
        { clusterApiUrl },
        { Connection }
      ] = await Promise.all([
        import('@solana/wallet-adapter-phantom'),
        import('@solana/web3.js'),
        import('@solana/web3.js')
      ]);

      const adapter = new PhantomWalletAdapter();
      setWalletAdapter(adapter);
      return adapter;
    } catch (error) {
      console.error('Failed to load wallet adapter:', error);
      return null;
    }
  }, [walletAdapter]);

  const connect = useCallback(async () => {
    if (isConnecting) return;

    setIsConnecting(true);

    try {
      const adapter = await loadWalletAdapter();
      if (!adapter) {
        throw new Error('Failed to load wallet adapter');
      }

      await adapter.connect();
      setIsConnected(true);
      setPublicKey(adapter.publicKey?.toString() || null);

      // Store connection state
      localStorage.setItem('predikt:wallet:connected', 'true');
      if (adapter.publicKey) {
        localStorage.setItem('predikt:wallet:publicKey', adapter.publicKey.toString());
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, loadWalletAdapter]);

  const disconnect = useCallback(async () => {
    if (walletAdapter) {
      try {
        await walletAdapter.disconnect();
      } catch (error) {
        console.error('Failed to disconnect wallet:', error);
      }
    }

    setIsConnected(false);
    setPublicKey(null);

    // Clear stored state
    localStorage.removeItem('predikt:wallet:connected');
    localStorage.removeItem('predikt:wallet:publicKey');
  }, [walletAdapter]);

  // Initialize from localStorage
  useEffect(() => {
    const initialize = async () => {
      try {
        const wasConnected = localStorage.getItem('predikt:wallet:connected') === 'true';
        const storedPublicKey = localStorage.getItem('predikt:wallet:publicKey');

        if (wasConnected && storedPublicKey) {
          // Try to restore connection
          const adapter = await loadWalletAdapter();
          if (adapter && adapter.publicKey?.toString() === storedPublicKey) {
            setIsConnected(true);
            setPublicKey(storedPublicKey);
          }
        }
      } catch (error) {
        console.error('Failed to initialize wallet:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();
  }, [loadWalletAdapter]);

  const value = {
    isConnected,
    publicKey,
    connect,
    disconnect,
    isConnecting,
    isInitialized,
  };

  return (
    <LightWalletContext.Provider value={value}>
      {children}
    </LightWalletContext.Provider>
  );
}

export function useLightWallet() {
  const context = useContext(LightWalletContext);
  if (!context) {
    throw new Error('useLightWallet must be used within a LightWalletProvider');
  }
  return context;
}

// Fallback hook that works with both providers
export function useWalletFallback() {
  try {
    // Try light wallet first
    return useLightWallet();
  } catch {
    try {
      // Fallback to existing simplified wallet
      const { usePhantomWallet } = require('./PhantomProvider');
      return usePhantomWallet();
    } catch {
      // Ultimate fallback
      return {
        isConnected: false,
        publicKey: null,
        connect: async () => { },
        disconnect: async () => { },
        isConnecting: false,
        isInitialized: true,
      };
    }
  }
}