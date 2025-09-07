"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CONSENT_KEY = "predikt:consent:v1";

interface ConsentGateProps {
  forceShow?: boolean;
  onConsentGiven?: () => void;
}

export default function ConsentGate({ forceShow = false, onConsentGiven }: ConsentGateProps = {}) {
  const [showDialog, setShowDialog] = useState(false);
  const [isMainnet, setIsMainnet] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Check if we're on mainnet (use server-side cluster info via data attribute or other method)
    // For now, we'll check if we're in production and not explicitly devnet
    const isProduction = process.env.NODE_ENV === 'production';
    const cluster = document.body.dataset.cluster || 'devnet';
    const mainnet = cluster === 'mainnet-beta';
    
    setIsMainnet(mainnet);

    if (mainnet) {
      // Check if consent has been given
      const consent = localStorage.getItem(CONSENT_KEY);
      if (!consent || forceShow) {
        setShowDialog(true);
      }
    } else if (forceShow) {
      // Allow forcing dialog even on devnet for testing
      setShowDialog(true);
    }
  }, [forceShow, mounted]);

  const handleAccept = async () => {
    try {
      // Set localStorage first
      localStorage.setItem(CONSENT_KEY, "true");
      
      // Then set server-side cookie
      await fetch('/api/set-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ consent: true }),
      });
      
      setShowDialog(false);
      
      // Call callback if provided
      if (onConsentGiven) {
        onConsentGiven();
      }
    } catch (error) {
      console.error('Failed to set consent:', error);
      // Still close dialog as localStorage was set
      setShowDialog(false);
      
      // Call callback even on error
      if (onConsentGiven) {
        onConsentGiven();
      }
    }
  };

  // Only render when should show
  if (!showDialog) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[color:var(--surface)] border border-[var(--border)] rounded-[var(--radius)] max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg 
              className="w-8 h-8 text-blue-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[color:var(--text)] mb-4">
            Age Verification Required
          </h2>
          <p className="text-[color:var(--muted)] mb-6">
            Before participating in prediction markets, please confirm your eligibility.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 font-bold text-sm">
              ⚠️ Predikt is a tool. You make the decision. No guarantees.
            </p>
          </div>
          
          <div className="bg-[color:var(--surface-2)] rounded-[var(--radius)] p-4">
            <p className="text-sm text-[color:var(--text)] leading-relaxed">
              I confirm I am at least 18 years old and I accept the{" "}
              <Link 
                href="/legal/terms" 
                className="text-[color:var(--primary)] hover:underline"
                target="_blank"
              >
                Terms of Service
              </Link>
              .
            </p>
          </div>

          <button
            onClick={handleAccept}
            className="w-full bg-[color:var(--primary)] text-white py-3 px-4 rounded-[var(--radius)] hover:opacity-90 transition-opacity font-medium"
          >
            I Accept
          </button>
        </div>

        <p className="text-xs text-[color:var(--muted)] text-center mt-4">
          You must be 18 or older to use this platform
        </p>
      </div>
    </div>
  );
}

// Helper function to check if consent has been given
export function hasConsent(): boolean {
  if (typeof window === 'undefined') return true; // Server-side, assume consent for now
  
  // Check if we're on mainnet
  const cluster = document.body.dataset.cluster || 'devnet';
  if (cluster !== 'mainnet-beta') return true; // No consent needed on devnet
  
  return localStorage.getItem(CONSENT_KEY) === "true";
}
