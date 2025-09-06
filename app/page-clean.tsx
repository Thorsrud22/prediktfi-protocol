"use client";

import Link from "next/link";

export default function CleanPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-5xl font-light mb-6">Clean Design</h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            A minimal, clean layout showcasing PrediktFi's core functionality 
            without visual distractions.
          </p>
          <div className="space-y-4">
            <Link 
              href="/" 
              className="inline-block border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-8 rounded-sm transition-colors"
            >
              Back to Home
            </Link>
            <br />
            <Link 
              href="/studio" 
              className="inline-block bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-8 rounded-sm transition-colors"
            >
              Open Studio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
