/**
 * Kill switch status component
 * Shows current kill switch status and allows admin actions
 */

'use client';

import { useState, useEffect } from 'react';

interface KillSwitchStatus {
  isActive: boolean;
  reason?: string;
  scope: string;
  activatedAt?: string;
  canDeactivate: boolean;
}

export default function KillSwitchStatus() {
  const [status, setStatus] = useState<KillSwitchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchStatus();
    // Check if user is admin (in real app, this would come from auth)
    setIsAdmin(true); // Mock admin for demo
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/kill-switch');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.data.uiConfig);
      }
    } catch (error) {
      console.error('Failed to fetch kill switch status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKillSwitchAction = async (action: string, reason?: string) => {
    try {
      const response = await fetch('/api/admin/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason,
          activatedBy: 'admin'
        })
      });

      const data = await response.json();
      if (data.success) {
        setStatus(data.status);
      } else {
        alert(`Failed to ${action} kill switch: ${data.error}`);
      }
    } catch (error) {
      console.error(`Failed to ${action} kill switch:`, error);
      alert(`Failed to ${action} kill switch`);
    }
  };

  if (loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
          <span className="text-yellow-800">Checking system status...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  if (status.isActive) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
            <div>
              <h3 className="text-red-800 font-medium">Trading Operations Disabled</h3>
              <p className="text-red-600 text-sm">
                {status.reason || 'Kill switch is active'}
                {status.activatedAt && (
                  <span className="ml-2">
                    (Since {new Date(status.activatedAt).toLocaleString()})
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {isAdmin && status.canDeactivate && (
            <button
              onClick={() => handleKillSwitchAction('deactivate')}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Deactivate
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
          <div>
            <h3 className="text-green-800 font-medium">Trading Operations Active</h3>
            <p className="text-green-600 text-sm">All systems operational</p>
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex space-x-2">
            <button
              onClick={() => {
                const reason = prompt('Enter reason for activation:');
                if (reason) {
                  handleKillSwitchAction('activate', reason);
                }
              }}
              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
            >
              Activate
            </button>
            <button
              onClick={() => {
                const reason = prompt('Enter reason for emergency shutdown:');
                if (reason) {
                  handleKillSwitchAction('emergency', reason);
                }
              }}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Emergency
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
