'use client';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSimplifiedWallet } from '../components/wallet/SimplifiedWalletProvider';
import { useWalletAuth } from '../lib/useWalletAuth';
import IdeaHistory from '../components/IdeaHistory';
import SimplifiedConnectButton from '../components/wallet/SimplifiedConnectButton';
import Link from 'next/link';

function shortAddress(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

interface EvaluationStats {
  totalEvaluations: number;
  averageScore: number;
  lastActivity: string | null;
}

// Extracted loading skeleton component for better reusability
const LoadingSkeleton = React.memo(() => (
  <main className="max-w-4xl mx-auto px-4 py-10">
    <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-6">
      <div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-2 bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
          Account <span className="text-blue-500">.</span>
        </h1>
        <p className="text-white/60 text-base md:text-lg max-w-xl font-light">
          Manage your wallet, evaluations, and subscription
        </p>
      </div>
    </div>
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
            <SimplifiedConnectButton />
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
  stats,
  loading
}: {
  publicKey: string | null;
  stats: EvaluationStats | null;
  loading: boolean;
}) => {
  const hasHistory = stats && stats.totalEvaluations > 0;

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      {loading ? (
        <div className="rounded-xl border border-slate-700 p-6 text-slate-200">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-1/4 mb-4"></div>
            <div className="h-3 bg-slate-700 rounded w-1/2 mb-3"></div>
            <div className="h-3 bg-slate-700 rounded w-2/3"></div>
          </div>
        </div>
      ) : hasHistory ? (
        <div className="rounded-xl border border-slate-700 p-6 text-slate-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {/* Use first 2 chars of address as avatar */}
              {publicKey?.slice(0, 2) || '?'}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1">
                {publicKey ? shortAddress(publicKey) : 'Unknown'}
              </h2>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-xs border border-indigo-500/30">
                  Idea Validator
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {stats?.averageScore || 0}
              </div>
              <div className="text-xs text-slate-400">Avg AI Score</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-indigo-400 mb-1">
                {stats?.totalEvaluations || 0}
              </div>
              <div className="text-xs text-slate-400">Total Evaluations</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/studio"
              className="flex-1 text-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Start New Evaluation
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700 p-6 text-center text-slate-200">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No Evaluations Yet</h3>
          <p className="text-sm text-slate-400 mb-4">
            Validate your first idea to establish your track record.
          </p>
          <Link
            href="/studio"
            className="inline-block px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-semibold rounded-md hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 transition-all duration-300"
          >
            Start Evaluation
          </Link>
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

  // New Stats State
  const [stats, setStats] = useState<EvaluationStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

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

  // Fetch stats when authenticated
  useEffect(() => {
    if (!canShowAccount || !publicKey) {
      setStats(null);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const response = await fetch(`/api/account/stats?address=${publicKey}`);

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Error fetching account stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [canShowAccount, publicKey]);

  if (!mounted) {
    return <LoadingSkeleton />;
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-2 bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
            Account <span className="text-blue-500">.</span>
          </h1>
          <p className="text-white/60 text-base md:text-lg max-w-xl font-light">
            Manage your wallet, evaluations, and subscription
          </p>
        </div>
      </div>

      {!canShowAccount ? (
        <AuthenticationPrompt
          isWalletConnected={computedStates.isWalletConnected}
          verifying={verifying}
          publicKey={publicKey}
          onVerify={handleVerify}
        />
      ) : (
        <>
          <AccountDetails
            publicKey={publicKey}
            stats={stats}
            loading={loadingStats}
          />
          <div className="mt-12 border-t border-slate-700 pt-12">
            <IdeaHistory />
          </div>
        </>
      )}
    </main>
  );
}
