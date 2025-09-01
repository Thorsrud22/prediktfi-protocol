"use client";

import Link from "next/link";
import { markets } from "./lib/markets";
import { MOCK_MARKETS } from "./lib/markets.mock";
import Hero from "./components/Hero";
import Card from "./components/Card";
import { useReducedMotion } from "framer-motion";

// Markets are now imported from app/lib/markets

export default function Home() {
  const reduce = useReducedMotion();
  const nf = new Intl.NumberFormat("en-US");

  return (
    <div>
      <main style={{ padding: "2rem" }}>
        <h1 className="sr-only">Predikt</h1>
        {/* Hero section with slight fade-up */}
        <Hero />

    {/* Featured Markets */}
    <section id="markets" className="relative z-[1] mx-auto mt-8 max-w-[1100px] px-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[color:var(--text)]">
              Featured Markets
            </h2>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {MOCK_MARKETS.slice(0, 3).map((m) => (
              <a
                key={m.id}
                href={`/market/${m.id}`}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/[0.08] transition-colors"
              >
                <div className="text-sm text-white/70">{m.title}</div>
                <div className="mt-1 text-xs text-white/50">
                  Vol: {m.volume.toLocaleString()} SOL • Ends: {new Date(m.endsAt).toLocaleDateString()}
                </div>
              </a>
            ))}
          </div>
          
          <div className="mt-6 text-right">
            <a
              href="/markets"
              className="inline-flex items-center rounded-lg px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              View all markets
            </a>
          </div>
        </section>

  {/* Full markets grid moved to /markets */}
      </main>
    </div>
  );
}
