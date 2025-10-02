'use client';

import Link from 'next/link';

interface CreatorLinkProps {
  href: string;
  handle: string;
  rank: number;
  selectedPeriod: string;
  children: React.ReactNode;
}

export default function CreatorLink({ href, handle, rank, selectedPeriod, children }: CreatorLinkProps) {
  const handleClick = () => {
    // Track analytics event
    if (typeof window !== 'undefined') {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'creator_profile_nav_from_leaderboard',
          properties: { 
            ts: Date.now(), 
            path: window.location.pathname,
            creator_handle: handle,
            creator_rank: rank,
            period: selectedPeriod
          },
          timestamp: new Date().toISOString(),
        }),
      }).catch(error => console.error('Failed to track event:', error));
    }
  };

  return (
    <Link 
      href={href}
      className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
      prefetch={true}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
