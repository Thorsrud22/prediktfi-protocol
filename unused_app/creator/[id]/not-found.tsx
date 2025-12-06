'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/creator/${searchQuery.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-4xl font-bold text-white mb-2">Creator Not Found</h1>
          <p className="text-slate-400 text-lg">
            The creator profile you're looking for doesn't exist or has been removed.
          </p>
        </div>

        {/* Search Input */}
        <div className="bg-slate-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Find a creator</h2>
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter creator handle..."
              className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              Search
            </button>
          </form>
        </div>

        {/* Suggestions */}
        <div className="bg-slate-800 rounded-xl p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold text-white mb-4">What you can do:</h2>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>Search for a creator using the form above</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>Browse our leaderboard to find top creators</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>Create your own profile by making predictions</span>
            </li>
          </ul>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/leaderboard"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            View Leaderboard
          </Link>
          <Link
            href="/studio"
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            Create Predictions
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            Go Home
          </Link>
        </div>

        {/* Help text */}
        <div className="mt-8 text-sm text-slate-500">
          <p>
            Need help? Contact us or check our{' '}
            <Link href="/docs" className="text-blue-400 hover:text-blue-300 underline">
              documentation
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
