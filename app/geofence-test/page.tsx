"use client";

import { useState } from "react";

export default function GeofenceTestPage() {
  const [testResult, setTestResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testGeofence = async (countryCode: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-geofence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-ip-country': countryCode,
        },
        body: JSON.stringify({ test: true }),
      });
      
      if (response.redirected) {
        setTestResult(`Redirected to: ${response.url}`);
      } else if (response.ok) {
        setTestResult(`Success: ${response.status}`);
      } else {
        setTestResult(`Error: ${response.status}`);
      }
    } catch (error) {
      setTestResult(`Error: ${error}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[color:var(--bg)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[color:var(--text)] mb-8">
          Geofence Test Page
        </h1>
        
        <div className="bg-[color:var(--surface)] rounded-[var(--radius)] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[color:var(--text)] mb-4">
            Current Configuration
          </h2>
          <div className="space-y-2 text-[color:var(--muted)] text-sm">
            <p><strong>Cluster:</strong> {process.env.NODE_ENV} (devnet in dev)</p>
            <p><strong>Blocked Country:</strong> NO (Norway)</p>
            <p><strong>Blocked Paths:</strong> /legacy/*, /api/admin/*</p>
            <p><strong>Headers Checked:</strong> x-vercel-ip-country, cf-ipcountry, x-country</p>
          </div>
        </div>

        <div className="bg-[color:var(--surface)] rounded-[var(--radius)] p-6">
          <h2 className="text-lg font-semibold text-[color:var(--text)] mb-4">
            Test Geofence
          </h2>
          <div className="space-y-4">
            <button
              onClick={() => testGeofence('NO')}
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
            >
              Test with Norway (NO) - Should Block on Mainnet
            </button>
            <button
              onClick={() => testGeofence('US')}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Test with US - Should Allow
            </button>
            <button
              onClick={() => testGeofence('')}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Test without Country Header - Should Allow
            </button>
          </div>
          
          {testResult && (
            <div className="mt-4 p-3 bg-[color:var(--surface-2)] rounded text-[color:var(--text)] text-sm">
              <strong>Result:</strong> {testResult}
            </div>
          )}
          
          {loading && (
            <div className="mt-4 text-[color:var(--muted)] text-sm">
              Testing...
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-[color:var(--muted)] text-sm">
            Note: Geofence only active on mainnet. Currently running on devnet for development.
          </p>
        </div>
      </div>
    </div>
  );
}
