import Link from "next/link";
import { SITE } from "../config/site";

export default function Hero() {
  return (
    <section
      aria-label={`${SITE.name} hero`}
  className="relative isolate overflow-hidden bg-hero"
    >
      <div className="relative z-[1] mx-auto max-w-[1100px] px-6 py-20 sm:py-24 md:py-28">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[color:var(--surface)]/70 px-3 py-1 text-xs font-medium text-[color:var(--muted)] backdrop-blur-sm">
          <span aria-hidden>●</span>
          <span>Live on Devnet</span>
        </div>

        {/* Heading */}
        <h1 className="mt-5 font-extrabold leading-tight text-[clamp(2.25rem,7vw,5.5rem)] text-[color:var(--text)]">
          Predict markets <span className="text-gradient">without limits</span>.
        </h1>

        {/* Lead */}
  <p className="mt-4 max-w-2xl text-base sm:text-lg text-[color:var(--muted)]">
          Place parimutuel bets on Solana. Real-time. On-chain.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-black shadow-token outline-none transition-colors hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/60"
          >
            Launch App
          </Link>
          <Link
            href="https://github.com/Thorsrud22/prediktfi-protocol#readme"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[color:var(--surface)]/60 px-5 py-2.5 text-sm font-semibold text-[color:var(--text)]/90 outline-none transition-colors hover:bg-[color:var(--surface)] focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
          >
            View Docs
          </Link>
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
