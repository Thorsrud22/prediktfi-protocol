'use client';

import { useState } from 'react';
import ProgressSteps from './components/ProgressSteps';
import ResultTabs from './components/ResultTabs';

type Step = 'idle' | 'collecting' | 'analyzing' | 'complete';

export default function StudioPage() {
  const [assetId, setAssetId] = useState('bitcoin');
  const [vsCurrency, setVsCurrency] = useState('usd');
  const [horizon, setHorizon] = useState<'24h' | '7d' | '30d'>('24h');
  const [step, setStep] = useState<Step>('idle');

  const handleRun = async () => {
    setStep('collecting');

    // Simulate progress without actual fetch
    setTimeout(() => setStep('analyzing'), 1000);
    setTimeout(() => setStep('complete'), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Predikt Studio</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="assetId" className="block text-sm font-medium text-gray-700 mb-2">
              Asset ID
            </label>
            <input
              id="assetId"
              type="text"
              value={assetId}
              onChange={e => setAssetId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="vsCurrency" className="block text-sm font-medium text-gray-700 mb-2">
              vs Currency
            </label>
            <input
              id="vsCurrency"
              type="text"
              value={vsCurrency}
              onChange={e => setVsCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="horizon" className="block text-sm font-medium text-gray-700 mb-2">
              Horizon
            </label>
            <select
              id="horizon"
              value={horizon}
              onChange={e => setHorizon(e.target.value as '24h' | '7d' | '30d')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="24h">24h</option>
              <option value="7d">7d</option>
              <option value="30d">30d</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={step !== 'idle' && step !== 'complete'}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {step === 'idle' || step === 'complete' ? 'Run Analysis' : 'Running...'}
        </button>
      </div>

      {step !== 'idle' && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <ProgressSteps step={step} />
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <ResultTabs hasData={step === 'complete'} />
      </div>
    </div>
  );
}
