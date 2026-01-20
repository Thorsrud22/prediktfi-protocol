import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service • Predikt',
  description: 'Terms of service for Predikt evaluation platform.',
};

export default function TermsPage() {
  return (
    <div className="relative min-h-screen">
      <div className="container relative z-10 mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl">
          <h1 className="text-4xl font-black tracking-tight text-white mb-8 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Terms of Service
          </h1>

          <div className="space-y-10">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
              <p className="text-blue-400 font-bold text-lg flex items-center gap-2">
                <span className="text-2xl">⚠️</span> Predikt is a tool. You make the decision. No guarantees.
              </p>
              <p className="text-blue-300/80 font-medium mt-2 leading-relaxed">
                Beta Platform - This is a testing environment for demonstration purposes.
              </p>
            </div>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-sky-500 rounded-full" />
                1. Platform Purpose
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Predikt is an AI evaluation platform currently in beta testing. This platform is provided
                for demonstration and educational purposes. Users participate at their own discretion.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-sky-500 rounded-full" />
                2. Beta Status
              </h2>
              <p className="text-slate-400 leading-relaxed">
                This platform is in active development. Features may change, and temporary downtime
                may occur. We make no guarantees about service availability or data persistence.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-sky-500 rounded-full" />
                3. No Financial Advice
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Predictions and insights provided by this platform are for informational purposes only
                and do not constitute financial, investment, or professional advice. Users should conduct
                their own research before making any decisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-sky-500 rounded-full" />
                4. Acceptable Use
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Users must not attempt to exploit, abuse, or disrupt the platform. Automated access
                may be rate-limited. We reserve the right to suspend access for violations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-sky-500 rounded-full" />
                5. Updates
              </h2>
              <p className="text-slate-400 leading-relaxed">
                These terms may be updated as the platform evolves. Continued use constitutes
                acceptance of any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-sky-500 rounded-full" />
                6. Contact
              </h2>
              <p className="text-slate-400 leading-relaxed">
                For questions about these terms, please contact us via GitHub issues on our repository.
              </p>
            </section>
          </div>

          <div className="mt-16 pt-8 border-t border-white/5 text-center">
            <a href="/" className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 font-semibold transition-colors">
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
