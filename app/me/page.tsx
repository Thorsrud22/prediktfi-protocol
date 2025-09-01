"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

type Bet = {
  wallet: string;
  signature: string;
  marketId: string;
  side: "YES"|"NO";
  amount: number;
  ts: number;
};

const MOCK_KEY = "predikt:mock-bets";

export default function PortfolioPage() {
  const { publicKey, connected } = useWallet();
  const [items, setItems] = useState<Bet[]>([]);
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

  if (!connected && process.env.NEXT_PUBLIC_MOCK_TX !== "1") {
    return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-4 text-[color:var(--text)]">Your predictions</h1>
      <p className="text-[color:var(--muted)]">Connect your wallet to see your receipts.</p>
    </main>;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6 text-[color:var(--text)]">Your predictions</h1>
      {items.length === 0 ? (
        <p className="text-[color:var(--muted)]">No predictions yet.</p>
      ) : (
        <div className="grid gap-4">
          {items.map((b) => (
            <div key={b.signature} className="rounded-xl border border-[var(--border)] bg-[color:var(--surface)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[color:var(--muted)]">
                    Market: {b.marketId} • {new Date(b.ts).toLocaleString()}
                  </div>
                  <div className="text-lg text-[color:var(--text)]">
                    <span className={b.side === "YES" ? "text-emerald-400" : "text-rose-400"}>{b.side}</span>
                    {" "}— {b.amount} SOL
                  </div>
                </div>
                <Link
                  href={`https://explorer.solana.com/tx/${b.signature}?cluster=devnet`}
                  className="text-[color:var(--accent)] underline-offset-2 hover:underline"
                >
                  Explorer
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
