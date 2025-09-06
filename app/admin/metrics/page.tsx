'use client';

import { useEffect, useState } from 'react';
import AdminMetricsDashboard from './AdminMetricsDashboard';

export default function AdminMetricsPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Client-side admin check
    const adminEnabled = process.env.NEXT_PUBLIC_ENABLE_ADMIN === 'true';
    setIsAuthorized(adminEnabled);
    setLoading(false);
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Admin dashboard is not enabled.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Metrics</h1>
          <p className="mt-2 text-gray-600">
            System performance, volume metrics, and creator analytics
          </p>
        </div>
        
        {/* Dashboard Component */}
        <AdminMetricsDashboard />
      </div>
    </div>
  );
}
