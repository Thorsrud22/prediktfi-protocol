import { SITE } from "../config/site";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[color:var(--bg)] text-[color:var(--muted)]">
      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="text-sm">© 2025 {SITE.name}</div>
          <div className="flex items-center gap-4 text-xs">
            {/* Links section disabled for Private Alpha Landing
            <a ... >AI Studio</a>
            <a ... >Feed</a>
            <a ... >GitHub</a>
            */}
          </div>
        </div>
        {/* Secondary links disabled
        <div className="mt-4 flex items-center gap-3 text-xs opacity-70">
          <a ... >Terms</a>
          <a ... >Privacy</a>
          <a ... >Refund</a>
          <a ... >About</a>
        </div>
        */}
      </div>
    </footer>
  );
}
