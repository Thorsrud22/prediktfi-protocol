'use client';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSimplifiedWallet } from '../components/wallet/SimplifiedWalletProvider';
import { useWalletAuth } from '../lib/useWalletAuth';

function shortAddress(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

interface Creator {
  id: string;
  handle: string;
  wallet: string;
  profileImage?: string;
  bio?: string;
  accuracyScore?: number;
  totalPredictions: number;
  resolvedPredictions: number;
  createdAt: string;
}

// Extracted loading skeleton component for better reusability
const LoadingSkeleton = React.memo(() => (
  <main className="max-w-4xl mx-auto px-4 py-10">
    <h1 className="text-3xl font-semibold text-slate-100 mb-6">Your Account</h1>
    <div className="rounded-xl border border-slate-700 p-6 text-slate-200">
      <div className="animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-1/4 mb-4"></div>
        <div className="h-3 bg-slate-700 rounded w-1/2"></div>
      </div>
    </div>
  </main>
));

// Extracted authentication states component
const AuthenticationPrompt = React.memo(
  ({
    isWalletConnected,
    verifying,
    publicKey,
    onVerify,
  }: {
    isWalletConnected: boolean;
    verifying: boolean;
    publicKey: string | null;
    onVerify: () => void;
  }) => (
    <div className="rounded-xl border border-slate-700 p-8 text-center text-slate-200">
      <div className="mb-6">
        <svg
          className="w-16 h-16 mx-auto text-slate-500 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>

        {!isWalletConnected ? (
          <>
            <h3 className="text-xl font-semibold text-slate-200 mb-2">
              Connect Phantom to access your account
            </h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Connect your wallet and sign a message to view your account details, subscription
              status, and transaction history.
            </p>
          </>
        ) : verifying ? (
          <>
            <div className="animate-pulse mb-4" role="status" aria-label="Authenticating">
              <div className="w-8 h-8 mx-auto bg-indigo-600 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-semibold text-slate-200 mb-2">Authenticating...</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Please check your wallet and sign the authentication message.
            </p>
          </>
        ) : (
          <>
            <h3 className="text-xl font-semibold text-slate-200 mb-2">Authentication Required</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Your wallet is connected ({publicKey ? shortAddress(publicKey) : 'Unknown'}), but you
              need to sign a message to access your account.
            </p>
            <button
              onClick={onVerify}
              disabled={verifying}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-describedby="auth-description"
            >
              {verifying ? 'Authenticating...' : 'Sign Message to Continue'}
            </button>
            <p id="auth-description" className="sr-only">
              Click to sign a message with your wallet to authenticate and access your account
            </p>
          </>
        )}
      </div>
    </div>
  ),
);

// Extracted account details component
const AccountDetails = React.memo(({ 
  publicKey, 
  creator, 
  loadingCreator 
}: { 
  publicKey: string | null;
  creator: Creator | null;
  loadingCreator: boolean;
}) => {
  const accuracyPercentage = creator?.accuracyScore 
    ? Math.round(creator.accuracyScore * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      {loadingCreator ? (
        <div className="rounded-xl border border-slate-700 p-6 text-slate-200">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-1/4 mb-4"></div>
            <div className="h-3 bg-slate-700 rounded w-1/2 mb-3"></div>
            <div className="h-3 bg-slate-700 rounded w-2/3"></div>
          </div>
        </div>
      ) : creator ? (
        <div className="rounded-xl border border-slate-700 p-6 text-slate-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {creator.handle?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1">
                @{creator.handle || 'anonymous'}
              </h2>
              {creator.bio && (
                <p className="text-sm text-slate-400 mb-2">{creator.bio}</p>
              )}
              <p className="text-xs text-slate-500">
                Member since {new Date(creator.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {accuracyPercentage}%
              </div>
              <div className="text-xs text-slate-400">Accuracy</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-indigo-400 mb-1">
                {creator.totalPredictions}
              </div>
              <div className="text-xs text-slate-400">Total</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {creator.resolvedPredictions}
              </div>
              <div className="text-xs text-slate-400">Resolved</div>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href="/my-predictions"
              className="flex-1 text-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              My Predictions
            </a>
            <a
              href="/studio"
              className="flex-1 text-center px-4 py-2 border border-slate-600 text-slate-300 text-sm rounded-md hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Create Prediction
            </a>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700 p-6 text-center text-slate-200">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No Profile Yet</h3>
          <p className="text-sm text-slate-400 mb-4">
            Create your first prediction to establish your track record
          </p>
          <a
            href="/studio"
            className="inline-block px-6 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Get Started
          </a>
        </div>
      )}

      {/* Wallet Info */}
      <div className="rounded-xl border border-slate-700 p-6 text-slate-200">
        <h2 className="text-lg font-semibold mb-4">Wallet Connected</h2>
        <p className="text-sm text-slate-400 mb-4">
          Address:{' '}
          <span className="font-mono bg-slate-800/50 px-2 py-1 rounded">
            {publicKey ? shortAddress(publicKey) : 'Unknown'}
          </span>
        </p>
        <div className="space-y-2 text-sm">
          <div>
            Plan: <span className="font-medium text-indigo-400">Starter (Free)</span>
          </div>
          <div>
            Status: <span className="font-medium text-green-400">Active</span>
          </div>
        </div>
      </div>

      {/* Upgrade Section */}
      <div className="rounded-xl border border-slate-700 p-6 text-slate-200">
        <h3 className="text-md font-semibold mb-2">Upgrade to Pro</h3>
        <p className="text-sm text-slate-400 mb-3">
          Unlock advanced features:
        </p>
        <ul className="text-sm space-y-1 text-slate-300 mb-4" role="list">
          <li>• Advanced AI analysis</li>
          <li>• Priority support</li>
          <li>• Historical data access</li>
          <li>• Custom alerts</li>
        </ul>
        <a
          href="/pricing"
          className="inline-block px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          aria-label="View pricing plans for Pro subscription"
        >
          View Pricing
        </a>
      </div>
    </div>
  );
});

export default function AccountClient() {
  const { isConnected, publicKey } = useSimplifiedWallet();
  const { isAuthenticated: siwsOk, wallet: authWallet, verify, verifying } = useWalletAuth();
  const [mounted, setMounted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loadingCreator, setLoadingCreator] = useState(false);
  const [creatorError, setCreatorError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoize computed states to prevent unnecessary re-renders
  const computedStates = useMemo(
    () => ({
      isWalletConnected: !!publicKey && isConnected,
      isSiwsOk: siwsOk === true,
    }),
    [publicKey, isConnected, siwsOk],
  );

  const canShowAccount = useMemo(
    () => computedStates.isWalletConnected && computedStates.isSiwsOk,
    [computedStates.isWalletConnected, computedStates.isSiwsOk],
  );

  // Memoize verify handler to prevent unnecessary re-renders of child components
  const handleVerify = useCallback(() => {
    setRetryCount(prev => prev + 1);
    verify();
  }, [verify]);

  // Auto-authenticate when wallet is connected but not authenticated
  // But only do this once per mount to avoid loops
  const hasTriedAuthRef = useRef(false);
  
  useEffect(() => {
    if (
      mounted &&
      computedStates.isWalletConnected &&
      !computedStates.isSiwsOk &&
      !verifying &&
      !hasTriedAuthRef.current
    ) {
      console.log('Wallet connected but not authenticated, attempting authentication...');
      hasTriedAuthRef.current = true;
      handleVerify();
    }
  }, [
    mounted,
    computedStates.isWalletConnected,
    computedStates.isSiwsOk,
    verifying,
    handleVerify,
  ]);

  // Reset the "has tried" flag when authentication succeeds or wallet changes
  useEffect(() => {
    if (computedStates.isSiwsOk || !computedStates.isWalletConnected) {
      hasTriedAuthRef.current = false;
      setRetryCount(0);
    }
  }, [computedStates.isSiwsOk, computedStates.isWalletConnected]);

  // Fetch creator profile when authenticated
  useEffect(() => {
    if (!canShowAccount || !publicKey) {
      setCreator(null);
      setCreatorError(null);
      return;
    }

    const fetchCreator = async () => {
      try {
        setLoadingCreator(true);
        setCreatorError(null);
        
        const response = await fetch(`/api/creator/${publicKey}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // No profile yet - this is fine for new users
            setCreator(null);
            setCreatorError(null);
            return;
          }
          throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }
        
        const data = await response.json();
        setCreator(data);
      } catch (err) {
        console.error('Error fetching creator profile:', err);
        setCreatorError(err instanceof Error ? err.message : 'Failed to load profile');
        setCreator(null);
      } finally {
        setLoadingCreator(false);
      }
    };

    fetchCreator();
  }, [canShowAccount, publicKey]);

  if (!mounted) {
    return <LoadingSkeleton />;
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-100 mb-6">Your Account</h1>

      {/* Error handling removed because 'error' is not provided by useWalletAuth */}

      {!canShowAccount ? (
        <AuthenticationPrompt
          isWalletConnected={computedStates.isWalletConnected}
          verifying={verifying}
          publicKey={publicKey}
          onVerify={handleVerify}
        />
      ) : (
        <AccountDetails 
          publicKey={publicKey} 
          creator={creator}
          loadingCreator={loadingCreator}
        />
      )}
    </main>
  );
}
