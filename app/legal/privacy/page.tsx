import { Metadata } from 'next';

// Merged metadata export
export const metadata: Metadata = {
  title: 'Privacy Policy • Predikt',
  description: 'Privacy policy for Predikt evaluation platform.',
  alternates: {
    canonical: '/legal/privacy',
  },
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
                1. Introduction
              </h2>
              <p className="text-slate-400 leading-relaxed">
                This Privacy Policy describes how Predikt ("we", "us", "our") collects, uses, and protects your personal data when you use our platform. We are committed to protecting your privacy in accordance with the General Data Protection Regulation (GDPR) and other applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                2. Data Controller
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Predikt is the data controller for the personal data we process. For any questions regarding your privacy, you can contact us at:
              </p>
              <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-slate-300 font-medium">Email: prediktfun@gmail.com</p>
                <p className="text-slate-300 font-medium">Website: prediktfi.xyz</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                3. Purpose and Legal Basis
              </h2>
              <p className="text-slate-400 mb-4 leading-relaxed">
                We process personal data for the following purposes:
              </p>
              <ul className="space-y-4 text-slate-400">
                <li className="flex flex-col bg-white/5 rounded-xl p-4 border border-white/5">
                  <strong className="text-white mb-1">Service Delivery:</strong>
                  <span>Storage of plan status (Free/Pro) and temporary session data necessary for the platform to function. Legal basis: Performance of a contract.</span>
                </li>
                <li className="flex flex-col bg-white/5 rounded-xl p-4 border border-white/5">
                  <strong className="text-white mb-1">Improvement and Analysis:</strong>
                  <span>Anonymized usage statistics to understand how the platform is used and to improve the user experience. Legal basis: Legitimate interest.</span>
                </li>
                <li className="flex flex-col bg-white/5 rounded-xl p-4 border border-white/5">
                  <strong className="text-white mb-1">Security:</strong>
                  <span>Server logs to detect and prevent abuse or technical errors. Legal basis: Legitimate interest.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                4. Data We Collect
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-400">
                <li className="flex items-center gap-2 bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                  IP Address (in server logs)
                </li>
                <li className="flex items-center gap-2 bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                  Browser type and device info
                </li>
                <li className="flex items-center gap-2 bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                  Usage patterns (anonymized)
                </li>
                <li className="flex items-center gap-2 bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                  Subscription status
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                5. Your Rights
              </h2>
              <p className="text-slate-400 mb-4 leading-relaxed">
                You have the following rights regarding your personal data:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: 'Access', desc: 'The right to know what data we hold about you.' },
                  { title: 'Rectification', desc: 'The right to correct inaccurate data.' },
                  { title: 'Erasure', desc: 'The right to be forgotten.' },
                  { title: 'Restriction', desc: 'The right to restrict processing.' },
                ].map((item) => (
                  <div key={item.title} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <h3 className="text-white font-bold mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-slate-400 mt-4 leading-relaxed">
                To exercise your rights, please contact us at prediktfun@gmail.com. You also have the right to lodge a complaint with a supervisory authority if you believe our processing violates data protection rules.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                6. Data Processors and Transfers
              </h2>
              <p className="text-slate-400 leading-relaxed">
                We use third-party providers (data processors) for certain tasks:
              </p>
              <ul className="mt-4 space-y-2 text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 mt-1.5">•</span>
                  <span><strong>Vercel Inc.:</strong> Platform hosting and infrastructure.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 mt-1.5">•</span>
                  <span><strong>Analytics Partners:</strong> We use tools that anonymize data before storage to protect your privacy.</span>
                </li>
              </ul>
              <p className="text-slate-400 mt-4 leading-relaxed">
                For transfers of data outside the EU/EEA, we ensure that appropriate safeguards are in place, such as Standard Contractual Clauses (SCCs).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                7. Retention and Deletion
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Personal data is stored no longer than necessary for the purposes for which it was collected. Server logs are typically deleted automatically after 30 days. Data stored locally in your browser (cookies, localStorage) remains until you delete it or it expires.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                8. Changes
              </h2>
              <p className="text-slate-400 leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices or for legal reasons. Significant changes will be notified on the platform.
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
