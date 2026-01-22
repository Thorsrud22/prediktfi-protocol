'use client';

import { useState, useEffect, ReactNode } from 'react';
import { getQuota, isExhausted, resetIfNewDay } from '../lib/quota';
import { trackClient } from '../lib/analytics';
import Link from 'next/link';

interface QuotaGuardProps {
  children: ReactNode;
  onExhausted?: () => void;
  className?: string;
}

export default function QuotaGuard({ children, onExhausted, className }: QuotaGuardProps) {
  const [exhausted, setExhausted] = useState(false);
  const [quota, setQuota] = useState({ used: 0, limit: 999999, remaining: 999999 });

  useEffect(() => {
    // For development, always set unlimited quota
    const currentQuota = { used: 0, limit: 999999, remaining: 999999, resetAtIso: new Date().toISOString() };
    setQuota(currentQuota);
    setExhausted(false); // Never exhausted in development
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
                Join Pro Waitlist for unlimited insights →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
