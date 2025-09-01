"use client";

import Link from "next/link";
import { SITE } from "../config/site";
import { useEffect, useState } from "react";

export default function Hero() {
  const [isMockMode, setIsMockMode] = useState(false);

  useEffect(() => {
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

  const handleTryMockMode = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('mock', '1');
    window.location.href = url.toString();
  };

  return (
    <section
      aria-label={`${SITE.name} hero`}
      className="relative isolate overflow-hidden bg-hero noise"
    >
      <div className="relative z-[1] mx-auto max-w-[1100px] px-6 py-20 sm:py-24 md:py-28">
        {/* Badge */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[color:var(--surface)]/70 px-3 py-1 text-xs font-medium text-[color:var(--muted)] backdrop-blur-sm">
            <span aria-hidden>●</span>
            <span>Live on Devnet</span>
          </div>
          {isMockMode && (
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 backdrop-blur-sm">
              <span aria-hidden>⚡</span>
              <span>Mock Mode</span>
            </div>
          )}
        </div>

        {/* Hero text container with constrained width */}
        <div className="max-w-3xl md:max-w-4xl">
          {/* Heading */}
          <h1 className="mt-5 font-extrabold leading-tight text-[clamp(2.25rem,7vw,5.5rem)] text-[color:var(--text)]">
            Predict markets <span className="text-gradient">without limits</span>.
          </h1>

          {/* Lead with improved contrast */}
          <p className="mt-4 max-w-2xl text-base sm:text-lg text-slate-200">
            Turning insights into assets — built on Solana.
          </p>
        </div>

        {/* CTAs - mobile stack vertically, desktop horizontal */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="https://github.com/Thorsrud22/prediktfi-protocol#readme"
            target="_blank"
            rel="noreferrer noopener"
            className="btn-outline min-h-11 text-sm"
          >
            View Docs
          </Link>
          {!isMockMode && (
            <button
              onClick={handleTryMockMode}
              className="min-h-11 text-sm text-[color:var(--muted)] hover:text-[color:var(--text)] transition-colors underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
            >
              Try mock mode
            </button>
          )}
        </div>

        {/* Trust row (optional) */}
        <div className="mt-10 flex items-center gap-2 text-xs text-[color:var(--muted)]/80">
          <span>Powered by Solana</span>
          {/* Optional logo slot; 60% opacity */}
          <span className="opacity-60" aria-hidden>
            ◆
          </span>
        </div>
      </div>

      {/* Reduced motion: keep visuals static; nothing animated here */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          /* No animations to disable in this section, placeholder for future */
        }
      `}</style>
    </section>
  );
}
