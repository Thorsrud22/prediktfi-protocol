"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function ReferralTracker() {
  const searchParams = useSearchParams();
  const [referralId, setReferralId] = useState<string | null>(null);

  useEffect(() => {
    // Check for referral in URL
    const ref = searchParams.get("ref");
    if (ref) {
      // Store referral in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem("predikt:referral", ref);
        setReferralId(ref);
        
        // Clean URL (optional - removes ref param from URL)
        const url = new URL(window.location.href);
        url.searchParams.delete("ref");
        window.history.replaceState({}, "", url.toString());
      }
    } else {
      // Check for existing referral in localStorage
      if (typeof window !== 'undefined') {
        const existingRef = localStorage.getItem("predikt:referral");
        if (existingRef) {
          setReferralId(existingRef);
        }
      }
    }
  }, [searchParams]);

  return (
    <>
      {referralId && (
        <div className="fixed top-4 right-4 z-50 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm dark:bg-blue-900/30 dark:text-blue-300">
          Referred by: <span className="font-medium">{referralId}</span>
        </div>
      )}
    </>
  );
}

export function ShareableMarketLink({ marketId, creatorId }: { marketId: string; creatorId?: string }) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  
  useEffect(() => {
    const url = creatorId 
      ? `${window.location.origin}/market/${marketId}?ref=${creatorId}`
      : `${window.location.origin}/market/${marketId}`;
    setShareUrl(url);
  }, [marketId, creatorId]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!creatorId || !shareUrl) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-[color:var(--surface)] rounded-lg border border-[var(--border)]">
      <div className="flex-1">
        <div className="text-sm font-medium text-[color:var(--text)] mb-1">
          Share this market and earn referral credit
        </div>
        <div className="text-xs text-[color:var(--muted)] font-mono bg-[color:var(--background)] px-2 py-1 rounded">
          {shareUrl}
        </div>
      </div>
      <button
        onClick={handleCopy}
        className={`px-3 py-1 text-xs rounded transition-colors ${
          copied
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
            : "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
        }`}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
