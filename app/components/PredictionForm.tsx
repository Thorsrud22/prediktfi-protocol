'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface PredictionFormProps {
  onPredictionCreated?: (prediction: any) => void;
}

interface PredictionResult {
  id: string;
  statement: string;
  probability: number;
  deadline: string;
  topic: string;
  hash: string;
  status: string;
  readyToCommit: boolean;
}

export default function PredictionForm({ onPredictionCreated }: PredictionFormProps) {
  const { connected, publicKey } = useWallet();
  const [rawText, setRawText] = useState('');
  const [commitToChain, setCommitToChain] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rawText,
          commitToChain,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create prediction');
      }

      setResult(data);
      setRawText('');
      onPredictionCreated?.(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!result || !publicKey) return;

    setLoading(true);
    try {
      const response = await fetch('/api/prediction/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          predictionId: result.id,
          walletPublicKey: publicKey.toString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to prepare commitment');
      }

      // In a real implementation, you would create and send the Solana transaction here
      alert('Commitment prepared! Transaction would be created and signed here.');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commitment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Prediction</h2>
      
      {/* Wallet Connection */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Wallet Connection</span>
          <WalletMultiButton />
        </div>
        {connected && publicKey && (
          <p className="text-xs text-gray-500">
            Connected: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
          </p>
        )}
      </div>

      {/* Prediction Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="rawText" className="block text-sm font-medium text-gray-700 mb-2">
            Prediction Statement
          </label>
          <textarea
            id="rawText"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="e.g., BTC will be above $80000 by end of year"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            required
            minLength={10}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {rawText.length}/500 characters
          </p>
        </div>

        <div className="flex items-center">
          <input
            id="commitToChain"
            type="checkbox"
            checked={commitToChain}
            onChange={(e) => setCommitToChain(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={!connected}
          />
          <label htmlFor="commitToChain" className="ml-2 text-sm text-gray-700">
            Prepare for blockchain commitment {!connected && '(wallet required)'}
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || rawText.length < 10}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Prediction'}
        </button>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Prediction Created!</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Statement:</strong> {result.statement}</p>
            <p><strong>Probability:</strong> {(result.probability * 100).toFixed(0)}%</p>
            <p><strong>Deadline:</strong> {new Date(result.deadline).toLocaleDateString()}</p>
            <p><strong>Topic:</strong> {result.topic}</p>
            <p><strong>Status:</strong> {result.status}</p>
            <p><strong>Hash:</strong> <code className="text-xs">{result.hash}</code></p>
          </div>
          
          {result.readyToCommit && connected && (
            <button
              onClick={handleCommit}
              disabled={loading}
              className="mt-3 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Preparing...' : 'Commit to Blockchain'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
