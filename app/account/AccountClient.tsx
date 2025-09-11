'use client';

import { useState, useEffect } from 'react';
import { useWalletAuth } from '../lib/useWalletAuth';
import { useRouter } from 'next/navigation';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface PaymentHistory {
  id: string;
  plan: string;
  amountUsd: number;
  token: string;
  status: string;
  createdAt: string;
  transactionSignature?: string;
}

export default function AccountClient() {
  const { isAuthenticated, wallet, connectAndAuthenticate, isLoading } = useWalletAuth();
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      fetchAccountData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Check for upgrade success in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('upgraded') === '1') {
      setShowUpgradeSuccess(true);
      const planParam = urlParams.get('plan');
      const expiresAtParam = urlParams.get('expiresAt');
      if (planParam) setPlan(planParam as 'free' | 'pro');
      if (expiresAtParam) setExpiresAt(expiresAtParam);
      // Clean up URL
      router.replace('/account');
    }
  }, [router]);

  // Show tour for first-time users
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('predikt-tour-seen');
    if (!hasSeenTour && isAuthenticated) {
      setShowTour(true);
    }
  }, [isAuthenticated]);

  const fetchAccountData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Fetch plan and payment history
      const [planResponse, paymentsResponse] = await Promise.all([
        fetch('/api/account/plan'),
        fetch('/api/account/payments')
      ]);

      if (planResponse.ok) {
        const planData = await planResponse.json();
        setPlan(planData.plan);
        setExpiresAt(planData.expiresAt);
      }

      if (paymentsResponse.ok) {
        const payments = await paymentsResponse.json();
        setPaymentHistory(payments);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch account data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    // First refresh auth status, then account data
    try {
      await fetch('/api/auth/status');
      await fetch('/api/billing/payments');
    } catch (error) {
      console.error('Failed to refresh auth status:', error);
    }
    fetchAccountData(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[--background] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--accent] mx-auto mb-4"></div>
          <p className="text-[--muted]">Loading account...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[--background]">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-3xl font-bold text-[--text] mb-4">Your Account</h1>
            <p className="text-[--muted] mb-8">
              Connect your wallet to manage your plan and view receipts.
            </p>
            
            <div className="bg-[--surface] border border-[--border] rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-[--text] mb-4">Connect Your Wallet</h2>
              <p className="text-sm text-[--muted] mb-6">
                Your wallet is your account. Sign with your Solana wallet to access your subscription and payment history.
              </p>
              <button
                onClick={connectAndAuthenticate}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-[--accent] text-white rounded-lg hover:bg-[--accent]/90 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Connecting...' : 'Connect Wallet (this is your account)'}
              </button>
            </div>

            <div className="text-sm text-[--muted]">
              <p className="mb-2">How it works:</p>
              <ul className="space-y-1 text-left">
                <li>• <strong>Sign</strong> with your Solana wallet (no email needed)</li>
                <li>• <strong>Pay</strong> in USDC or SOL (funds go directly to our on-chain wallet)</li>
                <li>• <strong>Unlock</strong> Pro instantly—verifiable on chain</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--background]">
      {/* Upgrade Success Modal */}
      {showUpgradeSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upgrade Successful!</h3>
              <p className="text-gray-600 mb-4">
                Your wallet is now your account. You have Pro access with unlimited insights.
              </p>
              <button
                onClick={() => setShowUpgradeSuccess(false)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First-time Tour Modal */}
      {showTour && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Predikt!</h3>
              <div className="text-left space-y-3 mb-6">
                <p className="text-gray-600">
                  <strong>Your wallet is your account.</strong> No email needed, just connect and go.
                </p>
                <p className="text-gray-600">
                  <strong>Pay in USDC or SOL</strong> → funds go directly to our on-chain wallet
                </p>
                <p className="text-gray-600">
                  <strong>Unlock Pro instantly</strong> — verifiable on chain
                </p>
                <p className="text-gray-600">
                  <strong>Receipts are on-chain</strong> + downloadable
                </p>
              </div>
              <button
                onClick={() => {
                  setShowTour(false);
                  localStorage.setItem('predikt-tour-seen', 'true');
                }}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[--text] mb-2">Your Account</h1>
              <p className="text-[--muted]">Manage your plan and view payment history</p>
            </div>
            <div className="flex items-center gap-3">
              {lastRefresh && (
                <div className="text-sm text-[--muted]">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 bg-[--surface] border border-[--border] rounded-lg hover:bg-[--surface-hover] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Wallet Info */}
        <div className="bg-[--surface] border border-[--border] rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[--text]">Wallet</h2>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Connected</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
              <span className="text-blue-500 font-bold">W</span>
            </div>
            <div>
              <p className="font-mono text-[--text]">{wallet}</p>
              <p className="text-sm text-[--muted]">Solana wallet</p>
            </div>
          </div>
        </div>

        {/* Current Plan */}
        <div className="bg-[--surface] border border-[--border] rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[--text]">Current Plan</h2>
            <div className="flex items-center gap-2">
              {plan === 'pro' ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Active</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Free Tier</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                plan === 'pro' 
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {plan === 'pro' ? 'Pro' : 'Free'}
              </span>
              {plan === 'pro' && expiresAt && (
                <div className="mt-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <p className="text-sm text-[--muted]">
                    Expires: {new Date(expiresAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {plan === 'pro' && (
                <div className="mt-2">
                  <p className="text-sm text-[--muted]">
                    ✓ Unlimited insights • Priority processing • Advanced prompts
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    🚀 No rate limits applied
                  </p>
                </div>
              )}
              {plan === 'free' && (
                <p className="text-sm text-[--muted] mt-2">
                  10 insights per day • Community features
                </p>
              )}
            </div>
            {plan === 'free' ? (
              <a 
                href="/pay?plan=pro" 
                className="px-4 py-2 bg-[--accent] text-white rounded-md hover:bg-[--accent]/90 transition-colors"
              >
                Upgrade to Pro
              </a>
            ) : (
              <a 
                href="/pay?plan=pro" 
                className="px-4 py-2 bg-[--accent] text-white rounded-md hover:bg-[--accent]/90 transition-colors"
              >
                Renew/Extend
              </a>
            )}
          </div>
        </div>

        {/* Payment History */}
        {paymentHistory.length > 0 && (
          <div className="bg-[--surface] border border-[--border] rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">Payment History</h2>
            <div className="space-y-3">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-[--background] rounded-lg border border-[--border]">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {payment.status === 'PAID' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[--text]">
                        {payment.plan === 'pro' ? 'Pro' : 'Starter'} Plan
                      </p>
                      <p className="text-sm text-[--muted]">
                        {payment.amountUsd} USD • {payment.token} • {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                      {payment.transactionSignature && (
                        <p className="text-xs text-blue-500 font-mono">
                          TX: {payment.transactionSignature.slice(0, 8)}...{payment.transactionSignature.slice(-8)}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    payment.status === 'PAID' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="text-center">
          <p className="text-sm text-[--muted] mb-4">Need help?</p>
          <div className="flex justify-center gap-6 text-sm">
            <a href="/legal/terms" className="text-[--accent] hover:underline">Terms</a>
            <a href="/legal/privacy" className="text-[--accent] hover:underline">Privacy</a>
            <a href="/legal/refund" className="text-[--accent] hover:underline">Refund Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}
