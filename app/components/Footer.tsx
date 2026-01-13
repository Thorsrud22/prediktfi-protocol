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
              href="https://x.com/PrediktFi"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="PrediktFi on X"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
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
