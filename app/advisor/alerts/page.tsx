// app/advisor/alerts/page.tsx
'use client';

import { useState, useEffect } from 'react';
// import { isFeatureEnabled } from '../../lib/flags';

interface AlertRule {
  id: string;
  walletId: string;
  name: string;
  ruleJson: any;
  channel: 'inapp' | 'email' | 'webhook';
  target?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  recentEvents: Array<{
    id: string;
    firedAt: string;
    delivered: boolean;
    payload: any;
  }>;
}

interface Wallet {
  id: string;
  address: string;
  chain: string;
}

export default function AlertsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [allAlertsPaused, setAllAlertsPaused] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    channel: 'inapp' as 'inapp' | 'email' | 'webhook',
    target: '',
    ruleType: 'price_drop',
    threshold: 10,
    timeWindow: '1h'
  });

  // Check if alerts feature is enabled
  // if (!isFeatureEnabled('ALERTS')) {
  //   return (
  //     <div className="min-h-screen bg-[color:var(--background)] flex items-center justify-center">
  //       <div className="text-center">
  //         <h1 className="text-2xl font-bold text-[color:var(--text)] mb-4">
  //           Alerts Feature Not Available
  //         </h1>
  //         <p className="text-[color:var(--muted)]">
  //           The alerts feature is currently disabled. Please contact support.
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
      loadRules();
    }
  }, [selectedWallet]);

  const loadWallets = async () => {
    try {
      // In a real app, this would fetch from an API
      // For now, we'll use localStorage to get connected wallets
      const connectedWallets = localStorage.getItem('predikt:connectedWallets');
      if (connectedWallets) {
        setWallets(JSON.parse(connectedWallets));
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  };

  const loadRules = async () => {
    if (!selectedWallet) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/advisor/alerts/rules?walletId=${selectedWallet}`);
      if (!response.ok) {
        throw new Error('Failed to load alert rules');
      }

      const data = await response.json();
      setRules(data.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  const createRule = async () => {
    if (!selectedWallet || !newRule.name.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const ruleJson = {
        type: newRule.ruleType,
        threshold: newRule.threshold,
        timeWindow: newRule.timeWindow,
        asset: 'portfolio' // Could be specific asset
      };

      const response = await fetch('/api/advisor/alerts/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: selectedWallet,
          name: newRule.name,
          ruleJson,
          channel: newRule.channel,
          target: newRule.channel !== 'inapp' ? newRule.target : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create rule');
      }

      setNewRule({
        name: '',
        channel: 'inapp',
        target: '',
        ruleType: 'price_drop',
        threshold: 10,
        timeWindow: '1h'
      });
      setShowCreateForm(false);
      loadRules();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create rule');
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/advisor/alerts/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ruleId,
          enabled
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update rule');
      }

      loadRules();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update rule');
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this alert rule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/advisor/alerts/rules?id=${ruleId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete rule');
      }

      loadRules();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete rule');
    }
  };

  const testRule = async (ruleId: string) => {
    try {
      const response = await fetch('/api/advisor/alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId })
      });

      if (!response.ok) {
        throw new Error('Failed to test rule');
      }

      alert('Test alert sent! Check your notifications.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to test rule');
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'inapp': return '📱';
      case 'email': return '📧';
      case 'webhook': return '🔗';
      default: return '📢';
    }
  };

  const getRuleTypeDescription = (ruleType: string) => {
    switch (ruleType) {
      case 'price_drop': return 'Portfolio drops by X%';
      case 'price_rise': return 'Portfolio rises by X%';
      case 'concentration': return 'Top position exceeds X%';
      case 'volatility': return 'High volatility detected';
      default: return 'Custom rule';
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
                  Alert Management
                </h1>
                <p className="text-[color:var(--muted)]">
                  Set up smart alerts for your portfolio
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
              {/* Create New Rule */}
              <div className="bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-[color:var(--text)]">
                    Create Alert Rule
                  </h2>
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    {showCreateForm ? 'Cancel' : 'New Alert'}
                  </button>
                </div>

                {showCreateForm && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[color:var(--text)] mb-2">
                          Rule Name
                        </label>
                        <input
                          type="text"
                          value={newRule.name}
                          onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                          placeholder="e.g., Portfolio Drop Alert"
                          className="w-full px-4 py-3 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[color:var(--text)] mb-2">
                          Alert Type
                        </label>
                        <select
                          value={newRule.ruleType}
                          onChange={(e) => setNewRule({ ...newRule, ruleType: e.target.value })}
                          className="w-full px-4 py-3 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="price_drop">Price Drop</option>
                          <option value="price_rise">Price Rise</option>
                          <option value="concentration">Concentration</option>
                          <option value="volatility">Volatility</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[color:var(--text)] mb-2">
                          Threshold (%)
                        </label>
                        <input
                          type="number"
                          value={newRule.threshold}
                          onChange={(e) => setNewRule({ ...newRule, threshold: parseInt(e.target.value) })}
                          min="1"
                          max="100"
                          className="w-full px-4 py-3 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[color:var(--text)] mb-2">
                          Time Window
                        </label>
                        <select
                          value={newRule.timeWindow}
                          onChange={(e) => setNewRule({ ...newRule, timeWindow: e.target.value })}
                          className="w-full px-4 py-3 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="1h">1 Hour</option>
                          <option value="4h">4 Hours</option>
                          <option value="24h">24 Hours</option>
                          <option value="7d">7 Days</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[color:var(--text)] mb-2">
                          Notification Channel
                        </label>
                        <select
                          value={newRule.channel}
                          onChange={(e) => setNewRule({ ...newRule, channel: e.target.value as any })}
                          className="w-full px-4 py-3 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="inapp">In-App Notification</option>
                          <option value="email">Email</option>
                          <option value="webhook">Webhook</option>
                        </select>
                      </div>
                      {(newRule.channel === 'email' || newRule.channel === 'webhook') && (
                        <div>
                          <label className="block text-sm font-medium text-[color:var(--text)] mb-2">
                            {newRule.channel === 'email' ? 'Email Address' : 'Webhook URL'}
                          </label>
                          <input
                            type={newRule.channel === 'email' ? 'email' : 'url'}
                            value={newRule.target}
                            onChange={(e) => setNewRule({ ...newRule, target: e.target.value })}
                            placeholder={newRule.channel === 'email' ? 'your@email.com' : 'https://hooks.slack.com/...'}
                            className="w-full px-4 py-3 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>

                    {error && (
                      <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                        {error}
                      </div>
                    )}

                    <button
                      onClick={createRule}
                      disabled={loading}
                      className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating...' : 'Create Alert Rule'}
                    </button>
                  </div>
                )}
              </div>

              {/* Existing Rules */}
              <div className="bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-[color:var(--text)]">
                    Active Alert Rules
                  </h2>
                  
                  {/* Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/advisor/alerts/test', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ walletId: selectedWallet })
                          });
                          if (response.ok) {
                            alert('Test alert sent successfully!');
                          } else {
                            alert('Failed to send test alert');
                          }
                        } catch (err) {
                          alert('Error sending test alert');
                        }
                      }}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Send test alert
                    </button>
                    
                    <label className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
                      <input
                        type="checkbox"
                        checked={allAlertsPaused}
                        onChange={(e) => setAllAlertsPaused(e.target.checked)}
                        className="rounded border-[color:var(--border)]"
                      />
                      Pause all alerts
                    </label>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-[color:var(--muted)]">Loading rules...</div>
                  </div>
                ) : rules.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-[color:var(--muted)] mb-4">
                      No alert rules created yet.
                    </div>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                      Create Your First Alert
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rules.map((rule) => (
                      <div key={rule.id} className="border border-[color:var(--border)] rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-[color:var(--text)]">{rule.name}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                rule.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {rule.enabled ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </div>
                            <div className="text-sm text-[color:var(--muted)]">
                              {getRuleTypeDescription(rule.ruleJson.type)} • {getChannelIcon(rule.channel)} {rule.channel}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleRule(rule.id, !rule.enabled)}
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                rule.enabled 
                                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                  : 'bg-green-100 text-green-600 hover:bg-green-200'
                              }`}
                            >
                              {rule.enabled ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => testRule(rule.id)}
                              className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-xs font-medium hover:bg-blue-200"
                            >
                              Test
                            </button>
                            <button
                              onClick={() => deleteRule(rule.id)}
                              className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs font-medium hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Recent Events */}
                        {rule.recentEvents.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-[color:var(--border)]">
                            <div className="text-sm font-medium text-[color:var(--text)] mb-2">
                              Recent Events
                            </div>
                            <div className="space-y-1">
                              {rule.recentEvents.slice(0, 3).map((event) => (
                                <div key={event.id} className="flex justify-between items-center text-sm">
                                  <span className="text-[color:var(--muted)]">
                                    {new Date(event.firedAt).toLocaleString()}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    event.delivered ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                                  }`}>
                                    {event.delivered ? 'Delivered' : 'Pending'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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
