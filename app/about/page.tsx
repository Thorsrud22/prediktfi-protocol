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
          Broadway

          <div className="space-y-16">
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] italic text-blue-500 border-l-2 border-blue-500 pl-3 mb-6 inline-block">Institutional Analysis</h2>
              <h3 className="text-3xl font-black text-white uppercase italic tracking-tight mb-4">What is Predikt?</h3>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                Predikt is an AI-powered evaluation studio that transforms how we think about analyzing ideas and insights.
                Instead of traditional speculation, we focus on creating verifiable, shareable AI-powered
                evaluations that are permanently logged on the Solana blockchain.
              </p>
              <p className="text-slate-400 leading-relaxed">
                Our platform bridges the gap between AI prediction capabilities and blockchain verification,
                creating a new category of transparent, accountable forecasting tools.
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
                  <h3 className="text-white font-bold text-xl mb-2">Ask → AI Analysis</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Start with any yes/no question. Our AI analyzes multiple data sources and reasoning frameworks to generate a probability estimate.
                  </p>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-purple-500/30 transition-colors group">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-purple-400 font-black">02</span>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">AI → Evaluation</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Get a percentage probability (0-100%) along with detailed reasoning and the AI model's confidence assessment.
                  </p>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-green-500/30 transition-colors group">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-green-400 font-black">03</span>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">Log On-Chain</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Stamp your insight permanently on Solana with a cryptographic signature, creating an immutable record.
                  </p>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition-colors group">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-blue-400 font-black">04</span>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">Share & Verify</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Share verified links that anyone can verify on-chain, building a reputation for transparent forecasting.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] italic text-blue-500 border-l-2 border-blue-500 pl-3 mb-8 inline-block">Value Propositions</h2>
              <h3 className="text-3xl font-black text-white uppercase italic tracking-tight mb-6 text-center sm:text-left">Strategic Edge</h3>
              <div className="space-y-4">
                {[
                  { title: "Tamper-Proof", desc: "Evaluations cannot be altered or deleted once logged." },
                  { title: "Timestamped", desc: "Blockchain proof of exactly when an evaluation was made." },
                  { title: "Verifiable", desc: "Independent verification of authenticity using blockchain explorers." }
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
