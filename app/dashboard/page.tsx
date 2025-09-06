'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import PredictionForm from '../components/PredictionForm';
import PredictionList from '../components/PredictionList';

// Dynamically import wallet provider to avoid SSR issues
const WalletContextProvider = dynamic(
  () => import('../components/WalletContextProvider'),
  { ssr: false }
);

export default function PredictionDashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePredictionCreated = () => {
    // Trigger refresh of prediction list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <WalletContextProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  🔮 Predikt Proof Agent
                </h1>
                <span className="ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  V1.0
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Social Proof Prediction Platform
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Prediction Form - Left Column */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <PredictionForm onPredictionCreated={handlePredictionCreated} />
                
                {/* Info Panel */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">
                    📋 How it works
                  </h3>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Write your prediction in natural language</li>
                    <li>• AI normalizes it into structured format</li>
                    <li>• Optionally commit to Solana blockchain</li>
                    <li>• Track outcomes and build reputation</li>
                  </ul>
                </div>

                {/* Feature Status */}
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="text-xs font-semibold text-yellow-800 mb-1">
                    🚧 Development Status
                  </h4>
                  <div className="text-xs text-yellow-700 space-y-1">
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      Prediction Creation
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      AI Normalization
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                      Blockchain Commitment
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                      Outcome Resolution
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                      Reputation Scoring
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Prediction List - Right Columns */}
            <div className="lg:col-span-2">
              <PredictionList refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                © 2024 Predikt Protocol. Built with Next.js, Solana & TypeScript.
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Phase 1A: Core Functionality</span>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-gray-700"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </WalletContextProvider>
  );
}
