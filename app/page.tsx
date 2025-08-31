"use client";

import Link from "next/link";
import { markets } from "./lib/markets";
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
            <Link
      href="/markets"
              className="text-sm text-[color:var(--accent)] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(() => {
              const top = markets
                .filter((m) => m.isActive)
                .sort((a, b) => b.totalVolume - a.totalVolume)
                .slice(0, 3);
              if (top.length === 0) {
                return [1, 2, 3].map((id) => (
                  <div key={id}>
                    <Link
                      href={`/market/${id}`}
                      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 rounded-[var(--radius)]"
                    >
                      <Card>
                        <div className="mb-2 text-sm text-[color:var(--muted)]">
                          Market #{id}
                        </div>
                        <div className="text-[color:var(--text)]">
                          Sample market headline {id}
                        </div>
                      </Card>
                    </Link>
                  </div>
                ));
              }
              return top.map((m) => (
                <div key={m.id}>
                  <Link
                    href={`/market/${m.id}`}
                    className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 rounded-[var(--radius)]"
                  >
                    <Card>
                      <div className="mb-1 text-[color:var(--text)] font-medium">
                        {m.title}
                      </div>
                      <div className="mb-3 text-sm text-[color:var(--muted)]">
                        {m.description}
                      </div>
                      <div className="flex items-center justify-between text-xs text-[color:var(--muted)]/90">
                        <span>Vol: {nf.format(m.totalVolume)} SOL</span>
                        <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[color:var(--surface)]/60 px-2 py-0.5 text-[color:var(--text)]/90">
                          View
                        </span>
                      </div>
                    </Card>
                  </Link>
                </div>
              ));
            })()}
          </div>
        </section>

  {/* Full markets grid moved to /markets */}
      </main>
    </div>
  );
}
