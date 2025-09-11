"use client";

import Link from "next/link";
import { SITE } from "../config/site";
import { useEffect, useState, memo, useCallback } from "react";

const Hero = memo(function Hero() {
  const [isMockMode, setIsMockMode] = useState(false);
  const [isProduction, setIsProduction] = useState(false);

  useEffect(() => {
    // Check if we're in production - do this on client side to avoid hydration mismatch
    const prodCheck = process.env.NODE_ENV === 'production' && 
      (process.env.NEXT_PUBLIC_APP_ENV === 'production' || 
       window.location.hostname !== 'localhost');
    
    setIsProduction(prodCheck);

    // Don't show mock mode in production
    if (prodCheck) {
      return;
    }
    
    // Check for mock mode from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const hasMockParam = urlParams.get('mock') === '1';
    const hasStoredMock = localStorage.getItem('NEXT_PUBLIC_MOCK_TX') === '1';
    
    if (hasMockParam && !hasStoredMock) {
      localStorage.setItem('NEXT_PUBLIC_MOCK_TX', '1');
      window.location.reload();
      return;
    }
    
    setIsMockMode(hasStoredMock || process.env.NEXT_PUBLIC_MOCK_TX === '1');
  }, []);

  const handleTryMockMode = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('mock', '1');
    window.location.href = url.toString();
  }, []);

  return (
    <section
      aria-label={`${SITE.name} hero`}
      className="relative isolate overflow-hidden min-h-[600px] flex items-center"
    >
      <div className="mx-auto max-w-7xl px-4 relative z-10 py-20">
        {/* Badge */}
        <div className="flex items-center gap-3 mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-700/50 bg-[#0B1426]/70 px-3 py-1 text-xs font-medium text-blue-200 backdrop-blur-sm">
            <span aria-hidden>●</span>
            <span>Live on Devnet</span>
          </div>
          {!isProduction && isMockMode && (
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 backdrop-blur-sm">
              <span aria-hidden>⚡</span>
              <span>Mock Mode</span>
            </div>
          )}
          {!isProduction && !isMockMode && (
            <button
              onClick={handleTryMockMode}
              className="text-xs text-blue-300/70 hover:text-blue-200 transition-colors underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400/50 rounded"
            >
              Try mock mode
            </button>
          )}
        </div>

        {/* Hero text container */}
        <div className="max-w-4xl">
          {/* Heading */}
          <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight text-blue-100">
            Ask smarter. <span className="bg-gradient-to-r from-blue-300 to-teal-300 bg-clip-text text-transparent">Log insights on-chain</span>.
          </h1>

          {/* Lead */}
          <p className="mt-6 max-w-2xl text-lg text-blue-200/90">
            Predikt is an AI-first prediction studio. Ask a question, get a probability with rationale, and stamp it on Solana.
          </p>
          
          {/* How it works */}
          <div className="mt-4 text-sm text-blue-300/80">
            <p>
              <strong>Sign</strong> with your Solana wallet (no email needed) • 
              <strong>Pay</strong> in USDC or SOL (funds go directly to our on-chain wallet) • 
              <strong>Unlock</strong> Pro instantly—verifiable on chain
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/studio"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-teal-600 text-white font-semibold hover:shadow-lg transition-all"
          >
            Open Studio
          </Link>
          <Link
            href="/feed"
            className="inline-flex items-center px-4 py-3 text-sm text-slate-400 hover:text-slate-300 transition-colors underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/50 rounded"
          >
            View Feed
          </Link>
        </div>

        {/* Trust row */}
        <div className="mt-12 flex items-center gap-2 text-xs text-slate-500">
          <span>Powered by Solana</span>
          <span className="opacity-60" aria-hidden>
            ◆
          </span>
        </div>
      </div>
    </section>
  );
});

export default Hero;
