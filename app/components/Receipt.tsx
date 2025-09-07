"use client";

import Link from "next/link";
import { type Insight } from "../lib/ai/types";
import { getExplorerUrl } from "../lib/solana";
import { buildXShareUrl, buildShareUrl } from "../lib/share";
import { timeAgo, formatTs } from "../lib/time";
import { CopyButton } from "./CopyButton";
import ProbabilityGauge from "./Studio/ProbabilityGauge";
import { useToast } from "./ToastProvider";
import { env } from "../lib/env";

interface ReceiptProps {
  insight: Insight;
  signature: string;
  slot?: number;
  cluster: "devnet" | "mainnet-beta";
}

export default function Receipt({ insight, signature, slot, cluster }: ReceiptProps) {
  const { addToast } = useToast();
  
  const explorerUrl = getExplorerUrl(signature, cluster === "devnet" ? "https://api.devnet.solana.com" : "https://api.mainnet-beta.solana.com");
  
  const handleCopyJSON = async () => {
    try {
      const jsonData = JSON.stringify(insight, null, 2);
      await navigator.clipboard.writeText(jsonData);
      addToast({
        title: "Copied!",
        description: "Insight JSON copied to clipboard",
        variant: "success",
        duration: 2000,
      });
    } catch (error) {
      addToast({
        title: "Error copying",
        description: "Failed to copy JSON to clipboard",
        variant: "error",
        duration: 3000,
      });
    }
  };

  const handleCopyPublicLink = async () => {
    try {
      const publicUrl = buildShareUrl(`/i/${signature}`);
      await navigator.clipboard.writeText(publicUrl);
      addToast({
        title: "Public link copied!",
        description: "Canonical URL with referral attribution copied to clipboard",
        variant: "success",
        duration: 3000,
      });
    } catch (error) {
      addToast({
        title: "Error copying",
        description: "Failed to copy link to clipboard",
        variant: "error",
        duration: 3000,
      });
    }
  };

  const handleShare = () => {
    const shareUrl = buildXShareUrl({
      question: insight.question,
      prob: insight.prob,
      signature,
    });
    
    window.open(shareUrl, "_blank", "noopener,noreferrer");
    
    addToast({
      title: "Shared!",
      description: "Opening X (Twitter) to share insight",
      variant: "success",
      duration: 2000,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-green-600 text-lg">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Verified Insight</h1>
      </div>

      {/* Meta Information */}
      <div className="bg-gray-50 rounded-md p-4 mb-6">
        <h2 className="font-medium text-gray-900 mb-3">Transaction Details</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Signature:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-gray-800">
                {signature.substring(0, 8)}...{signature.substring(-8)}
              </span>
              <CopyButton
                label="Copy signature"
                value={signature}
                onCopied={() => addToast({
                  title: "Copied!",
                  description: "Signature copied to clipboard",
                  variant: "success",
                  duration: 2000,
                })}
              />
            </div>
          </div>
          {slot && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Slot:</span>
              <span className="font-mono text-sm text-gray-800">{slot.toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Cluster:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              cluster === "mainnet-beta" 
                ? "bg-green-100 text-green-800" 
                : "bg-blue-100 text-blue-800"
            }`}>
              {cluster}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Consent Given:</span>
            <span className="text-sm text-gray-800">
              {new Date().toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Insight Summary */}
      <div className="mb-6">
        <h2 className="font-medium text-gray-900 mb-4">Insight Summary</h2>
        
        {/* Topic and Question */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium">
              {insight.topic}
            </span>
            <span className="text-sm text-gray-500">{insight.horizon}</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {insight.question}
          </h3>
        </div>

        {/* Probability Gauge */}
        <div className="flex justify-center mb-6">
          <ProbabilityGauge probability={insight.prob} size="sm" />
        </div>

        {/* Drivers */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Key Drivers</h4>
          <ul className="space-y-1">
            {insight.drivers.map((driver, index) => (
              <li key={index} className="flex items-start">
                <span className="text-indigo-500 mr-2">•</span>
                <span className="text-gray-700">{driver}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Rationale */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Rationale</h4>
          <p className="text-gray-700 leading-relaxed">{insight.rationale}</p>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Model:</span>
            <span className="ml-2 font-mono">{insight.model}</span>
          </div>
          <div>
            <span className="text-gray-600">Generated:</span>
            <span className="ml-2">{timeAgo(insight.ts)} ({formatTs(insight.ts)})</span>
          </div>
          {insight.ref && (
            <div>
              <span className="text-gray-600">Referral:</span>
              <span className="ml-2 font-mono text-xs">{insight.ref}</span>
            </div>
          )}
          {insight.creatorId && (
            <div>
              <span className="text-gray-600">Creator:</span>
              <span className="ml-2 font-mono text-xs">{insight.creatorId}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Link
          href={`/i/${signature}`}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
          aria-label="Open public page"
        >
          🔗 Public Page
        </Link>
        
        <button
          onClick={handleCopyPublicLink}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          aria-label="Copy public link"
        >
          📋 Copy Link
        </button>
        
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          aria-label="Open in Solana Explorer"
        >
          🔗 Explorer
        </a>
        
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          aria-label="Share on X"
        >
          � Share on X
        </button>
        
        <button
          onClick={handleCopyJSON}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
          aria-label="Copy JSON"
        >
          � Copy JSON
        </button>
      </div>

      {/* Secondary Navigation */}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
        <a
          href="/studio"
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          ← Back to Studio
        </a>
        <a
          href="/feed"
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          View community feed
        </a>
      </div>
    </div>
  );
}
