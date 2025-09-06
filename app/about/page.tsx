import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Predikt - the AI-first prediction studio built on Solana.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all duration-200 hover:scale-105">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-gray-900 leading-tight">Predikt</span>
                <span className="text-xs text-gray-500 font-medium tracking-wider uppercase">AI Studio</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">About Predikt</h1>
          
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What is Predikt?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Predikt is an AI-first prediction studio that transforms how we think about forecasting and insights. 
                Instead of traditional betting or speculation, we focus on creating verifiable, shareable AI-powered 
                predictions that are permanently logged on the Solana blockchain.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Our platform bridges the gap between AI prediction capabilities and blockchain verification, 
                creating a new category of transparent, accountable forecasting tools.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h3 className="font-medium text-gray-900 mb-2">1. Ask → AI Analysis</h3>
                  <p className="text-gray-700">
                    Start with any yes/no question about the future. Our AI analyzes the question using 
                    multiple data sources and reasoning frameworks to generate a probability estimate.
                  </p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-medium text-gray-900 mb-2">2. AI → Probability + Rationale</h3>
                  <p className="text-gray-700">
                    Get a percentage probability (0-100%) along with detailed reasoning, key factors, 
                    and the AI model's confidence assessment for your prediction.
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-medium text-gray-900 mb-2">3. Log On-Chain → Verification</h3>
                  <p className="text-gray-700">
                    Stamp your insight permanently on Solana with a cryptographic signature, 
                    creating an immutable record with timestamp and verification.
                  </p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900 mb-2">4. Share/Verify → Community</h3>
                  <p className="text-gray-700">
                    Share your verified predictions with permanent links that anyone can verify 
                    on-chain, building a community of transparent forecasting.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Why On-Chain Receipts Matter</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3"></span>
                  <div>
                    <strong>Tamper-Proof:</strong> Once logged, predictions cannot be altered or deleted, 
                    ensuring complete transparency in forecasting accuracy.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3"></span>
                  <div>
                    <strong>Timestamped:</strong> Blockchain timestamps prove exactly when a prediction 
                    was made, eliminating hindsight bias and retroactive editing.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></span>
                  <div>
                    <strong>Verifiable:</strong> Anyone can independently verify the authenticity and 
                    timing of predictions using blockchain explorers.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></span>
                  <div>
                    <strong>Shareable:</strong> Permanent public URLs allow predictions to be shared 
                    across social media with built-in verification.
                  </div>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Get Started</h2>
              <p className="text-gray-700 mb-6">
                Ready to create your first AI-backed prediction? Our studio makes it easy to go from 
                question to verified insight in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/studio"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  Open Studio
                </Link>
                <Link
                  href="/feed"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  View Community Feed
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
