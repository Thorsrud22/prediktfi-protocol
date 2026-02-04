import { Metadata } from 'next';
import { Suspense } from 'react';
import AccountClient from './AccountClient';

export const metadata: Metadata = {
  title: 'Your Account • Predikt',
  description: 'Manage your wallet, plan, and payment history.',
  openGraph: {
    title: 'Your Account • Predikt',
    description: 'Manage your wallet, plan, and payment history.',
    type: 'website',
  },
  alternates: {
    canonical: '/account',
  },
  robots: {
    index: false, // Account pages should not be indexed
    follow: false,
  },
};

// Performance optimization for static generation
export const dynamic = 'force-dynamic'; // Account pages need user-specific data
export const revalidate = 0; // Disable caching for user-specific content

// Loading component for better UX
function AccountLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountLoading />}>
      <AccountClient />
    </Suspense>
  );
}
