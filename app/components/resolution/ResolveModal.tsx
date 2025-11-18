'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface ResolveModalProps {
  insight: {
    id: string;
    question: string;
    probability: number;
    deadline: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ResolveModal({ insight, isOpen, onClose, onSuccess }: ResolveModalProps) {
  const [result, setResult] = useState<'YES' | 'NO' | 'INVALID'>('YES');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/insight/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          insightId: insight.id,
          result,
          evidenceUrl: evidenceUrl.trim() || undefined,
          evidenceNote: evidenceNote.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resolve prediction');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve prediction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-xl border border-white/20 max-w-2xl w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Resolve Prediction</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Question Display */}
        <div className="mb-6 p-4 bg-white/10 rounded-lg border border-white/20">
          <p className="text-sm text-blue-300 mb-2">Your Prediction:</p>
          <p className="text-white text-lg font-semibold mb-2">{insight.question}</p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Probability: {insight.probability}%</span>
            <span>•</span>
            <span>Deadline: {new Date(insight.deadline).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm">❌ {error}</p>
          </div>
        )}

        {/* Resolution Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Result Selection */}
          <div>
            <label className="block text-sm font-medium text-blue-200 mb-3">
              What was the outcome?
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setResult('YES')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  result === 'YES'
                    ? 'border-green-500 bg-green-500/20 text-green-300'
                    : 'border-white/20 bg-white/5 text-gray-400 hover:border-white/30'
                }`}
              >
                <div className="text-2xl mb-1">✓</div>
                <div className="font-semibold">YES</div>
                <div className="text-xs">Prediction was correct</div>
              </button>

              <button
                type="button"
                onClick={() => setResult('NO')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  result === 'NO'
                    ? 'border-red-500 bg-red-500/20 text-red-300'
                    : 'border-white/20 bg-white/5 text-gray-400 hover:border-white/30'
                }`}
              >
                <div className="text-2xl mb-1">✗</div>
                <div className="font-semibold">NO</div>
                <div className="text-xs">Prediction was wrong</div>
              </button>

              <button
                type="button"
                onClick={() => setResult('INVALID')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  result === 'INVALID'
                    ? 'border-yellow-500 bg-yellow-500/20 text-yellow-300'
                    : 'border-white/20 bg-white/5 text-gray-400 hover:border-white/30'
                }`}
              >
                <div className="text-2xl mb-1">?</div>
                <div className="font-semibold">INVALID</div>
                <div className="text-xs">Can't be determined</div>
              </button>
            </div>
          </div>

          {/* Evidence URL */}
          <div>
            <label className="block text-sm font-medium text-blue-200 mb-2">
              Evidence URL (Optional)
            </label>
            <input
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://example.com/proof"
              className="w-full p-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/10 text-white placeholder-blue-300/60"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-400 mt-1">
              Link to proof or source (news article, price chart, etc.)
            </p>
          </div>

          {/* Evidence Note */}
          <div>
            <label className="block text-sm font-medium text-blue-200 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              placeholder="Explain why this outcome occurred..."
              className="w-full p-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none bg-white/10 text-white placeholder-blue-300/60"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/20">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-white/30 text-blue-200 rounded-lg hover:bg-white/10 transition-colors font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Resolving...
                </span>
              ) : (
                'Resolve Prediction'
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-300">
            💡 <strong>Tip:</strong> Your accuracy score will be updated based on how well your
            predicted probability matched the actual outcome. Honest resolution builds trust!
          </p>
        </div>
      </div>
    </div>
  );
}
