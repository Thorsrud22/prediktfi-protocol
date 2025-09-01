import Link from "next/link";
import { SITE } from "../config/site";

export default function Hero() {
  return (
    <section
      aria-label={`${SITE.name} hero`}
      className="relative isolate overflow-hidden bg-hero noise"
    >
      <div className="relative z-[1] mx-auto max-w-[1100px] px-6 py-20 sm:py-24 md:py-28">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[color:var(--surface)]/70 px-3 py-1 text-xs font-medium text-[color:var(--muted)] backdrop-blur-sm">
          <span aria-hidden>●</span>
          <span>Live on Devnet</span>
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
