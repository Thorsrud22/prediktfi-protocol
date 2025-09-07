// app/components/advisor/RuleEditor.tsx
import { useState } from 'react';

interface RuleEditorProps {
  ruleType: string;
  onSave: (rule: any) => void;
  onCancel: () => void;
  initialRule?: any;
}

export default function RuleEditor({ ruleType, onSave, onCancel, initialRule }: RuleEditorProps) {
  const [rule, setRule] = useState(initialRule || {
    name: '',
    threshold: 10,
    timeWindow: '1h',
    asset: 'portfolio',
    action: 'alert'
  });

  const handleSave = () => {
    const ruleConfig = {
      type: ruleType,
      threshold: rule.threshold,
      timeWindow: rule.timeWindow,
      asset: rule.asset,
      action: rule.action,
      enabled: true
    };

    onSave({
      name: rule.name,
      ruleJson: ruleConfig,
      channel: 'inapp'
    });
  };

  const getRuleTypeDescription = (type: string) => {
    switch (type) {
      case 'price_drop': return 'Portfolio drops by X%';
      case 'price_rise': return 'Portfolio rises by X%';
      case 'concentration': return 'Top position exceeds X%';
      case 'volatility': return 'High volatility detected';
      default: return 'Custom rule';
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-1">
          {getRuleTypeDescription(ruleType)}
        </h3>
        <p className="text-sm text-blue-700">
          Configure the parameters for this alert rule
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[color:var(--text)] mb-2">
          Rule Name
        </label>
        <input
          type="text"
          value={rule.name}
          onChange={(e) => setRule({ ...rule, name: e.target.value })}
          placeholder="Enter a descriptive name for this rule..."
          className="w-full px-4 py-3 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[color:var(--text)] mb-2">
            Threshold (%)
          </label>
          <input
            type="number"
            value={rule.threshold}
            onChange={(e) => setRule({ ...rule, threshold: parseInt(e.target.value) })}
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
            value={rule.timeWindow}
            onChange={(e) => setRule({ ...rule, timeWindow: e.target.value })}
            className="w-full px-4 py-3 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">1 Hour</option>
            <option value="4h">4 Hours</option>
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
          </select>
        </div>
      </div>

      {ruleType === 'concentration' && (
        <div>
          <label className="block text-sm font-medium text-[color:var(--text)] mb-2">
            Asset to Monitor
          </label>
          <select
            value={rule.asset}
            onChange={(e) => setRule({ ...rule, asset: e.target.value })}
            className="w-full px-4 py-3 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="portfolio">Entire Portfolio</option>
            <option value="top_position">Top Position</option>
            <option value="bitcoin">Bitcoin</option>
            <option value="ethereum">Ethereum</option>
            <option value="solana">Solana</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[color:var(--text)] mb-2">
          Action
        </label>
        <select
          value={rule.action}
          onChange={(e) => setRule({ ...rule, action: e.target.value })}
          className="w-full px-4 py-3 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="alert">Send Alert</option>
          <option value="warning">Send Warning</option>
          <option value="notification">Send Notification</option>
        </select>
      </div>

      <div className="flex space-x-4 pt-4">
        <button
          onClick={handleSave}
          className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600"
        >
          Save Rule
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
