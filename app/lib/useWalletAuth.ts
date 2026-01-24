'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSimplifiedWallet } from '../components/wallet/SimplifiedWalletProvider';
import { toast } from 'react-hot-toast';

interface AuthState {
  isAuthenticated: boolean;
  wallet: string | null;
  isLoading: boolean;
}

export function useWalletAuth() {
  // Replace legacy adapter hook with our simplified hook
  const { isConnected: connected, publicKey, signMessage, disconnect, connect } = useSimplifiedWallet();
  const wallet = null; // Legacy adapter object not available/needed in simplified mode

  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    wallet: null,
    isLoading: true, // Start in loading state
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const verifyingRef = useRef(false); // prevent double-calls
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Reset authentication state when wallet disconnects
  useEffect(() => {
    if (!connected) {
      setAuthState({
        isAuthenticated: false,
        wallet: null,
        isLoading: false,
      });
      setIsAuthenticating(false);
    }
  }, [connected]);

  // Legacy adapter event listeners removed - SimplifiedWalletProvider handles this source of truth

  // Auto-verification removed - now handled manually in HeaderConnectButton

  const checkAuthStatus = async () => {
    try {
      console.log('Checking auth status...');
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const response = await fetch('/api/auth/status');
      if (response.ok) {
        const data = await response.json();
        console.log('Auth status response:', data);
        setAuthState({
          isAuthenticated: data.authenticated,
          wallet: data.wallet,
          isLoading: false,
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
    if (verifyingRef.current) {
      console.log('Authentication already in progress, skipping...');
      return;
    }

    // Check if already authenticated
    if (authState.isAuthenticated) {
      console.log('Already authenticated, skipping...');
      return;
    }

    // Check 12-hour cache first
    const cacheKey = 'predikt:auth:v1';
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { sig, exp } = JSON.parse(cached);
        if (exp && Date.now() < exp) {
          console.log('Using cached authentication');
          setAuthState({
            isAuthenticated: true,
            wallet: publicKey,
            isLoading: false,
          });
          return;
        } else {
          // Cache expired, remove it
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.warn('Failed to parse auth cache:', error);
      localStorage.removeItem(cacheKey);
    }

    console.log('Starting authentication process for wallet:', publicKey);
    verifyingRef.current = true;
    setIsAuthenticating(true);
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // Step 1: Get nonce
      console.log('Step 1: Requesting nonce for wallet:', publicKey);
      const nonceResponse = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: publicKey }),
      });

      if (!nonceResponse.ok) {
        const errorText = await nonceResponse.text();
        console.error('Failed to get nonce:', nonceResponse.status, errorText);
        throw new Error(`Failed to get nonce: ${nonceResponse.status}`);
      }

      const { nonce } = await nonceResponse.json();
      console.log('Step 1 complete: Received nonce:', nonce);

      // Longer delay to ensure nonce is properly stored (especially important in dev)
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 2: Sign message
      console.log('Step 2: Signing message with wallet adapter');
      const message = `Sign this message to authenticate with Predikt: ${nonce}`;
      const encodedMessage = new TextEncoder().encode(message);

      // Use simplified wallet's signMessage
      const signature = await signMessage(encodedMessage);

      if (!signature) {
        throw new Error('Failed to sign message - user may have cancelled');
      }
      console.log('Step 2 complete: Message signed');

      // Step 3: Verify signature
      console.log('Step 3: Verifying signature with server');
      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey,
          signature: Array.from(signature), // Send as array of numbers
          message,
        }),
      });

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json();
        console.error('Verification failed:', verifyResponse.status, error);

        // If nonce expired or invalid, try to re-authenticate once
        if (verifyResponse.status === 401 && error.error?.includes('nonce')) {
          console.log('Nonce issue detected, clearing cache and will retry on next attempt...');
          localStorage.removeItem(cacheKey);
          throw new Error('Session expired. Please try connecting again.');
        }

        throw new Error(error.error || 'Authentication failed');
      }
      console.log('Step 3 complete: Signature verified');

      const { wallet: displayWallet } = await verifyResponse.json();

      // Cache the authentication for 12 hours
      const cacheData = {
        sig: Array.from(signature).join(','),
        exp: Date.now() + 12 * 60 * 60 * 1000, // 12 hours
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));

      console.log('Authentication successful, setting state...');
      setAuthState({
        isAuthenticated: true,
        wallet: displayWallet,
        isLoading: false,
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
      verifyingRef.current = false;
      setIsAuthenticating(false);
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (error) {
      console.error('Sign out error:', error);
    }

    // Clear local state regardless of server response
    setAuthState({
      isAuthenticated: false,
      wallet: null,
      isLoading: false,
    });
    setIsAuthenticating(false);
    verifyingRef.current = false;

    // Clear auth cache and saved adapter key
    try {
      localStorage.removeItem('predikt:auth:v1');
      localStorage.removeItem('walletAdapter');
    } catch (error) {
      console.warn('Failed to clear auth cache from localStorage:', error);
    }
  };

  const signOutAndDisconnect = async () => {
    try {
      await signOut?.();
    } catch { }
    try {
      await disconnect();
    } catch { }
  };

  const connectAndAuthenticate = async () => {
    if (!connected) {
      // If not connected, we need to let the user select a wallet first
      // The HeaderConnectButton should handle this
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
    signOutAndDisconnect,
    checkAuthStatus,
    verify: authenticate,
    verifying: isAuthenticating,
    refresh: checkAuthStatus,
    refreshing: authState.isLoading,
    plan: 'free', // Default plan
    expiry: null, // Default expiry
    payments: [], // Default empty payments
  };
}

const TTL_MS = 12 * 60 * 60 * 1000; // 12 timer

export function useSiwsGuard() {
  const { publicKey, signMessage } = useSimplifiedWallet();
  const [authed, setAuthed] = useState(false);
  const inflight = useRef(false);

  const key = publicKey ? `siws:${publicKey}` : '';

  // Read cache when wallet changes
  useEffect(() => {
    if (!publicKey) return setAuthed(false);
    try {
      const raw = sessionStorage.getItem(key);
      const saved = raw ? JSON.parse(raw) : null;
      const valid = saved && saved.expires && Date.now() < saved.expires;
      setAuthed(Boolean(valid));
    } catch {
      setAuthed(false);
    }
  }, [key, publicKey]);

  const ensureSiwsOnce = useCallback(async () => {
    if (!publicKey || authed || inflight.current) return true;
    if (!signMessage) return true; // some wallets don't support signMessage
    inflight.current = true;
    try {
      // static/semistatic message: don't use new nonce for each route change
      const msg = `Sign this message to authenticate with Predikt.`;
      const payload = new TextEncoder().encode(msg);
      const sig = await signMessage(payload);

      // Verify on server (if you have endpoint). If not: jump straight to caching.
      // await fetch('/api/siws/verify', { method:'POST', body: JSON.stringify({ msg, sig, pubkey: publicKey.toBase58() }) });

      sessionStorage.setItem(key, JSON.stringify({ expires: Date.now() + TTL_MS }));
      setAuthed(true);
      return true;
    } catch (e) {
      // Ikke spam brukeren; bare logg
      console.warn('[SIWS] avbrutt/feilet:', (e as Error)?.name || e);
      return false;
    } finally {
      inflight.current = false;
    }
  }, [publicKey, authed, signMessage, key]);

  const clearSiws = useCallback(() => {
    if (key) sessionStorage.removeItem(key);
    setAuthed(false);
  }, [key]);

  return { authed, ensureSiwsOnce, clearSiws };
}
