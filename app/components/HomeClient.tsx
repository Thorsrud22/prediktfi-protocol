"use client";

import React, { memo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSimplifiedWallet } from './wallet/SimplifiedWalletProvider';

const HomeClient = memo(function HomeClient() {
  const router = useRouter();
  const { isConnected } = useSimplifiedWallet();
  const [isReturningUser, setIsReturningUser] = useState<boolean | null>(null);

  // Check if user is returning (has visited before) or has wallet isConnected
  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      setIsReturningUser(false);
      return;
    }

    try {
      // Check for various indicators of returning user
      const hasVisitedBefore = 
        localStorage.getItem('predikt:visited') === 'true' ||
        localStorage.getItem('predikt:referral') !== null ||
        document.cookie.includes('predikt_plan=') ||
        document.cookie.includes('predikt_consent_v1=');

      setIsReturningUser(hasVisitedBefore);

      // If returning user OR wallet is authenticated, redirect to Feed after a short delay
      if (hasVisitedBefore || isConnected) {
        const timer = setTimeout(() => {
          router.push('/feed');
        }, 1500); // 1.5 second delay to show the redirect

        return () => clearTimeout(timer);
      } else {
        // Mark as visited for future visits
        localStorage.setItem('predikt:visited', 'true');
      }
    } catch (error) {
      console.warn('Error checking returning user status:', error);
      setIsReturningUser(false);
    }
  }, [router, isConnected]);

  // Show loading state while checking returning user status
  if (isReturningUser === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show redirect message for returning users or authenticated wallet
  if (isReturningUser || isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isConnected ? 'Wallet Authenticated!' : 'Welcome back!'}
          </h2>
          <p className="text-gray-400 mb-4">Taking you to your Feed...</p>
          <div className="w-64 bg-gray-700 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return null; // Return null if showing static content
});

export default HomeClient;