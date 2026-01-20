"use client";

import Link from "next/link";
import { SITE } from "../config/site";
import { useEffect, useState } from "react";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

export default function EnhancedHero() {
  const [isMockMode, setIsMockMode] = useState(false);

  // Check if we're in production
  const isProduction = process.env.NODE_ENV === 'production' &&
    (process.env.NEXT_PUBLIC_APP_ENV === 'production' ||
      (typeof window !== 'undefined' && window.location.hostname !== 'localhost'));

  useEffect(() => {
    // Don't show mock mode in production
    if (isProduction) {
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
  }, [isProduction]);

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
      <div className="relative z-[1] mx-auto max-w-[1100px] px-6 py-12 sm:py-16 md:py-18">
        {/* Status Badges */}
        <div className="flex items-center gap-3 mb-6">
          <Badge variant="success" size="md">
            <span className="mr-1">●</span>
            Live on Devnet
          </Badge>

          {!isProduction && isMockMode && (
            <Badge variant="warning" size="md">
              <span className="mr-1">⚡</span>
              Mock Mode
            </Badge>
          )}

          {!isProduction && !isMockMode && (
            <button
              onClick={handleTryMockMode}
              className="text-xs text-[color:var(--muted)]/70 hover:text-[color:var(--muted)] transition-colors underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]/50 rounded px-2 py-1"
            >
              Try mock mode
            </button>
          )}
        </div>

        {/* Hero Content */}
        <div className="max-w-4xl">
          {/* Main Heading */}
          <h1 className="font-extrabold leading-tight text-[clamp(2.25rem,7vw,5.5rem)] text-[color:var(--text)] mb-6">
            Ask smarter.{" "}
            <span className="bg-gradient-to-r from-blue-500 via-teal-500 to-orange-500 bg-clip-text text-transparent">
              Log insights on-chain
            </span>
            .
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-200 mb-8 max-w-2xl leading-relaxed">
            Predikt is an AI-powered evaluation studio. Stress-test ideas, get a probability with rationale, and stamp it on Solana.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-start gap-4 mb-12">
            <Link href="/studio">
              <Button size="lg" className="font-semibold">
                Open Studio
              </Button>
            </Link>
            <Link href="/feed">
              <Button variant="secondary" size="lg">
                View Feed
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center gap-4 text-sm text-[color:var(--muted)]/80">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gradient-to-r from-teal-400 to-orange-400 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">S</span>
              </div>
              <span>Powered by Solana</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">AI</span>
              </div>
              <span>AI-Enhanced</span>
            </div>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>
    </section>
  );
}
