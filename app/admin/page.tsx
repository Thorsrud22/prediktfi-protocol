"use client";

import { useState, useEffect } from "react";
import MarketCard from "../components/MarketCard";
import { slugifyTitle, buildRefUrl, generateMarketId } from "../lib/creator-utils";
import { getAttribution } from "../lib/attribution";

type MarketFormData = {
  title: string;
  subtitle: string;
  endsAt: string;
  category: "KOL" | "Expert" | "Sports" | "Crypto" | "Culture" | "Predikt";
  creatorHandle: string;
  creatorId: string;
  avatarUrl: string;
  poolLamports: string;
};

export default function AdminPage() {
  const [copySuccess, setCopySuccess] = useState(false);
  const [formData, setFormData] = useState<MarketFormData>({
    title: "",
    subtitle: "",
    endsAt: "",
    category: "Predikt",
    creatorHandle: "",
    creatorId: "",
    avatarUrl: "",
    poolLamports: "",
  });

  // Load creatorId from localStorage on mount
  useEffect(() => {
    const attribution = getAttribution();
    if (attribution.creatorId) {
      setFormData(prev => ({
        ...prev,
        creatorId: attribution.creatorId || "",
      }));
    }
  }, []);

  // Generate market ID based on title
  const marketId = formData.title ? generateMarketId(formData.title) : "";

  // Generate ref URL
  const generateRefUrl = () => {
    if (!marketId || !formData.creatorId) return "";
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const attribution = getAttribution();
    const storedRef = attribution.ref;
    
    return buildRefUrl(siteUrl, marketId, formData.creatorId, storedRef);
  };

  const refUrl = generateRefUrl();

  // Handle copy to clipboard
  const handleCopyUrl = async () => {
    if (!refUrl) return;
    
    try {
      await navigator.clipboard.writeText(refUrl);
      setCopySuccess(true);
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  // Handle form field changes
  const handleInputChange = (field: keyof MarketFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[color:var(--text)] mb-2">
          Creator Hub
        </h1>
        <p className="text-[color:var(--muted)]">
          Create and manage prediction markets as a content creator or analyst
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-6">
          <div className="bg-[color:var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6">
            <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">
              Market Details
            </h2>
            
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-[color:var(--text)] mb-1">
                  Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="w-full px-3 py-2 bg-[color:var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  placeholder="Will Bitcoin reach $100k by 2025?"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label htmlFor="subtitle" className="block text-sm font-medium text-[color:var(--text)] mb-1">
                  Subtitle (optional)
                </label>
                <textarea
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => handleInputChange("subtitle", e.target.value)}
                  className="w-full px-3 py-2 bg-[color:var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  rows={2}
                  placeholder="Additional context or description"
                />
              </div>

              {/* End Date/Time */}
              <div>
                <label htmlFor="endsAt" className="block text-sm font-medium text-[color:var(--text)] mb-1">
                  Ends At *
                </label>
                <input
                  id="endsAt"
                  type="datetime-local"
                  value={formData.endsAt}
                  onChange={(e) => handleInputChange("endsAt", e.target.value)}
                  className="w-full px-3 py-2 bg-[color:var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-[color:var(--text)] mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value as MarketFormData["category"])}
                  className="w-full px-3 py-2 bg-[color:var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                >
                  <option value="KOL">KOL</option>
                  <option value="Expert">Expert</option>
                  <option value="Sports">Sports</option>
                  <option value="Crypto">Crypto</option>
                  <option value="Culture">Culture</option>
                  <option value="Predikt">Predikt</option>
                </select>
              </div>
            </div>
          </div>

          {/* Creator Info */}
          <div className="bg-[color:var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6">
            <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">
              Creator Info
            </h2>
            
            <div className="space-y-4">
              {/* Creator Handle */}
              <div>
                <label htmlFor="creatorHandle" className="block text-sm font-medium text-[color:var(--text)] mb-1">
                  Creator Handle *
                </label>
                <input
                  id="creatorHandle"
                  type="text"
                  value={formData.creatorHandle}
                  onChange={(e) => handleInputChange("creatorHandle", e.target.value)}
                  className="w-full px-3 py-2 bg-[color:var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  placeholder="CryptoAnalyst"
                />
              </div>

              {/* Creator ID */}
              <div>
                <label htmlFor="creatorId" className="block text-sm font-medium text-[color:var(--text)] mb-1">
                  Creator ID *
                </label>
                <input
                  id="creatorId"
                  type="text"
                  value={formData.creatorId}
                  onChange={(e) => handleInputChange("creatorId", e.target.value)}
                  className="w-full px-3 py-2 bg-[color:var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  placeholder="crypto_analyst_123"
                />
              </div>

              {/* Avatar URL */}
              <div>
                <label htmlFor="avatarUrl" className="block text-sm font-medium text-[color:var(--text)] mb-1">
                  Avatar URL (V1)
                </label>
                <input
                  id="avatarUrl"
                  type="url"
                  value={formData.avatarUrl}
                  onChange={(e) => handleInputChange("avatarUrl", e.target.value)}
                  className="w-full px-3 py-2 bg-[color:var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  placeholder="https://api.dicebear.com/7.x/personas/svg?seed=creator"
                />
              </div>

              {/* Pool Lamports */}
              <div>
                <label htmlFor="poolLamports" className="block text-sm font-medium text-[color:var(--text)] mb-1">
                  Pool Lamports (optional)
                </label>
                <input
                  id="poolLamports"
                  type="number"
                  value={formData.poolLamports}
                  onChange={(e) => handleInputChange("poolLamports", e.target.value)}
                  className="w-full px-3 py-2 bg-[color:var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  placeholder="1000000000000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview and Share */}
        <div className="space-y-6">
          {/* Market Preview */}
          <div className="bg-[color:var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6">
            <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">
              Preview
            </h2>
            
            {formData.title && formData.creatorHandle ? (
              <MarketCard
                id={marketId}
                title={formData.title}
                subtitle={formData.subtitle || undefined}
                endsAt={formData.endsAt ? new Date(formData.endsAt).getTime() : Date.now() + 30 * 24 * 60 * 60 * 1000}
                poolLamports={formData.poolLamports ? parseInt(formData.poolLamports) : 1000000000000}
                participants={42}
                creator={{
                  handle: formData.creatorHandle,
                  badge: formData.category,
                  avatarUrl: formData.avatarUrl || `https://api.dicebear.com/7.x/personas/svg?seed=${formData.creatorHandle}`,
                }}
                category={formData.category}
              />
            ) : (
              <div className="text-center py-8 text-[color:var(--muted)]">
                Fill in the form to see preview
              </div>
            )}
          </div>

          {/* Ref URL Generator */}
          <div className="bg-[color:var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6">
            <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">
              Share URL
            </h2>
            
            {refUrl ? (
              <div className="space-y-4">
                <div className="bg-[color:var(--surface-2)] border border-[var(--border)] rounded px-3 py-2">
                  <code className="text-xs text-[color:var(--muted)] break-all">
                    {refUrl}
                  </code>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyUrl}
                    className="btn-primary px-4 py-2 text-sm flex-1"
                  >
                    {copySuccess ? "Copied!" : "Copy URL"}
                  </button>
                  
                  <div 
                    aria-live="polite" 
                    className={`text-xs transition-opacity duration-200 ${
                      copySuccess 
                        ? "text-green-600 dark:text-green-400 opacity-100" 
                        : "opacity-0"
                    }`}
                  >
                    ✓ URL copied
                  </div>
                </div>
                
                <p className="text-xs text-[color:var(--muted)]">
                  This URL carries attribution for referrals and creators
                </p>
              </div>
            ) : (
              <div className="text-center py-4 text-[color:var(--muted)]">
                Fill in title and creator ID to generate share URL
              </div>
            )}
          </div>

          {/* Generated Market ID */}
          {marketId && (
            <div className="bg-[color:var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4">
              <h3 className="text-sm font-medium text-[color:var(--text)] mb-2">
                Generated Market ID
              </h3>
              <code className="text-sm text-[color:var(--muted)]">
                {marketId}
              </code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
