
'use client';

import { useEffect, useState } from 'react';

async function startCheckout(): Promise<void> {
  const res = await fetch('/api/billing/checkout', { method: 'POST' });
  if (!res.ok) throw new Error('checkout_failed');
  const json = await res.json();
  if (json?.hosted_url) window.location.href = json.hosted_url as string;
}

async function redeemLicense(license: string): Promise<boolean> {
  const res = await fetch('/api/billing/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ license }),
  });
  return res.ok;
}

export default function PricingTable() {
  const [showModal, setShowModal] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [license, setLicense] = useState('');
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    // We can't read httpOnly cookie in client. Optionally rely on middleware-provided header echoed by a lightweight endpoint.
    // Simple heuristic: call a tiny endpoint that returns plan based on cookie; to keep scope small, try to parse document.cookie fallback.
    // If not available, buttons remain enabled; server pages will still respect plan.
    try {
      if (document.cookie.includes('predikt_plan=pro')) setIsPro(true);
    } catch {}
  }, []);

  const plans = [
  {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        '10 insights per day',
        'Community feed',
        'Templates'
      ],
      cta: 'Get Started',
      current: true
    },
    {
      name: 'Pro',
      price: '$9',
      period: 'month',
      features: [
        'Unlimited insights',
        'Priority processing',
        'Advanced prompts',
        'Crypto payments via Coinbase'
      ],
      cta: 'Upgrade with Crypto',
      highlight: true
    }
  ];

  return (
    <>
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border p-8 ${
              plan.highlight
                ? 'border-[--accent] bg-gradient-to-b from-[--accent]/5 to-transparent'
                : 'border-[--border] bg-[--surface]'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[--accent] text-white px-3 py-1 rounded-full text-sm font-medium">
                  Popular
                </span>
              </div>
            )}
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-[--text] mb-2">{plan.name}</h3>
              <div className="mb-1">
                <span className="text-3xl font-bold text-[--text]">{plan.price}</span>
                {plan.period && (
                  <span className="text-gray-500 ml-1">/{plan.period}</span>
                )}
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-[--text]">
                  <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (plan.highlight) startCheckout().catch(() => alert('Checkout failed'));
                }}
                disabled={plan.current || isPro}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                plan.current || isPro
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : plan.highlight
                  ? 'bg-[--accent] text-white hover:bg-[--accent]/90'
                  : 'border border-[--border] text-[--text] hover:bg-gray-50'
              }`}
              >
                {plan.current || isPro ? 'You’re Pro' : plan.cta}
              </button>
              {plan.highlight && (
                <button
                  type="button"
                  onClick={() => setRedeemOpen(true)}
                  className="py-3 px-4 border border-[--border] rounded-lg text-[--text] hover:bg-gray-50"
                >
                  Redeem code
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Redeem Modal */}
      {redeemOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Redeem your license</h3>
            <div className="space-y-4">
              <input
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                placeholder="Paste license code"
                className="w-full px-3 py-2 border border-[--border] rounded-lg bg-[--surface] text-[--text]"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setRedeemOpen(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const ok = await redeemLicense(license);
                    if (ok) {
                      setIsPro(true);
                      setRedeemOpen(false);
                      alert('Redeemed! You are now Pro.');
                    } else {
                      alert('Invalid or not yet confirmed');
                    }
                  }}
                  className="flex-1 py-2 px-4 bg-[--accent] text-white rounded-lg hover:bg-[--accent]/90"
                >
                  Redeem
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
