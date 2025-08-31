"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import Card from "../../components/Card";
import Segmented from "../../components/Segmented";
import PricePill from "../../components/PricePill";
import Stat from "../../components/Stat";
import Skeleton from "../../components/Skeleton";
import { useToast } from "../../components/ToastProvider";
import { getMarketById } from "../../lib/markets";
import { env } from "../../lib/env";
import {
  buildExplorerTxUrl,
  formatLamportsToSol,
  sendSolWithMemo,
  solToLamports,
} from "../../lib/solana";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

export default function MarketDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const market = useMemo(() => (id ? getMarketById(id) : undefined), [id]);
  if (!market) return notFound();

  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const { addToast, updateToast } = useToast();

  const [betSide, setBetSide] = useState<"yes" | "no" | null>(null);
  const [betAmount, setBetAmount] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [balanceLamports, setBalanceLamports] = useState<number | null>(null);

  // Load wallet balance
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!publicKey) {
        setBalanceLamports(null);
        return;
      }
      try {
        const v = await connection.getBalance(publicKey);
        if (!cancelled) setBalanceLamports(v);
      } catch {
        if (!cancelled) setBalanceLamports(null);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [connection, publicKey]);

  const balanceSol =
    balanceLamports != null ? balanceLamports / LAMPORTS_PER_SOL : null;

  const parsedAmount = useMemo(() => {
    const s = betAmount.trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }, [betAmount]);

  const amountError = useMemo((): string | null => {
    const s = betAmount.trim();
    if (!s) return "Enter an amount";
    const n = Number(s);
    if (!Number.isFinite(n)) return "Enter a valid number";
    if (n < 0.01) return "Minimum is 0.01 SOL";
    const parts = s.split(".");
    if (parts[1] && parts[1].length > 9) return "Max 9 decimals";
    if (balanceSol != null && n > balanceSol + 1e-12)
      return "Insufficient balance";
    return null;
  }, [betAmount, balanceSol]);

  const feeNetStr = useMemo(() => {
    if (parsedAmount == null) return null;
    try {
      const lamports = solToLamports(parsedAmount);
      const feeLamports = (lamports * BigInt(env.feeBps)) / 10_000n;
      const netLamports = lamports - feeLamports;
      return {
        fee: formatLamportsToSol(feeLamports),
        net: formatLamportsToSol(netLamports),
      };
    } catch {
      return null;
    }
  }, [parsedAmount]);

  async function handlePlaceBet() {
    if (!market) {
      addToast({ variant: "error", title: "Market unavailable" });
      return;
    }
    if (!connected || !publicKey) {
      addToast({ variant: "error", title: "Connect wallet to bet" });
      return;
    }
    if (!betSide) {
      addToast({ variant: "error", title: "Choose a side" });
      return;
    }
    if (amountError) {
      addToast({ variant: "error", title: amountError });
      return;
    }
    const n = parsedAmount ?? 0;
    if (n <= 0) return;
    if (!env.protocolTreasury) {
      addToast({ variant: "error", title: "Treasury not configured" });
      return;
    }

    const memo = `market:${market.id}|side:${betSide}|amount:${n}`;
    const tid = addToast({ title: "Placing bet…", loading: true, duration: 0 });
    setPending(true);
    try {
      let signature: string;
      if (env.mockTx) {
        // Simulate network
        await new Promise((r) => setTimeout(r, 800));
        signature = `MOCK_${Date.now()}`;
      } else {
        signature = await sendSolWithMemo({
          connection,
          wallet: { publicKey, sendTransaction },
          treasury: env.protocolTreasury,
          amountSol: n,
          memo,
        });
      }
      const url = buildExplorerTxUrl(env.cluster, signature);
      updateToast(tid, {
        loading: false,
        variant: "success",
        title: "Bet placed",
        description:
          `Your ${betSide.toUpperCase()} bet of ${n} SOL was sent` as string,
        linkLabel: "View on Explorer",
        linkHref: url,
        duration: 5000,
      });
      setBetAmount("");
      setBetSide(null);
    } catch (e: any) {
      updateToast(tid, {
        loading: false,
        variant: "error",
        title: "Transaction failed",
        description: e?.message || String(e),
        duration: 6000,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-[color:var(--text)]">
          {market.title}
        </h1>
        <p className="mt-1 text-[color:var(--muted)]">{market.description}</p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Bet panel */}
        <section className="md:col-span-8">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-[color:var(--text)]">
              Place your bet
            </h2>

            {/* Current prices */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <PricePill
                label="YES"
                price={`$${market.yesPrice.toFixed(2)}`}
                trend="up"
              />
              <PricePill
                label="NO"
                price={`$${market.noPrice.toFixed(2)}`}
                trend="down"
              />
            </div>

            <label className="mb-2 block text-sm font-semibold text-[color:var(--text)]">
              Choose side
            </label>
            <div className="mb-4">
              <Segmented
                value={betSide}
                onChange={setBetSide}
                disabled={pending}
              />
            </div>

            <label className="mb-2 block text-sm font-semibold text-[color:var(--text)]">
              Bet Amount (SOL)
              {balanceSol != null && (
                <span className="ml-1 font-normal text-[color:var(--muted)]">
                  • Balance:{" "}
                  {balanceSol.toFixed(9).replace(/0+$/, "").replace(/\.$/, "")}{" "}
                  SOL
                </span>
              )}
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="0.10"
              step="0.000000001"
              min={0.01}
              className={`w-full rounded-[var(--radius)] border bg-[color:var(--surface-2)] px-4 py-2 text-[color:var(--text)] outline-none focus-visible:ring-2 ${
                amountError ? "border-red-400" : "border-[var(--border)]"
              }`}
            />
            {amountError && (
              <div className="mt-2 text-sm text-red-400">{amountError}</div>
            )}

            <div className="mt-3 text-sm text-[color:var(--muted)]">
              Fee {env.feeBps} bps.
              {feeNetStr && (
                <>
                  {" "}
                  Fee {feeNetStr.fee} • Net {feeNetStr.net}
                </>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <WalletMultiButton className="!rounded-full !bg-[color:var(--surface)] !text-[color:var(--text)] !border !border-[var(--border)] !px-4 !py-2 hover:!bg-[color:var(--surface-2)]" />
              <button
                onClick={handlePlaceBet}
                disabled={
                  !betAmount ||
                  !betSide ||
                  pending ||
                  !!amountError ||
                  !connected
                }
                className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-black shadow-token focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending && (
                  <span
                    aria-hidden
                    className="h-4 w-4 animate-spin rounded-full border-2 border-black/40 border-t-black"
                  />
                )}
                {!connected
                  ? "Connect wallet"
                  : !betAmount || !betSide
                  ? "Select side & amount"
                  : pending
                  ? "Processing..."
                  : `Place ${betAmount} SOL bet`}
              </button>
            </div>
          </Card>
        </section>

        {/* Market stats */}
        <aside className="md:col-span-4">
          <Card>
            <div className="grid grid-cols-1 gap-3">
              <Stat label="Cluster" value={env.cluster} />
              <Stat label="Ends" value={market.endDate} />
              <Stat
                label="Volume"
                value={`${market.totalVolume.toLocaleString()} SOL`}
              />
              <Stat
                label="Wallet Balance"
                value={
                  balanceLamports == null
                    ? "—"
                    : `${(balanceLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL`
                }
              />
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
