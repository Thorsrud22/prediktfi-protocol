"use client";

import { useState, useEffect } from "react";
import { getAttribution } from "../lib/attribution";
import { CopyButton } from "./CopyButton";

interface RefPanelProps {
  marketId: string;
  creatorId?: string;
}

export default function RefPanel({ marketId, creatorId }: RefPanelProps) {
  const [refLink, setRefLink] = useState("");

  useEffect(() => {
    // Generate the ref link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const marketPath = `/market/${encodeURIComponent(marketId)}`;
    
    // Get attribution data
    const attribution = getAttribution();
    
    // Determine ref value: use stored ref if exists, otherwise creatorId
    const refValue = attribution.ref || creatorId || "";
    const creatorValue = creatorId || "";
    
    // Build URL with query parameters
    const url = new URL(marketPath, baseUrl);
    if (refValue) {
      url.searchParams.set("ref", refValue);
    }
    if (creatorValue) {
      url.searchParams.set("creator", creatorValue);
    }
    
    setRefLink(url.toString());
  }, [marketId, creatorId]);

  return (
    <div className="bg-[color:var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4">
      <h3 className="text-sm font-medium text-[color:var(--text)] mb-2">
        Share this market
      </h3>
      
      {/* Ref link display */}
      <div className="bg-[color:var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 mb-3">
        <code className="text-xs text-[color:var(--muted)] break-all">
          {refLink}
        </code>
      </div>
      
      {/* Copy button */}
      <div className="flex justify-start">
        <CopyButton 
          label="link"
          value={refLink}
        />
      </div>
      
      {/* Help text */}
      <p className="text-xs text-[color:var(--muted)] mt-3">
        Link carries attribution for referrals and creators
      </p>
    </div>
  );
}
