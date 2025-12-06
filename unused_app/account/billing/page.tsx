import { Suspense } from 'react';
import BillingClient from './BillingClient';

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-2">Manage your subscription and view payment history</p>
        </div>

        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <BillingClient />
        </Suspense>
      </div>
    </div>
  );
}
