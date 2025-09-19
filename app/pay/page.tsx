'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// Wallet connection handled by header
import { useSimplifiedWallet } from '../components/wallet/SimplifiedWalletProvider';

type Plan = 'starter' | 'pro';
type Currency = 'USDC' | 'SOL';

const PLAN_PRICE_USD: Record<Plan, number> = { starter: 9, pro: 29 };

export default function PayPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const { isConnected, publicKey } = useSimplifiedWallet();
  const ready = isConnected;

  const initialPlan = (sp.get('plan') as Plan) || 'pro';
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [currency, setCurrency] = useState<Currency>('SOL');
  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const price = PLAN_PRICE_USD[plan];

  // Derived copy
  const payCta = useMemo(() => {
    const label = currency === 'SOL' ? `Pay ${price} SOL` : `Pay ${price} USDC`;
    if (!isConnected) {
      return 'Connect wallet to pay';
    }
    return label;
  }, [currency, isConnected, price]);

  async function handlePay() {
    if (loading) return;
    if (!ready || !publicKey) return;
    
    setLoading(true);
    try {
      setQrUrl(null);

      // Plug into your existing invoice endpoint:
      const res = await fetch('/api/pay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          payer: publicKey,
          currency,
        }),
      });
      
      const data = await res.json();
      if (!res.ok || !data?.link) {
        console.error('[InvoiceError]', data);
        // toast.error(data?.error || 'Failed to create invoice')
        return;
      }
      
      // Support both QR-first and deep-link flows
      if (data.qrUrl) setQrUrl(data.qrUrl);
      if (data.link || data.deepLink) {
        // Open wallet deeplink
        window.location.href = data.link || data.deepLink;
      }

      // Poll auth status for up to 5 seconds after payment
      if (data.link || data.deepLink || data.qrUrl) {
        await pollAuthStatus();
      }
    } catch (e) {
      console.error('[InvoiceError]', e);
      // toast.error('Failed to create invoice')
    } finally {
      setLoading(false);
    }
  }

  const pollAuthStatus = async () => {
    const maxAttempts = 10; // 5 seconds with 500ms intervals
    let attempts = 0;

    const poll = async (): Promise<void> => {
      if (attempts >= maxAttempts) {
        console.log('Auth status polling timeout');
        return;
      }

      try {
        const response = await fetch('/api/auth/status');
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            // Update local state without full reload
            window.dispatchEvent(new CustomEvent('auth-status-updated', { 
              detail: { authenticated: true, wallet: data.wallet } 
            }));
            
            // Show success message
            const successEvent = new CustomEvent('show-toast', {
              detail: { message: 'Pro active! Payment successful.', type: 'success' }
            });
            window.dispatchEvent(successEvent);
            
            return;
          }
        }
      } catch (error) {
        console.error('Auth status polling error:', error);
      }

      attempts++;
      setTimeout(poll, 500);
    };

    poll();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Upgrade to <span className="text-indigo-400">Pro</span>
            </h1>
            <p className="mt-2 text-slate-400">
              Pay with crypto and unlock advanced features.
            </p>
          </div>
          {isConnected && (
            <div className="flex items-center gap-2 bg-green-600/20 text-green-400 px-3 py-2 rounded-lg border border-green-600/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Pro Active</span>
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Plans */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="mb-4 text-lg font-semibold">Choose Plan</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {(['starter', 'pro'] as Plan[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={[
                    'rounded-xl border p-5 text-left transition',
                    plan === p
                      ? 'border-indigo-500/60 bg-slate-800'
                      : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold capitalize">{p}</div>
                    <div className="text-xl font-bold">${PLAN_PRICE_USD[p]}</div>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-slate-400">
                    {p === 'starter' ? (
                      <>
                        <li>• Basic insights</li>
                        <li>• Limited quotes</li>
                      </>
                    ) : (
                      <>
                        <li>• Unlimited insights</li>
                        <li>• Advanced analytics</li>
                        <li>• Priority support</li>
                      </>
                    )}
                  </ul>
                </button>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="mb-4 text-lg font-semibold">Payment Method</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {(['USDC', 'SOL'] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={[
                    'rounded-xl border p-4 text-left transition',
                    currency === c
                      ? 'border-indigo-500/60 bg-slate-800'
                      : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900',
                  ].join(' ')}
                >
                  <div className="text-base font-medium">{c}</div>
                  <div className="text-xs text-slate-500">
                    {c === 'USDC'
                      ? 'Stablecoin – exact amount'
                      : 'Native token – price may vary'}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              {!isConnected ? (
                <div className="text-sm text-slate-400 text-center">
                  Connect with Phantom in the header to continue.
                </div>
              ) : (
                <div className="text-sm text-slate-400 text-center">
                  Paying from: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-4)}
                </div>
              )}
            </div>

            <button
              onClick={handlePay}
              disabled={!ready || !publicKey || loading}
              className={[
                'mt-6 w-full rounded-xl px-5 py-3 font-semibold transition',
                ready && publicKey
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed',
              ].join(' ')}
            >
              {loading ? 'Preparing…' : payCta}
            </button>

            {/* Optional QR preview */}
            {qrUrl && (
              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="text-sm text-slate-400">Scan to pay</div>
                <img
                  src={qrUrl}
                  alt="Payment QR"
                  className="mt-3 h-44 w-44 rounded-lg bg-white p-2"
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
