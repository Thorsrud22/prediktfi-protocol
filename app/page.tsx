'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const searchParams = useSearchParams();
  const [showAuthMessage, setShowAuthMessage] = useState(false);

  useEffect(() => {
    if (searchParams?.get('auth') === 'required') {
      setShowAuthMessage(true);
      // Auto-hide message after 5 seconds
      const timer = setTimeout(() => setShowAuthMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Auth Message */}
      {showAuthMessage && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Authentication required to access the dashboard. Please connect your wallet or sign in.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setShowAuthMessage(false)}
                className="text-yellow-400 hover:text-yellow-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-gradient-to-br from-blue-50 to-indigo-100 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">🔮 Predikt</span>{' '}
                  <span className="block text-indigo-600 xl:inline">Proof Agent</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Social proof prediction platform with blockchain verification. Make predictions, build reputation, and get rewarded for accuracy.
                </p>
                
                {/* Features */}
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="flex items-center">
                    <span className="flex-shrink-0 h-6 w-6 text-green-500">✅</span>
                    <span className="ml-3 text-sm text-gray-600">AI-powered prediction normalization</span>
                  </div>
                  <div className="flex items-center">
                    <span className="flex-shrink-0 h-6 w-6 text-green-500">✅</span>
                    <span className="ml-3 text-sm text-gray-600">Solana blockchain verification</span>
                  </div>
                  <div className="flex items-center">
                    <span className="flex-shrink-0 h-6 w-6 text-green-500">✅</span>
                    <span className="ml-3 text-sm text-gray-600">Reputation-based scoring</span>
                  </div>
                  <div className="flex items-center">
                    <span className="flex-shrink-0 h-6 w-6 text-green-500">✅</span>
                    <span className="ml-3 text-sm text-gray-600">Shareable prediction receipts</span>
                  </div>
                </div>

                <div className="mt-8 sm:mt-10 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      href="/dashboard"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                    >
                      Start Predicting
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <a
                      href="https://github.com/Thorsrud22/prediktfi-protocol"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10"
                    >
                      View Source
                    </a>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        
        {/* Right side image/illustration */}
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
            <div className="text-white text-6xl opacity-20">
              🔮📊⛓️
            </div>
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              How Predikt Works
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Advanced prediction platform combining AI normalization with blockchain verification
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    🤖
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">AI Normalization</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Natural language predictions are automatically normalized into structured, verifiable formats
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    ⛓️
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Blockchain Proof</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Commit predictions to Solana blockchain for immutable, verifiable records
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    📊
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Reputation Scoring</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Build credibility through accurate predictions and earn reputation points
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    📄
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Shareable Receipts</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Generate beautiful SVG receipts to share your predictions on social media
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to start predicting?</span>
            <span className="block">Build your reputation today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-indigo-200">
            Join the future of verifiable predictions and social proof
          </p>
          <Link
            href="/dashboard"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 sm:w-auto"
          >
            Get Started Now
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <a href="https://github.com/Thorsrud22/prediktfi-protocol" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">GitHub</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">
              &copy; 2024 Predikt Protocol. Built with Next.js, Solana & TypeScript.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
