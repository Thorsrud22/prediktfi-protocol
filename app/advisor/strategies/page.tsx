// app/advisor/strategies/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { safeParse } from '../../lib/safe-fetch';
// import { isFeatureEnabled } from '../../lib/flags';

interface Strategy {
  id: string;
  walletId: string;
  name: string;
  kind: string;
  configJson: any;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Wallet {
  id: string;
  address: string;
  chain: string;
}

export default function StrategiesPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generatedStrategy, setGeneratedStrategy] = useState<any>(null);
  const [newStrategy, setNewStrategy] = useState({
    name: '',
    kind: 'risk',
    enabled: true
  });

  // Check if advisor feature is enabled
  // if (!isFeatureEnabled('ADVISOR')) {
  //   return (
  //     <div className="min-h-screen bg-[color:var(--background)] flex items-center justify-center">
  //       <div className="text-center">
  //         <h1 className="text-2xl font-bold text-[color:var(--text)] mb-4">
  //           Advisor Feature Not Available
  //         </h1>
  //         <p className="text-[color:var(--muted)]">
  //           The advisor feature is currently disabled. Please contact support.
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  useEffect(() => {
    loadWallets();
  }, []);

  useEffect(() => {
    if (selectedWallet) {
      loadStrategies();
    }
  }, [selectedWallet]);

  const loadWallets = async () => {
    try {
      // In a real app, this would fetch from an API
      const connectedWallets = localStorage.getItem('predikt:connectedWallets');
      const parsed = safeParse<any[]>(connectedWallets);
      if (parsed) {
        setWallets(parsed);
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  };

  const loadStrategies = async () => {
    if (!selectedWallet) return;

    setLoading(true);
    try {
      // Mock data for now - would be replaced with actual API call
      const mockStrategies: Strategy[] = [
        {
          id: '1',
          walletId: selectedWallet,
          name: 'Conservative Risk Management',
          kind: 'risk',
          configJson: {
            maxConcentration: 20,
            minStablecoinAllocation: 10,
            rebalanceThreshold: 5
          },
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setStrategies(mockStrategies);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load strategies');
    } finally {
      setLoading(false);
    }
  };

  const generateStrategyFromPrompt = async () => {
    if (!prompt.trim()) {
      setError('Please enter a strategy prompt');
      return;
    }

    setLoading(true);
    try {
      // Simulate AI strategy generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const strategy = {
        name: `Strategy: ${prompt.slice(0, 30)}...`,
        kind: 'custom',
        configJson: {
          description: `Generated from prompt: "${prompt}"`,
          rules: [
            {
              type: 'price_monitor',
              threshold: 10,
              action: 'alert'
            },
            {
              type: 'concentration_check',
              threshold: 30,
              action: 'warning'
            }
          ],
          triggers: ['portfolio_change', 'price_movement'],
          notifications: ['inapp', 'email']
        }
      };
      
      setGeneratedStrategy(strategy);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate strategy');
    } finally {
      setLoading(false);
    }
  };

  const saveStrategy = async () => {
    if (!selectedWallet || !generatedStrategy || !newStrategy.name.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Mock save - would be replaced with actual API call
      const strategy: Strategy = {
        id: Date.now().toString(),
        walletId: selectedWallet,
        name: newStrategy.name,
        kind: generatedStrategy.kind,
        configJson: generatedStrategy.configJson,
        enabled: newStrategy.enabled,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setStrategies([...strategies, strategy]);
      setGeneratedStrategy(null);
      setNewStrategy({ name: '', kind: 'risk', enabled: true });
      setPrompt('');
      setShowCreateForm(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save strategy');
    } finally {
      setLoading(false);
    }
  };

  const toggleStrategy = async (strategyId: string, enabled: boolean) => {
    try {
      // Mock update - would be replaced with actual API call
      setStrategies(strategies.map(s => 
        s.id === strategyId ? { ...s, enabled } : s
      ));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update strategy');
    }
  };

  const deleteStrategy = async (strategyId: string) => {
    if (!confirm('Are you sure you want to delete this strategy?')) {
      return;
    }

    try {
      setStrategies(strategies.filter(s => s.id !== strategyId));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete strategy');
    }
  };

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case 'risk': return '⚠️';
      case 'rebalance': return '⚖️';
      case 'momentum': return '📈';
      case 'custom': return '🎯';
      default: return '📊';
    }
  };

  const getKindDescription = (kind: string) => {
    switch (kind) {
      case 'risk': return 'Risk Management';
      case 'rebalance': return 'Portfolio Rebalancing';
      case 'momentum': return 'Momentum Trading';
      case 'custom': return 'Custom Strategy';
      default: return 'Unknown Strategy';
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[color:var(--text)] mb-2">
                  Strategy Studio
                </h1>
                <p className="text-[color:var(--muted)]">
                  Generate custom monitoring strategies from natural language prompts
                </p>
              </div>
              <a
                href="/advisor"
                className="text-sm text-[color:var(--muted)] hover:text-[color:var(--text)]"
              >
                ← Back to Advisor
              </a>
            </div>
          </div>

          {/* Wallet Selection */}
          <div className="bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] p-6 mb-8">
            <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">
              Select Wallet
            </h2>
            {wallets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[color:var(--muted)] mb-4">
                  No wallets connected. Please connect a wallet first.
                </p>
                <a
                  href="/advisor"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Connect Wallet
                </a>
              </div>
            ) : (
              <select
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
                className="w-full max-w-md px-4 py-3 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a wallet...</option>
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedWallet && (
            <>
              {/* Strategy Generator */}
              <div className="bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-[color:var(--text)]">
                    Generate Strategy
                  </h2>
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    {showCreateForm ? 'Cancel' : 'New Strategy'}
                  </button>
                </div>

                {showCreateForm && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[color:var(--text)] mb-2">
                        Strategy Prompt
                      </label>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe your strategy in natural language...&#10;&#10;Examples:&#10;- Monitor my portfolio and alert me if any single asset exceeds 30%&#10;- Watch for Bitcoin drops of more than 10% in 24 hours&#10;- Track stablecoin depegging and warn me if USDC drops below $0.99&#10;- Alert me when my portfolio concentration becomes too high"
                        rows={6}
                        className="w-full px-4 py-3 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={generateStrategyFromPrompt}
                        disabled={loading || !prompt.trim()}
                        className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Generating...' : 'Generate Strategy'}
                      </button>
                    </div>

                    {error && (
                      <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                        {error}
                      </div>
                    )}
                  </div>
                )}

                {/* Generated Strategy Preview */}
                {generatedStrategy && (
                  <div className="mt-6 p-4 bg-[color:var(--background)] rounded-lg border border-[color:var(--border)]">
                    <h3 className="text-lg font-medium text-[color:var(--text)] mb-3">
                      Generated Strategy Preview
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <strong>Name:</strong> {generatedStrategy.name}
                      </div>
                      <div>
                        <strong>Type:</strong> {getKindDescription(generatedStrategy.kind)}
                      </div>
                      <div>
                        <strong>Description:</strong> {generatedStrategy.configJson.description}
                      </div>
                      <div>
                        <strong>Rules:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          {generatedStrategy.configJson.rules.map((rule: any, index: number) => (
                            <li key={index} className="text-sm text-[color:var(--muted)]">
                              {rule.type}: {rule.action} when {rule.threshold}%
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-[color:var(--text)] mb-2">
                          Strategy Name
                        </label>
                        <input
                          type="text"
                          value={newStrategy.name}
                          onChange={(e) => setNewStrategy({ ...newStrategy, name: e.target.value })}
                          placeholder="Enter a name for this strategy..."
                          className="w-full px-4 py-3 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="enabled"
                          checked={newStrategy.enabled}
                          onChange={(e) => setNewStrategy({ ...newStrategy, enabled: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor="enabled" className="text-sm text-[color:var(--text)]">
                          Enable strategy immediately
                        </label>
                      </div>
                      <button
                        onClick={saveStrategy}
                        disabled={!newStrategy.name.trim()}
                        className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save Strategy
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Existing Strategies */}
              <div className="bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] p-6">
                <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">
                  Active Strategies
                </h2>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-[color:var(--muted)]">Loading strategies...</div>
                  </div>
                ) : strategies.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-[color:var(--muted)] mb-4">
                      No strategies created yet.
                    </div>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                      Create Your First Strategy
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {strategies.map((strategy) => (
                      <div key={strategy.id} className="border border-[color:var(--border)] rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-lg">{getKindIcon(strategy.kind)}</span>
                              <h3 className="font-medium text-[color:var(--text)]">{strategy.name}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                strategy.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {strategy.enabled ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </div>
                            <div className="text-sm text-[color:var(--muted)]">
                              {getKindDescription(strategy.kind)} • Created {new Date(strategy.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleStrategy(strategy.id, !strategy.enabled)}
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                strategy.enabled 
                                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                  : 'bg-green-100 text-green-600 hover:bg-green-200'
                              }`}
                            >
                              {strategy.enabled ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => deleteStrategy(strategy.id)}
                              className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs font-medium hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Strategy Configuration */}
                        <div className="mt-3 pt-3 border-t border-[color:var(--border)]">
                          <div className="text-sm font-medium text-[color:var(--text)] mb-2">
                            Configuration
                          </div>
                          <div className="text-sm text-[color:var(--muted)] bg-[color:var(--background)] p-3 rounded">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(strategy.configJson, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
