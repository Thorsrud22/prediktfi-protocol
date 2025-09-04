"use client";

import Link from "next/link";
import { markets } from "./lib/markets";
import { MOCK_MARKETS } from "./lib/markets.mock";
import Hero from "./components/Hero";
import Card from "./components/Card";
import { useReducedMotion } from "framer-motion";
import { formatRelative } from "./lib/format";

// Stable formatting functions to avoid hydration mismatches
function formatDate(dateStr: string): string {
  // Extract date directly from ISO string to avoid timezone issues
  return dateStr.split('T')[0];
}

function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Markets are now imported from app/lib/markets

export default function Home() {
  const reduce = useReducedMotion();
  const nf = new Intl.NumberFormat("en-US");

  return (
    <div>
      <main>
        <h1 className="sr-only">Predikt</h1>
        {/* Hero section with reduced padding */}
        <Hero />

    {/* Featured Markets - positioned higher to be visible above fold */}
    <section id="markets" className="relative z-[1] mx-auto -mt-6 max-w-[1100px] px-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-[color:var(--text)]">
              Featured Markets
            </h2>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {MOCK_MARKETS.slice(0, 3).map((m) => (
              <Link
                key={m.id}
                href="/studio"
                data-testid={`market-card-${m.id}`}
                className="block rounded-lg border border-white/10 bg-white/5 px-4 py-3 transition-all hover:shadow-lg/10 hover:ring-1 hover:ring-white/10 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div className="text-sm text-white/70 mb-3">{m.title}</div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-white/50">
                      Ends {formatRelative(m.endsAt)}
                    </span>
                    <div className="inline-flex items-center gap-1">
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-400 text-xs font-medium">
                        {nf.format(m.volume)} SOL
                      </span>
                      <span className="text-white/40">volume</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="mt-6 text-right">
            <Link
              href="/studio"
              data-testid="view-all-markets"
              className="inline-flex items-center rounded-lg px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Try AI Studio
            </Link>
          </div>
        </section>

  {/* Full markets grid moved to /markets */}
      </main>
    </div>
  );
}
