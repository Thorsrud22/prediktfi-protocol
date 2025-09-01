"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useCallback } from "react";

interface FastLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  prefetch?: boolean;
  onClick?: () => void;
}

export default function FastLink({ 
  href, 
  children, 
  className, 
  prefetch = true,
  onClick 
}: FastLinkProps) {
  const router = useRouter();

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Call the external onClick handler first
    if (onClick) {
      onClick();
    }
    
    // For internal navigation, use router.push for instant transitions
    if (href.startsWith('/') && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      
      // Add visual feedback immediately
      const target = e.currentTarget as HTMLElement;
      target.style.opacity = '0.7';
      
      // Navigate
      router.push(href);
      
      // Reset visual feedback after navigation starts
      setTimeout(() => {
        target.style.opacity = '1';
      }, 100);
    }
  }, [href, router, onClick]);

  return (
    <Link 
      href={href} 
      className={className}
      prefetch={prefetch}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
