import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Admin | PrediktFi',
  description: 'Admin dashboard and management tools',
  robots: 'noindex, nofollow'
};

// Server-side admin check
function isAdminEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_ADMIN === 'true';
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side feature flag check
  if (!isAdminEnabled()) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <nav className="flex space-x-4">
              <a 
                href="/admin/metrics" 
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                Metrics
              </a>
              <a 
                href="/" 
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                ← Back to Site
              </a>
            </nav>
          </div>
        </div>
      </div>
      
      {children}
    </div>
  );
}
