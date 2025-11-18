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
      className="text-base font-bold text-white hover:text-cyan-400 transition-all duration-300 hover:underline decoration-cyan-400/50"
      prefetch={true}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
