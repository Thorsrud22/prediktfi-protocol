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
              href="/"
              aria-label="Markets"
            >
              Markets
            </a>
            <a
              className="min-h-11 rounded px-1 py-0.5 hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40"
              href="/"
              aria-label="Docs"
            >
              Docs
            </a>
            <a
              className="min-h-11 rounded px-1 py-0.5 hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40"
              href="https://github.com/Thorsrud22/prediktfi-protocol"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="GitHub"
            >
              GitHub
            </a>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 text-xs opacity-70">
          <a
            className="min-h-11 rounded px-1 py-0.5 hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40"
            href="/legal"
          >
            Terms
          </a>
          <a
            className="min-h-11 rounded px-1 py-0.5 hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40"
            href="https://x.com"
            target="_blank"
            rel="noreferrer noopener"
          >
            Twitter
          </a>
          <a
            className="min-h-11 rounded px-1 py-0.5 hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40"
            href="https://discord.com"
            target="_blank"
            rel="noreferrer noopener"
          >
            Discord
          </a>
        </div>
      </div>
    </footer>
  );
}
