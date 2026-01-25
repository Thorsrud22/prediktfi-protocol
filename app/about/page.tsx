import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Predikt - the AI-powered evaluation studio built on Solana.",
};

export default function AboutPage() {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl">
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white mb-12 uppercase italic leading-[0.9]">
            About Predikt <span className="text-blue-500">.</span>
          </h1>


          <div className="space-y-16">
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] italic text-blue-500 border-l-2 border-blue-500 pl-3 mb-6 inline-block">Institutional Analysis</h2>
              <h3 className="text-3xl font-black text-white uppercase italic tracking-tight mb-4">What is Predikt?</h3>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                Predikt is an AI-powered evaluation studio for <span className="text-white font-bold">Web3 protocols, AI agents, and SaaS startups</span>.
                We bridge the gap between speculative markets and fundamental analysis by creating verifiable, shareable evaluations.
              </p>
              <p className="text-slate-400 leading-relaxed">
                Whether you're launching a memecoin or a B2B platform, our neuro-symbolic AI provides the rigorous "System 2" thinking
                that founders need and smart investors require.
              </p>
            </section>

            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] italic text-blue-500 border-l-2 border-blue-500 pl-3 mb-8 inline-block">The Workflow</h2>
              <h3 className="text-3xl font-black text-white uppercase italic tracking-tight mb-8 text-center sm:text-left">Operational Mechanics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-sky-500/30 transition-colors group">
                  <div className="w-12 h-12 bg-sky-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-sky-400 font-black">01</span>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">Submit Idea</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Drop your pitch—whether it's a CA, a URL, or a napkin sketch. Our AI ingests whitepapers, competitor data, and market trends.
                  </p>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-cyan-500/30 transition-colors group">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-cyan-400 font-black">02</span>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">AI Stress-Test</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    The model simulates an investment committee debate, attacking your weaknesses before outputting a Probability Score (0-100%).
                  </p>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-green-500/30 transition-colors group">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-green-400 font-black">03</span>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">Immutable Record</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    We log the evaluation hash on Solana. This proves <strong>exactly</strong> what realized potential looked like at inception.
                  </p>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition-colors group">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-blue-400 font-black">04</span>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">Proof of Work</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Share a verified report link with VCs, angels, or your community. Demonstrate that you're building with conviction, not just hope.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] italic text-blue-500 border-l-2 border-blue-500 pl-3 mb-8 inline-block">App Value</h2>
              <h3 className="text-3xl font-black text-white uppercase italic tracking-tight mb-6 text-center sm:text-left">For Builders & Backers</h3>
              <div className="space-y-4">
                {[
                  { title: "Market Validation", desc: "Get an unbiased, instant \"No\" before you spend months building the wrong thing." },
                  { title: "Intellectual Honesty", desc: "We don't hallucinate product-market fit. If it's a wrapper, we call it a wrapper." },
                  { title: "On-Chain Reputation", desc: "Build a track record of high-scoring, high-quality shipping that lives forever." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start p-4 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="mt-1">
                      <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{item.title}</h4>
                      <p className="text-slate-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="pt-8">
              <div className="flex flex-col sm:flex-row gap-6">
                <Link
                  href="/studio"
                  className="inline-flex items-center justify-center px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] italic text-white bg-blue-600 shadow-xl shadow-blue-900/40 hover:brightness-110 active:scale-95 transition-all"
                >
                  Start Evaluation
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] italic text-slate-400 border border-white/5 bg-white/5 hover:bg-white/10 hover:text-white transition-all"
                >
                  Back Home
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
