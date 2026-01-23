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
          Manage your wallet and evaluations
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
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
      <div className="w-20 h-20 bg-slate-900/60 rounded-3xl border border-white/10 flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <svg
          className="w-10 h-10 text-blue-400 group-hover:scale-110 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 tracking-tighter uppercase italic">
        Wallet Login <span className="text-blue-500">_</span>
      </h2>
      <p className="text-slate-400 text-sm sm:text-base mb-6 max-w-sm mx-auto leading-relaxed">
        Connect your Solana wallet to save evaluations and track your history.
      </p>
      <p className="text-slate-500 text-xs mb-8 max-w-sm mx-auto">
        No wallet? No problem. <a href="/studio" className="text-blue-400 hover:text-blue-300 underline">Run evaluations</a> without logging in.
      </p>

      {isWalletConnected ? (
        <button
          onClick={onVerify}
          disabled={verifying}
          className="w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-900/40 active:scale-95 flex items-center justify-center gap-3"
        >
          {verifying ? (
            <>
              <div className="w-5 h-5 border-t-2 border-white/30 border-b-2 border-white rounded-full animate-spin"></div>
              Authenticating...
            </>
          ) : (
            'Sign to Access'
          )}
        </button>
      ) : (
        <div className="flex justify-center mt-2">
          <SimplifiedConnectButton />
        </div>
      )}
    </div>
  ),
);

// Extracted account details component
const AccountDetails = React.memo(
  ({
    publicKey,
    stats,
    loading,
    onDisconnect,
  }: {
    publicKey: string | null;
    stats: EvaluationStats | null;
    loading: boolean;
    onDisconnect: () => void;
  }) => {
    return (
      <div className="space-y-4 sm:space-y-8">
        {/* Consolidated Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 sm:p-6 bg-slate-900 rounded-3xl border border-white/5">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-[1px] flex-shrink-0">
              <div className="w-full h-full rounded-[15px] bg-slate-900 flex items-center justify-center text-xl sm:text-2xl font-black text-white">
                {publicKey ? publicKey.slice(0, 2).toUpperCase() : '??'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-tighter">
                  Wallet
                </span>
                <span className="text-blue-400/60 font-mono text-[10px] hidden sm:inline uppercase tracking-widest">• SOLANA • ACTIVE</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white truncate tracking-tighter">
                {publicKey ? `${publicKey.slice(0, 8)}...${publicKey.slice(-4)}` : 'Unknown'}
              </h2>
            </div>
          </div>

          <button
            onClick={() => window.confirm('Disconnect wallet?') && onDisconnect()}
            className="w-full sm:w-auto px-4 py-2 border border-white/10 hover:border-rose-500/50 hover:bg-rose-500/5 text-[10px] font-black text-slate-500 hover:text-rose-500 uppercase tracking-widest rounded-xl transition-all"
          >
            Disconnect
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/80 p-4 sm:p-6 rounded-3xl border border-white/5 text-center group hover:border-blue-500/30 transition-colors">
            <div className="text-2xl sm:text-4xl font-black text-blue-400 mb-1 group-hover:scale-110 transition-transform">
              {loading ? '...' : (stats?.averageScore?.toFixed(0) || '0')}
            </div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
              Avg AI Score
            </div>
          </div>
          <div className="bg-slate-900/80 p-4 sm:p-6 rounded-3xl border border-white/5 text-center group hover:border-blue-500/30 transition-colors">
            <div className="text-2xl sm:text-4xl font-black text-blue-400 mb-1 group-hover:scale-110 transition-transform">
              {loading ? '...' : (stats?.totalEvaluations || '0')}
            </div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
              Total Ideas
            </div>
          </div>
        </div>

        {/* Main Action Call */}
        <Link
          href="/studio"
          className="block w-full text-center py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-900/40 active:scale-[0.98]"
        >
          Start New Evaluation
        </Link>

        {/* Beta Access Notice */}
        <div className="p-6 bg-slate-900/60 rounded-3xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">
              Beta Access
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              You have full access to PrediktFi during our beta program.
            </p>
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            3 evaluations / day
          </div>
        </div>
      </div>
    );
  },
);

export default function AccountClient() {
  const { isConnected, publicKey, disconnect } = useSimplifiedWallet();
  const { isAuthenticated: siwsOk, wallet: authWallet, verify, verifying, isLoading: isAuthLoading } = useWalletAuth();
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
      !isAuthLoading && // IMPORTANT: Wait for initial status check
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tighter mb-2 bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent uppercase italic">
            Account <span className="text-blue-500">.</span>
          </h1>
          <p className="text-white/40 text-[10px] sm:text-lg max-w-xl font-medium tracking-[0.2em] uppercase">
            Manage your wallet and evaluations
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
            onDisconnect={disconnect}
          />
          <div className="mt-12 border-t border-slate-700 pt-12">
            <IdeaHistory />
          </div>
        </>
      )}
    </main>
  );
}
