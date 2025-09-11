'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';

interface AuthState {
  isAuthenticated: boolean;
  wallet: string | null;
  isLoading: boolean;
}

export function useWalletAuth() {
  const { wallet, publicKey, connected, connect, disconnect } = useWallet();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    wallet: null,
    isLoading: false
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check auth status when wallet changes
  useEffect(() => {
    if (connected && publicKey) {
      checkAuthStatus();
    }
  }, [connected, publicKey]);

  // Reset authentication state when wallet disconnects
  useEffect(() => {
    if (!connected) {
      setAuthState({
        isAuthenticated: false,
        wallet: null,
        isLoading: false
      });
      setIsAuthenticating(false);
    }
  }, [connected]);

  // Auto-authenticate when wallet connects (only once)
  useEffect(() => {
    if (connected && publicKey && !authState.isAuthenticated && !authState.isLoading && !isAuthenticating) {
      console.log('Wallet connected, attempting authentication...');
      // Add a small delay to prevent race conditions
      const timer = setTimeout(() => {
        authenticate();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [connected, publicKey]); // Remove authState dependencies to prevent loops

  const checkAuthStatus = async () => {
    try {
      console.log('Checking auth status...');
      const response = await fetch('/api/auth/status');
      if (response.ok) {
        const data = await response.json();
        console.log('Auth status response:', data);
        setAuthState({
          isAuthenticated: data.authenticated,
          wallet: data.wallet,
          isLoading: false
        });
      } else {
        console.log('Auth status check failed with status:', response.status);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const authenticate = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Prevent duplicate authentication attempts
    if (isAuthenticating) {
      console.log('Authentication already in progress, skipping...');
      return;
    }

    // Check if already authenticated
    if (authState.isAuthenticated) {
      console.log('Already authenticated, skipping...');
      return;
    }

    console.log('Starting authentication process...');
    setIsAuthenticating(true);
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // Step 1: Get nonce
      const nonceResponse = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: publicKey.toString() })
      });

      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce');
      }

      const { nonce } = await nonceResponse.json();

      // Step 2: Sign message
      const message = `Sign this message to authenticate with Predikt: ${nonce}`;
      const encodedMessage = new TextEncoder().encode(message);
      
      const signature = await wallet?.adapter.signMessage?.(encodedMessage);
      if (!signature) {
        throw new Error('Failed to sign message');
      }

      // Step 3: Verify signature
      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          signature: Buffer.from(signature).toString('base64'),
          message
        })
      });

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json();
        throw new Error(error.error || 'Authentication failed');
      }

      const { wallet: displayWallet } = await verifyResponse.json();

      console.log('Authentication successful, setting state...');
      setAuthState({
        isAuthenticated: true,
        wallet: displayWallet,
        isLoading: false
      });

      toast.success('Wallet connected successfully!');
      
      // Add a small delay before refresh to ensure state is set
      setTimeout(() => {
        router.refresh();
      }, 100);

    } catch (error) {
      console.error('Authentication error:', error);
      toast.error(error instanceof Error ? error.message : 'Authentication failed');
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setAuthState({
        isAuthenticated: false,
        wallet: null,
        isLoading: false
      });
      setIsAuthenticating(false);
      disconnect();
      router.refresh();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const connectAndAuthenticate = async () => {
    if (!connected) {
      // If not connected, we need to let the user select a wallet first
      // The WalletMultiButton should handle this
      toast.error('Please select a wallet first using the wallet button above');
      return;
    } else {
      await authenticate();
    }
  };

  return {
    ...authState,
    connectAndAuthenticate,
    signOut,
    checkAuthStatus
  };
}
