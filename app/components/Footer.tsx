import { SITE } from "../config/site";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[color:var(--bg)] text-[color:var(--muted)]">
      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="text-sm">© 2025 {SITE.name}</div>
          <div className="flex items-center gap-4 text-xs">
            <a
              className="min-h-11 rounded px-1 py-0.5 hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40"
              href="/studio"
              aria-label="AI Studio"
            >
              AI Studio
            </a>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 text-xs opacity-70">
          <a
            className="min-h-11 rounded px-1 py-0.5 hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40"
            href="/legal/terms"
            rel="nofollow"
          >
            Terms
          </a>
          <a
            className="min-h-11 rounded px-1 py-0.5 hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40"
            href="/legal/privacy"
            rel="nofollow"
          >
            Privacy
          </a>
          <a
            className="min-h-11 rounded px-1 py-0.5 hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40"
            href="/legal/refund"
            rel="nofollow"
          >
            Refund
          </a>
          <a
            className="min-h-11 rounded px-1 py-0.5 hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40"
            href="/about"
          >
            About
          </a>
        </div>
      </div>
    </footer>
  );
}
