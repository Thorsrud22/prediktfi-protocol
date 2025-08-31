import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color:var(--bg-soft)]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="font-semibold tracking-tight text-[color:var(--text)]"
        >
          PrediktFi
        </Link>
        <div className="hidden items-center gap-6 sm:flex">
          <Link
            href="/"
            className="text-sm text-[color:var(--muted)] hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
          >
            Markets
          </Link>
          <Link
            href="/"
            className="text-sm text-[color:var(--muted)] hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
          >
            Docs
          </Link>
          <a
            href="https://github.com/Thorsrud22/prediktfi-protocol"
            target="_blank"
            rel="noreferrer noopener"
            className="text-sm text-[color:var(--muted)] hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
          >
            GitHub
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-black shadow-token focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/60"
          >
            Launch App
          </Link>
        </div>
      </div>
    </nav>
  );
}
