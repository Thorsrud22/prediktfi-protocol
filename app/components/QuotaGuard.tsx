'use client';

import { useState, useEffect, ReactNode } from 'react';
import { getQuota, isExhausted, resetIfNewDay } from '../lib/quota';
import Link from 'next/link';

interface QuotaGuardProps {
  children: ReactNode;
  onExhausted?: () => void;
  className?: string;
}

export default function QuotaGuard({ children, onExhausted, className }: QuotaGuardProps) {
  const [exhausted, setExhausted] = useState(false);
  const [quota, setQuota] = useState({ used: 0, limit: 10, remaining: 10 });

  useEffect(() => {
    resetIfNewDay();
    const currentQuota = getQuota();
    const isQuotaExhausted = isExhausted();
    
    setQuota(currentQuota);
    setExhausted(isQuotaExhausted);
    
    if (isQuotaExhausted && onExhausted) {
      onExhausted();
    }
  }, [onExhausted]);

  if (exhausted) {
    return (
      <div className={`relative ${className || ''}`}>
        <div className="relative">
          {children}
          <div className="absolute inset-0 bg-gray-100/80 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <div className="text-center p-4">
              <p className="text-sm text-gray-600 mb-2">
                Daily free limit reached ({quota.limit})
              </p>
              <Link 
                href="/pricing"
                className="text-[--accent] hover:text-[--accent]/80 text-sm font-medium"
              >
                Upgrade to Pro for unlimited insights →
              </Link>
              <button
                onClick={() => {
                  const code = prompt('Have a license? Paste it to redeem');
                  if (!code) return;
                  fetch('/api/billing/redeem', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ license: code })
                  }).then((r) => {
                    if (r.ok) {
                      window.location.reload();
                    } else {
                      alert('Invalid or not yet confirmed');
                    }
                  });
                }}
                className="ml-3 text-sm text-gray-600 underline"
              >
                Redeem code
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
