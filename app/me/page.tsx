"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { verifyBetTransaction, getExplorerUrl } from "../lib/solana";

type Bet = {
  wallet: string;
  signature: string;
  marketId: string;
  side: "YES"|"NO";
  amount: number;
  ts: number;
  verified?: boolean;
  verificationError?: string;
};

const MOCK_KEY = "predikt:mock-bets";

export default function PortfolioPage() {
  const { publicKey, connected } = useWallet();
  const [items, setItems] = useState<Bet[]>([]);
  const [verifying, setVerifying] = useState<Set<string>>(new Set());
  const base58 = publicKey?.toBase58();

  useEffect(() => {
    async function load() {
      if (process.env.NEXT_PUBLIC_MOCK_TX === "1") {
        const raw = localStorage.getItem(MOCK_KEY);
        const arr = raw ? (JSON.parse(raw) as Bet[]) : [];
        setItems(arr.filter(b => !base58 || b.wallet === base58));
      } else if (base58) {
        const res = await fetch(`/api/bets?wallet=${base58}`).then(r=>r.json());
        setItems(res.items || []);
      }
    }
    load();
  }, [base58]);

  const handleVerify = async (signature: string) => {
    setVerifying(prev => new Set(prev).add(signature));
    
    try {
      const result = await verifyBetTransaction(signature);
      setItems(prev => prev.map(bet => 
        bet.signature === signature 
          ? { ...bet, verified: result.ok, verificationError: result.error }
          : bet
      ));
    } catch (error) {
      setItems(prev => prev.map(bet => 
        bet.signature === signature 
          ? { ...bet, verified: false, verificationError: "VERIFY_FAILED" }
          : bet
      ));
    } finally {
      setVerifying(prev => {
        const next = new Set(prev);
        next.delete(signature);
        return next;
      });
    }
  };

  if (!connected && process.env.NEXT_PUBLIC_MOCK_TX !== "1") {
    return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-4 text-[color:var(--text)]">Your predictions</h1>
      <p className="text-[color:var(--muted)]">Connect your wallet to see your receipts.</p>
    </main>;
  }

  const isMockMode = process.env.NEXT_PUBLIC_MOCK_TX === "1";

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[color:var(--text)]">Your predictions</h1>
        {!isMockMode && (
          <div className="text-sm px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            Real Mode
          </div>
        )}
        {isMockMode && (
          <div className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Mock Mode
          </div>
        )}
      </div>
      
      {items.length === 0 ? (
        <p className="text-[color:var(--muted)]">No predictions yet.</p>
      ) : (
        <div className="grid gap-4">
          {items.map((b) => (
            <div key={b.signature} className="rounded-xl border border-[var(--border)] bg-[color:var(--surface)] p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm text-[color:var(--muted)] mb-1">
                    Market: {b.marketId} • {new Date(b.ts).toLocaleString()}
                  </div>
                  <div className="text-lg text-[color:var(--text)] mb-2">
                    <span className={b.side === "YES" ? "text-emerald-400" : "text-rose-400"}>{b.side}</span>
                    {" "}— {b.amount} SOL
                  </div>
                  
                  {/* Verification Status */}
                  {!isMockMode && (
                    <div className="flex items-center gap-2">
                      {b.verified === undefined ? (
                        <button
                          onClick={() => handleVerify(b.signature)}
                          disabled={verifying.has(b.signature)}
                          className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          {verifying.has(b.signature) ? "Verifying..." : "Verify"}
                        </button>
                      ) : b.verified ? (
                        <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
                          ✗ Failed ({b.verificationError})
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <Link
                  href={isMockMode ? "#" : getExplorerUrl(b.signature)}
                  className={`text-[color:var(--accent)] underline-offset-2 hover:underline ${isMockMode ? "opacity-50 pointer-events-none" : ""}`}
                  target={isMockMode ? undefined : "_blank"}
                  rel={isMockMode ? undefined : "noopener noreferrer"}
                >
                  {isMockMode ? "Mock TX" : "Explorer"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
