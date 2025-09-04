"use client";

import { useState, memo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import ProbabilityGauge from "./ProbabilityGauge";
import { type Insight, type PredictResponse } from "../../lib/ai/types";
import { timeAgo, formatHorizon } from "../../lib/time";
import { useToast } from "../ToastProvider";
import { buildShareUrl, buildXShareUrl } from "../../lib/share";

interface InsightPreviewProps {
  input: {
    topic: string;
    question: string;
    horizon: string;
    scenarioId?: string;
  };
  response: PredictResponse;
  onNewInsight: () => void;
}

function InsightPreview({ input, response, onNewInsight }: InsightPreviewProps) {
  const [logPending, setLogPending] = useState(false);
  const [driversExpanded, setDriversExpanded] = useState(false);
  const [rationaleExpanded, setRationaleExpanded] = useState(false);
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { addToast, updateToast } = useToast();

  // Create full insight object
  const insight: Insight = {
    kind: "insight",
    topic: input.topic,
    question: input.question,
    horizon: input.horizon,
    prob: response.prob,
    drivers: response.drivers,
    rationale: response.rationale,
    model: response.model,
    scenarioId: response.scenarioId,
    ts: response.ts,
  };

  // Add attribution if available
  if (typeof window !== "undefined") {
    const ref = localStorage.getItem("predikt:ref");
    const creatorId = localStorage.getItem("predikt:creatorId");
    if (ref) insight.ref = ref;
    if (creatorId) insight.creatorId = creatorId;
  }

  // Save to localStorage insights feed
  const saveToFeed = () => {
    if (typeof window === "undefined") return;
    
    try {
      const existing = localStorage.getItem("predikt:insights");
      const insights = existing ? JSON.parse(existing) : [];
      
      // Add signature if it doesn't exist (for local insights)
      const insightToSave = { ...insight };
      
      insights.unshift(insightToSave); // Add to beginning
      
      // Keep only last 5
      if (insights.length > 5) {
        insights.splice(5);
      }
      
      localStorage.setItem("predikt:insights", JSON.stringify(insights));
    } catch (error) {
      console.warn("Failed to save insight to feed:", error);
    }
  };

  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(insight, null, 2));
      addToast({
        title: "Copied to clipboard",
        description: "Insight JSON copied successfully",
        variant: "success",
        duration: 2000,
      });
    } catch (error) {
      addToast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "error",
        duration: 3000,
      });
    }
  };

  const handleShareX = () => {
    const shareUrl = buildXShareUrl({
      question: input.question,
      prob: response.prob,
    });
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = buildShareUrl('/studio');
      await navigator.clipboard.writeText(shareUrl);
      addToast({
        title: "Link copied",
        description: "Share link copied to clipboard",
        variant: "success",
        duration: 2000,
      });
    } catch (error) {
      addToast({
        title: "Copy failed",
        description: "Could not copy link",
        variant: "error",
        duration: 3000,
      });
    }
  };

  const handleLogOnChain = async () => {
    if (!publicKey) {
      addToast({
        title: "Wallet not connected",
        description: "Please connect your wallet to log insights on-chain",
        variant: "error",
        duration: 5000,
      });
      return;
    }

    setLogPending(true);
    const tid = addToast({
      loading: true,
      title: "Logging insight on-chain...",
      description: "Preparing transaction",
    });

    try {
      // Create form data for server action
      const formData = new FormData();
      formData.append("topic", insight.topic);
      formData.append("question", insight.question);
      formData.append("horizon", insight.horizon);
      formData.append("prob", insight.prob.toString());
      formData.append("drivers", JSON.stringify(insight.drivers));
      formData.append("rationale", insight.rationale);
      formData.append("model", insight.model);
      formData.append("scenarioId", insight.scenarioId);
      formData.append("walletPublicKey", publicKey.toBase58());
      formData.append("ref", insight.ref || "");
      formData.append("creatorId", insight.creatorId || "");

      // Import and call server action
      const { logInsightReal } = await import("../../lib/insights/submit");
      const result = await logInsightReal(formData);

      if (!result.success || !result.transaction) {
        throw new Error(result.error || "Transaction failed");
      }

      // Deserialize transaction
      const transactionBuffer = Buffer.from(result.transaction, "base64");
      const tx = Transaction.from(transactionBuffer);

      // Send transaction using wallet adapter
      const signature = await sendTransaction(tx, connection);

      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");

      // Save to feed (even if not logged on-chain before)
      saveToFeed();

      updateToast(tid, {
        loading: false,
        variant: "success",
        title: "Insight logged on-chain",
        description: "Redirecting to your insights...",
        duration: 3000,
      });

      // Redirect to my insights with signature
      setTimeout(() => {
        window.location.href = `/me?sig=${signature}`;
      }, 1000);
    } catch (error) {
      updateToast(tid, {
        loading: false,
        variant: "error",
        title: "Failed to log insight",
        description: error instanceof Error ? error.message : "Unknown error",
        duration: 5000,
      });
    } finally {
      setLogPending(false);
    }
  };

  return (
    <div className="bg-[color:var(--surface)] rounded-[var(--radius)] shadow-sm border border-[var(--border)] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[color:var(--text)]">Insight Preview</h2>
        <button
          onClick={onNewInsight}
          className="text-sm text-[color:var(--primary)] hover:text-[color:var(--primary)]/80 font-medium transition-colors"
        >
          New Insight
        </button>
      </div>

      <div className="space-y-6">
        {/* Question and metadata */}
        <div>
          <h3 className="text-lg font-medium text-[color:var(--text)] mb-3 leading-tight">
            {input.question}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[color:var(--muted)]">
            <span className="bg-[color:var(--surface-2)] text-[color:var(--text)] px-2 py-1 rounded-md font-medium capitalize">
              {input.topic}
            </span>
            <span>•</span>
            <span>{formatHorizon(input.horizon)}</span>
            <span>•</span>
            <span>{timeAgo(response.ts)}</span>
          </div>
        </div>

        {/* Probability Gauge */}
        <div className="flex justify-center py-4">
          <ProbabilityGauge probability={response.prob} size="lg" />
        </div>

        {/* Drivers Section */}
        {response.drivers && response.drivers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-[color:var(--text)] flex items-center">
                🎯 Key Drivers
              </h4>
              <button
                onClick={() => setDriversExpanded(!driversExpanded)}
                className="text-sm text-[color:var(--primary)] hover:text-[color:var(--primary)]/80 transition-colors"
              >
                {driversExpanded ? 'Show less' : 'Show all'}
              </button>
            </div>
            <div className="bg-[color:var(--surface-2)] rounded-lg p-4">
              <ul className="space-y-2">
                {(driversExpanded ? response.drivers : response.drivers.slice(0, 3)).map((driver, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-[color:var(--primary)] mr-3 mt-0.5">•</span>
                    <span className="text-[color:var(--text)] leading-relaxed">{driver}</span>
                  </li>
                ))}
              </ul>
              {!driversExpanded && response.drivers.length > 3 && (
                <p className="text-xs text-[color:var(--muted)] mt-2">
                  +{response.drivers.length - 3} more drivers
                </p>
              )}
            </div>
          </div>
        )}

        {/* Rationale Section */}
        {response.rationale && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-[color:var(--text)] flex items-center">
                💭 Rationale
              </h4>
              {response.rationale.length > 200 && (
                <button
                  onClick={() => setRationaleExpanded(!rationaleExpanded)}
                  className="text-sm text-[color:var(--primary)] hover:text-[color:var(--primary)]/80 transition-colors"
                >
                  {rationaleExpanded ? 'Show less' : 'Show all'}
                </button>
              )}
            </div>
            <div className="bg-[color:var(--surface-2)] rounded-lg p-4">
              <p className="text-[color:var(--text)] leading-relaxed">
                {rationaleExpanded || response.rationale.length <= 200 
                  ? response.rationale 
                  : `${response.rationale.slice(0, 200)}...`
                }
              </p>
            </div>
          </div>
        )}

        {/* Technical details - collapsible */}
        <details className="bg-[color:var(--surface-2)] border border-[var(--border)] rounded-lg">
          <summary className="p-4 cursor-pointer hover:bg-[color:var(--surface)]/50 transition-colors">
            <span className="font-medium text-[color:var(--text)]">Technical Details</span>
          </summary>
          <div className="px-4 pb-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-[color:var(--muted)]">Model:</span>
              <span className="font-mono text-[color:var(--text)]">{response.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[color:var(--muted)]">Generated:</span>
              <span className="text-[color:var(--text)]">{new Date(response.ts).toLocaleString()}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[color:var(--muted)]">Scenario ID:</span>
              <span className="font-mono text-xs text-[color:var(--text)] break-all">
                {response.scenarioId}
              </span>
            </div>
          </div>
        </details>

        {/* Call to action */}
        <div className="bg-[color:var(--surface-2)] border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div>
              <p className="text-sm text-[color:var(--text)] font-medium mb-1">
                Ready to make it official?
              </p>
              <p className="text-sm text-[color:var(--muted)]">
                Log on-chain for verifiable, shareable insights with permanent timestamps.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={handleCopyJSON}
            className="flex items-center justify-center gap-2 bg-[color:var(--surface-2)] hover:bg-[color:var(--surface)] border border-[var(--border)] text-[color:var(--text)] font-medium py-2.5 px-3 rounded-lg transition-colors text-sm"
          >
            📋 Copy JSON
          </button>
          
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 bg-[color:var(--surface-2)] hover:bg-[color:var(--surface)] border border-[var(--border)] text-[color:var(--text)] font-medium py-2.5 px-3 rounded-lg transition-colors text-sm"
          >
            🔗 Copy Link
          </button>
          
          <button
            onClick={handleShareX}
            className="flex items-center justify-center gap-2 bg-[color:var(--surface-2)] hover:bg-[color:var(--surface)] border border-[var(--border)] text-[color:var(--text)] font-medium py-2.5 px-3 rounded-lg transition-colors text-sm"
          >
            🐦 Share
          </button>
          
          <button
            onClick={handleLogOnChain}
            disabled={logPending || !publicKey}
            className="flex items-center justify-center gap-2 bg-[color:var(--primary)] hover:bg-[color:var(--primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-3 rounded-lg transition-colors text-sm col-span-2 lg:col-span-1"
          >
            {logPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Logging...
              </>
            ) : (
              <>
                ⛓️ Log On-Chain
              </>
            )}
          </button>
        </div>
        
        {!publicKey && (
          <div className="text-center">
            <p className="text-sm text-[color:var(--muted)]">
              Connect your wallet to log insights on-chain
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(InsightPreview);
