'use client';

import { useState, useEffect } from 'react';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface InviteCode {
  id: string;
  code: string;
  usedCount: number;
  maxUses: number;
  remainingUses: number;
  createdAt: string;
  expiresAt?: string;
}

interface InviteCodeWidgetProps {
  walletId?: string;
}

export default function InviteCodeWidget({ walletId }: InviteCodeWidgetProps) {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchInviteCodes();
  }, []);

  const fetchInviteCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invite-codes');
      const data = await response.json();

      if (data.success) {
        setInviteCodes(data.codes);
      } else {
        setError(data.error || 'Failed to load invite codes');
      }
    } catch (err) {
      setError('Failed to load invite codes');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const getShareUrl = (code: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    return `${baseUrl}/advisor/actions?invite=${code}`;
  };

  const copyShareUrl = async (code: string) => {
    try {
      const shareUrl = getShareUrl(code);
      await navigator.clipboard.writeText(shareUrl);
      setCopiedCode(`url-${code}`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy share URL:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">{error}</p>
      </div>
    );
  }

  if (inviteCodes.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">No invite codes available. Contact admin to generate codes.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Invite Codes</h3>
        <span className="text-sm text-gray-500">
          {inviteCodes.length} active codes
        </span>
      </div>

      <div className="space-y-3">
        {inviteCodes.slice(0, 5).map((code) => (
          <div
            key={code.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm font-medium text-gray-900">
                  {code.code}
                </span>
                <span className="text-xs text-gray-500">
                  ({code.usedCount}/{code.maxUses} used)
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Created: {new Date(code.createdAt).toLocaleDateString()}
                {code.expiresAt && (
                  <span className="ml-2">
                    • Expires: {new Date(code.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(code.code)}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy code"
              >
                {copiedCode === code.code ? (
                  <CheckIcon className="h-4 w-4 text-green-600" />
                ) : (
                  <ClipboardDocumentIcon className="h-4 w-4" />
                )}
              </button>
              
              <button
                onClick={() => copyShareUrl(code.code)}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                title="Copy share URL"
              >
                {copiedCode === `url-${code.code}` ? (
                  <CheckIcon className="h-3 w-3" />
                ) : (
                  'Share'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {inviteCodes.length > 5 && (
        <div className="mt-4 text-center">
          <button
            onClick={fetchInviteCodes}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Load more codes
          </button>
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          💡 Share these codes to invite others to try ACTIONS. Track virality through usage counts.
        </p>
      </div>
    </div>
  );
}
