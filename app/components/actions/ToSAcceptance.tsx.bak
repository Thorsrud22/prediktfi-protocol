/**
 * Terms of Service acceptance component
 * Handles ToS acceptance flow for Actions
 */

'use client';

import { useState, useEffect } from 'react';

interface ToSStatus {
  hasAccepted: boolean;
  currentVersion: string;
  tosText?: string;
}

export default function ToSAcceptance() {
  const [status, setStatus] = useState<ToSStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [showToS, setShowToS] = useState(false);

  useEffect(() => {
    checkToSStatus();
  }, []);

  const checkToSStatus = async () => {
    try {
      const response = await fetch('/api/tos/accept?userId=anonymous');
      const data = await response.json();
      
      if (data.hasAccepted !== undefined) {
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to check ToS status:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptToS = async () => {
    setAccepting(true);
    try {
      const response = await fetch('/api/tos/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'anonymous',
          tosVersion: status?.currentVersion
        })
      });

      const data = await response.json();
      if (data.success) {
        setStatus(prev => prev ? { ...prev, hasAccepted: true } : null);
        setShowToS(false);
      } else {
        alert(`Failed to accept ToS: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to accept ToS:', error);
      alert('Failed to accept Terms of Service');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-blue-800">Checking Terms of Service...</span>
        </div>
      </div>
    );
  }

  if (!status || status.hasAccepted) {
    return null;
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-orange-800 font-medium mb-2">
            Terms of Service Required
          </h3>
          <p className="text-orange-600 text-sm mb-3">
            You must accept the Terms of Service before using trading features.
          </p>
          
          {!showToS ? (
            <div className="flex space-x-2">
              <button
                onClick={() => setShowToS(true)}
                className="px-4 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
              >
                View Terms of Service
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white border border-orange-200 rounded p-4 max-h-64 overflow-y-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {status.tosText}
                </pre>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={acceptToS}
                  disabled={accepting}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {accepting ? 'Accepting...' : 'Accept Terms of Service'}
                </button>
                <button
                  onClick={() => setShowToS(false)}
                  className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
