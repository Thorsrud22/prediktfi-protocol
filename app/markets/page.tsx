import Link from "next/link";
import { markets } from "../lib/markets";

export const metadata = {
  title: "All Markets",
};

export default function MarketsPage() {
  const nf = new Intl.NumberFormat("en-US");
  const active = markets.filter((m) => m.isActive);
  const inactive = markets.filter((m) => !m.isActive);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8">
      <h1 className="sr-only">All Markets</h1>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[color:var(--text)]">Markets</h2>
        <Link
          href="/"
          className="text-sm text-[color:var(--accent)] hover:underline"
        >
          Back home
        </Link>
      </div>

      <section className="space-y-8">
        <div>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-[color:var(--muted)]">
            Active
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((m) => (
              <Link
                key={m.id}
                href={`/market/${m.id}`}
                className="market-card focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
              >
                <div className="mb-1 font-medium text-[color:var(--text)]">
                  {m.title}
                </div>
                <div className="mb-3 text-sm text-[color:var(--muted)]">{m.description}</div>
                <div className="flex items-center justify-between text-xs text-[color:var(--muted)]/90">
                  <span>Vol: {nf.format(m.totalVolume)} SOL</span>
                  <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[color:var(--surface)]/60 px-2 py-0.5 text-[color:var(--text)]/90">
                    View
                  </span>
                </div>
              </Link>
            ))}
            {active.length === 0 && (
              <div className="text-sm text-[color:var(--muted)]">No active markets</div>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-[color:var(--muted)]">
            Closed
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inactive.map((m) => (
              <Link
                key={m.id}
                href={`/market/${m.id}`}
                className="market-card focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
              >
                <div className="mb-1 font-medium text-[color:var(--text)]">
                  {m.title}
                </div>
                <div className="mb-3 text-sm text-[color:var(--muted)]">{m.description}</div>
                <div className="flex items-center justify-between text-xs text-[color:var(--muted)]/90">
                  <span>Vol: {nf.format(m.totalVolume)} SOL</span>
                  <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[color:var(--surface)]/60 px-2 py-0.5 text-[color:var(--text)]/90">
                    View
                  </span>
                </div>
              </Link>
            ))}
            {inactive.length === 0 && (
              <div className="text-sm text-[color:var(--muted)]">No closed markets</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
