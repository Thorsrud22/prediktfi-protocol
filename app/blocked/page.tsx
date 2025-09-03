import Link from "next/link";

export default function BlockedPage() {
  return (
    <div className="min-h-screen bg-[color:var(--bg)] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg 
              className="w-8 h-8 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" 
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[color:var(--text)] mb-4">
            Access Restricted
          </h1>
          <p className="text-[color:var(--muted)] mb-6">
            Not available in your location. See Policy for details.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/policy"
            className="block w-full bg-[color:var(--primary)] text-white py-3 px-4 rounded-[var(--radius)] hover:opacity-90 transition-opacity"
          >
            View Policy
          </Link>
          <Link
            href="/"
            className="block w-full text-[color:var(--muted)] hover:text-[color:var(--text)] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
