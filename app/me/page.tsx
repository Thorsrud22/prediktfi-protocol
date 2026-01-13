"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useConnection } from "@solana/wallet-adapter-react";
import { type Insight, type InsightErrorCode } from "../lib/ai/types";
import { CopyButton } from "../components/CopyButton";
import { useToast } from "../components/ToastProvider";
import Receipt from "../components/Receipt";
import { pushInsightLocal } from "../lib/local";
import IdeaHistory from "../components/IdeaHistory";

const ERROR_MESSAGES: Record<InsightErrorCode, string> = {
  "INVALID_SIGNATURE": "The transaction signature format is invalid",
  "NOT_FOUND": "Transaction not found on the blockchain",
  "NOT_CONFIRMED": "Transaction exists but is not yet confirmed",
  "NO_MEMO": "No memo instruction found in this transaction",
  "INVALID_MEMO": "Memo data is not valid JSON or missing required fields",
  "NOT_PREDIKT_INSIGHT": "This transaction is not a valid Predikt insight",
  "NETWORK_ERROR": "Unable to connect to Solana network",
};

interface VerificationState {
  status: "idle" | "verifying" | "verified" | "failed";
  error?: InsightErrorCode;
  insight?: Insight;
  slot?: number;
}

function InsightVerificationContent() {
  const searchParams = useSearchParams();
  const { connection } = useConnection();
  const { addToast } = useToast();

  const [verification, setVerification] = useState<VerificationState>({
    status: "idle"
  });

  const signature = searchParams.get("sig");

  const verifyInsight = useCallback(async (sig: string) => {
    setVerification({ status: "verifying" });

    try {
      const rpcUrl = connection.rpcEndpoint;
      const cluster = rpcUrl.includes("devnet") ? "devnet" : "mainnet-beta";

      const response = await fetch(`/api/insights?sig=${encodeURIComponent(sig)}&cluster=${cluster}`);

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = errorData.error || "NETWORK_ERROR";
        setVerification({
          status: "failed",
          error: errorCode as InsightErrorCode
        });
        return;
      }

      const data = await response.json();
      setVerification({
        status: "verified",
        insight: data.insight,
        slot: data.slot
      });

      // Save to local storage
      if (data.insight) {
        pushInsightLocal({ ...data.insight, signature: sig });
      }

      addToast({
        title: "Insight verified!",
        description: "Your on-chain insight was successfully verified",
        variant: "success",
        duration: 5000,
      });

    } catch (error) {
      console.error("Verification error:", error);
      setVerification({
        status: "failed",
        error: "NETWORK_ERROR"
      });
    }
  }, [connection.rpcEndpoint, addToast]);

  useEffect(() => {
    if (signature && verification.status === "idle") {
      verifyInsight(signature);
    }
  }, [signature, verification.status, verifyInsight]);

  if (!signature) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Insight Verification & Receipt</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">No signature provided</h2>
            <p className="text-gray-600 mb-6">
              To verify an insight, you need to provide a transaction signature in the URL.
            </p>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Example: <code className="bg-gray-100 px-2 py-1 rounded">/me?sig=YOUR_SIGNATURE_HERE</code>
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  href="/studio"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                >
                  ← Back to Studio
                </Link>
                <Link
                  href="/feed"
                  className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                >
                  View Community Feed
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verification.status === "verifying") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Insight Verification & Receipt</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Verifying insight...</h2>
            <p className="text-gray-600 mb-4">
              Checking the Solana blockchain for your transaction
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span>Signature:</span>
              <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">
                {signature.substring(0, 8)}...{signature.substring(-8)}
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verification.status === "failed") {
    const errorMessage = verification.error ? ERROR_MESSAGES[verification.error] : "Unknown error occurred";

    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Insight Verification & Receipt</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-red-600">❌</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Verification failed</h2>
            <p className="text-red-600 mb-6">{errorMessage}</p>

            <div className="bg-gray-50 rounded-md p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Signature:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-2 py-1 rounded font-mono text-xs border">
                    {signature.substring(0, 8)}...{signature.substring(-8)}
                  </code>
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
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => verifyInsight(signature)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                🔄 Try again
              </button>
              <Link
                href="/studio"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
              >
                ← Back to Studio
              </Link>
              <Link
                href="/feed"
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                View Community Feed
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verification.status === "verified" && verification.insight) {
    const insight = verification.insight;
    const rpcUrl = connection.rpcEndpoint;
    const cluster = rpcUrl.includes("devnet") ? "devnet" : "mainnet-beta";

    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Insight Verification & Receipt</h1>

        <Receipt
          insight={insight}
          signature={signature}
          slot={verification.slot}
          cluster={cluster}
        />
      </div>
    );
  }

  // Return default view with history if no signature
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile & History</h1>

      <IdeaHistory />
    </div>
  );
}

export default function InsightVerificationPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <InsightVerificationContent />
    </Suspense>
  );
}
