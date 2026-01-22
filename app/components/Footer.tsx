import { SITE } from "../config/site";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-slate-900/50 text-slate-500 pb-20 sm:pb-0">
      <div className="mx-auto max-w-[1100px] px-6 py-10">
        {/* Top: Navigation Links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">
          {/* Left: Legal */}
          <div className="flex items-center justify-center md:justify-start h-8 gap-8 w-full md:w-auto">
            <a href="/legal/terms" className="flex items-center h-full hover:text-white transition-colors">
              Terms
            </a>
            <a href="/legal/privacy" className="flex items-center h-full hover:text-white transition-colors">
              Privacy
            </a>
            <a href="/transparency" className="flex items-center h-full hover:text-white transition-colors">
              Transparency
            </a>
            <a href="/about" className="flex items-center h-full hover:text-white transition-colors">
              About
            </a>
          </div>

          {/* Right: Studio & Account (Only Desktop) */}
          <div className="hidden md:flex items-center h-8 gap-8 text-slate-300 opacity-80">
            <a
              href="/studio"
              className="flex items-center h-full gap-2 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Studio
            </a>

            <a
              href="/account"
              className="flex items-center h-full gap-2 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Account
            </a>
          </div>
        </div>

        {/* Bottom: Copyright & Social */}
        <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between h-6">
          <div className="flex items-center text-xs font-medium h-full opacity-30">
            © 2026 {SITE.name}
          </div>

          <div className="flex items-center h-full">
            <a
              href="https://x.com/PrediktFi"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-slate-400 hover:text-white transition-colors h-full"
              aria-label="X"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
