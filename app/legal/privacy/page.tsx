import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy • Predikt',
  description: 'Privacy policy for Predikt evaluation platform.',
};

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen">
      <div className="container relative z-10 mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl">
          <h1 className="text-4xl font-black tracking-tight text-white mb-8 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Privacy Policy
          </h1>

          <div className="space-y-12">
            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                Data Collection
              </h2>
              <p className="text-slate-400 mb-4 leading-relaxed">
                We collect minimal data necessary for platform functionality:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-400">
                <li className="flex items-center gap-2 bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                  Usage analytics (anonymized)
                </li>
                <li className="flex items-center gap-2 bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                  Plan status stored in cookies
                </li>
                <li className="flex items-center gap-2 bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                  Temporary local storage
                </li>
                <li className="flex items-center gap-2 bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                  Standard server logs
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                Cookies
              </h2>
              <p className="text-slate-400 leading-relaxed">
                We use essential cookies to remember your plan status (Free/Pro). These are
                necessary for the platform to function correctly. No third-party tracking cookies are used.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                Analytics
              </h2>
              <p className="text-slate-400 leading-relaxed overflow-hidden">
                We collect anonymous usage analytics to improve the platform. This includes visits and performance metrics, but contains no personally identifiable information or cross-site tracking.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                Data Retention
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Browser data (localStorage, cookies) persists until you clear it. Server logs
                are retained for 30 days for debugging purposes, then automatically deleted.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                Updates
              </h2>
              <p className="text-slate-400 leading-relaxed">
                This privacy policy may be updated as we add features. We'll post significant
                changes on the platform.
              </p>
            </section>
          </div>

          <div className="mt-16 pt-8 border-t border-white/5 text-center">
            <a href="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Predikt
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
