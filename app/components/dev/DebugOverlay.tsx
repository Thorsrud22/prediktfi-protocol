'use client';

import React, { useState, useEffect } from 'react';
import { Bug, X, Copy, Check } from 'lucide-react';

interface DebugOverlayProps {
  className?: string;
}

export default function DebugOverlay({ className = '' }: DebugOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [debugData, setDebugData] = useState({
    ab_context: null,
    ab_cta: null,
    lastSignalsXCache: null,
    timestamp: new Date().toISOString(),
    userAgent: '',
    url: '',
    localStorage: { keys: [] as string[], size: 0 },
    sessionStorage: { keys: [] as string[], size: 0 }
  });

  useEffect(() => {
    // Gather debug data from various sources
    const gatherDebugData = () => {
      const data = {
        ab_context: (window as any).ab_context || null,
        ab_cta: (window as any).ab_cta || null,
        lastSignalsXCache: (window as any).lastSignalsXCache || null,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        localStorage: {
          keys: Object.keys(localStorage).filter(key => key.startsWith('predikt')),
          size: JSON.stringify(localStorage).length
        },
        sessionStorage: {
          keys: Object.keys(sessionStorage),
          size: JSON.stringify(sessionStorage).length
        }
      };
      setDebugData(data);
    };

    gatherDebugData();

    // Update every 5 seconds
    const interval = setInterval(gatherDebugData, 5000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy debug data:', err);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-32 sm:bottom-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-all ${className}`}
        title="Debug Overlay"
      >
        <Bug className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bug className="w-5 h-5" />
                Debug Overlay
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-auto max-h-[calc(80vh-80px)]">
              <div className="space-y-4">
                {/* A/B Testing Context */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">A/B Testing Context</h3>
                  <pre className="bg-gray-800 p-3 rounded text-xs text-gray-300 overflow-x-auto">
                    {JSON.stringify(debugData.ab_context, null, 2)}
                  </pre>
                </div>

                {/* A/B CTA */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">A/B CTA</h3>
                  <pre className="bg-gray-800 p-3 rounded text-xs text-gray-300 overflow-x-auto">
                    {JSON.stringify(debugData.ab_cta, null, 2)}
                  </pre>
                </div>

                {/* Signals Cache */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Last Signals X Cache</h3>
                  <pre className="bg-gray-800 p-3 rounded text-xs text-gray-300 overflow-x-auto">
                    {JSON.stringify(debugData.lastSignalsXCache, null, 2)}
                  </pre>
                </div>

                {/* System Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">System Info</h3>
                  <div className="bg-gray-800 p-3 rounded text-xs text-gray-300 space-y-1">
                    <div><strong>URL:</strong> {debugData.url}</div>
                    <div><strong>Timestamp:</strong> {debugData.timestamp}</div>
                    <div><strong>User Agent:</strong> {debugData.userAgent}</div>
                    <div><strong>LocalStorage Keys:</strong> {debugData.localStorage.keys.join(', ') || 'None'}</div>
                    <div><strong>LocalStorage Size:</strong> {debugData.localStorage.size} bytes</div>
                    <div><strong>SessionStorage Keys:</strong> {debugData.sessionStorage.keys.join(', ') || 'None'}</div>
                    <div><strong>SessionStorage Size:</strong> {debugData.sessionStorage.size} bytes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
