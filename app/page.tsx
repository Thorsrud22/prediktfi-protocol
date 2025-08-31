"use client";

import Link from "next/link";
import { markets } from "./lib/markets";
import Hero from "./components/Hero";
import Card from "./components/Card";
import { useReducedMotion } from "framer-motion";

// Markets are now imported from app/lib/markets

export default function Home() {
  const reduce = useReducedMotion();

  return (
    <div>
      <main style={{ padding: "2rem" }}>
        <h1 className="sr-only">Predikt</h1>
        {/* Hero section with slight fade-up */}
        <Hero />

        {/* Featured Markets */}
        <section className="relative z-[1] mx-auto mt-8 max-w-[1100px] px-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[color:var(--text)]">
              Featured Markets
            </h2>
            <Link
              href="/"
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
                        <span>
                          Vol: {new Intl.NumberFormat('en-US').format(m.totalVolume)} SOL
                        </span>
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

        {/* Markets Grid */}
        <div className="markets-grid" style={{ marginBottom: "2rem" }}>
          {markets.map((market) => (
            <Link
              key={market.id}
              href={`/market/${market.id}`}
              className="market-card"
              aria-labelledby={`market-title-${market.id}`}
              aria-describedby={`market-desc-${market.id}`}
            >
              <h3
                id={`market-title-${market.id}`}
                style={{
                  fontSize: "1.2rem",
                  marginBottom: "0.75rem",
                  color: "#ffffff",
                  minHeight: 44, // touch target for heading area
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {market.title}
              </h3>
              <p
                id={`market-desc-${market.id}`}
                style={{
                  opacity: 0.7,
                  marginBottom: "1rem",
                  fontSize: "0.95rem",
                  minHeight: 44, // ensure paragraph click area tall enough
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {market.description}
              </p>

              <div
                style={{
                  fontSize: "0.9rem",
                  opacity: 0.7,
                  minHeight: 44, // touch target for footer row
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Volume: {new Intl.NumberFormat('en-US').format(market.totalVolume)} SOL • Ends: {" "}
                {market.endDate}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
