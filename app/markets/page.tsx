"use client";

import Link from "next/link";
import type { Metadata } from "next";
import { MOCK_MARKETS } from "../lib/markets.mock";

// Stable formatting functions to avoid hydration mismatches
function formatDate(dateStr: string): string {
  // Extract date directly from ISO string to avoid timezone issues
  return dateStr.split('T')[0];
}

function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Metadata moved to metadata.ts

export default function MarketsPage() {
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-6">All Markets</h1>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {MOCK_MARKETS.map((m: { id: string, title: string, summary: string, endsAt: string, volume: number }) => (
          <Link
            key={m.id}
            href={`/market/${m.id}`}
            className="block rounded-xl border border-white/10 bg-white/5 hover:bg-white/[0.08] transition-colors p-5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <h2 className="text-lg font-semibold text-white">{m.title}</h2>
            <p className="mt-2 text-sm text-white/60 line-clamp-2">{m.summary}</p>

            <div className="mt-4 flex items-center justify-between text-xs text-white/50">
              <span>Ends: {formatDate(m.endsAt)}</span>
              <span>Vol: {formatNumber(m.volume)} SOL</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
