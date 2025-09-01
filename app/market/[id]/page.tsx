"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";

import Card from "../../components/Card";
import Segmented from "../../components/Segmented";
import PricePill from "../../components/PricePill";
import Stat from "../../components/Stat";
import Skeleton from "../../components/Skeleton";
import { useToast } from "../../components/ToastProvider";
import { ShareableMarketLink } from "../../components/ReferralTracker";
import { getMarketById } from "../../lib/markets";
import { env } from "../../lib/env";
import {
  buildExplorerTxUrl,
  formatLamportsToSol,
  solToLamports,
  placeBetMock,
  placeBetReal,
  isMock,
  MEMO_PROGRAM_ID,
} from "../../lib/solana";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

export default function MarketDetailPage() {
  const nf = new Intl.NumberFormat("en-US");
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const market = useMemo(() => (id ? getMarketById(id) : undefined), [id]);
  if (!market) return notFound();

  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction, wallet } = useWallet();
  const { addToast, updateToast } = useToast();

  // Read treasury from environment
  const treasuryPubkey = useMemo(() => {
    const treasury = process.env.NEXT_PUBLIC_TREASURY;
    return treasury ? new PublicKey(treasury) : null;
  }, []);

  const [betSide, setBetSide] = useState<"YES" | "NO" | null>(null);
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

  // Enhanced fee calculation with live updates and NaN protection
  const liveFeeNet = useMemo(() => {
    const amount = parsedAmount || 0;
    if (amount <= 0) {
      return { fee: "0.000", net: "0.000" };
    }
    
    const fee = amount * (env.feeBps / 10000);
    const net = amount - fee;
    
    return {
      fee: fee.toFixed(3),
      net: net.toFixed(3),
    };
  }, [parsedAmount]);

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

  // Dynamic CTA button text
  const ctaButtonText = useMemo(() => {
    if (!connected) return "Connect wallet";
    if (!betSide || !parsedAmount || parsedAmount <= 0) {
      return "Select side & amount";
    }
    return `Place ${parsedAmount} SOL on ${betSide}`;
  }, [connected, betSide, parsedAmount]);

  async function handlePlaceBet() {
    if (!market) {
      addToast({ variant: "error", title: "Market unavailable" });
      return;
    }
    
    const mockMode = isMock();
    
    // For real mode, ensure wallet is connected
    if (!mockMode && (!connected || !publicKey)) {
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

    const tid = addToast({ 
      title: "Placing bet…", 
      loading: true, 
      duration: 0 
    });
    setPending(true);

    try {
      let signature: string;
      
      if (mockMode) {
        // Mock mode: simulate transaction
        const result = await placeBetMock({
          marketId: market.id,
          side: betSide,
          amountSol: n
        });
        signature = result.signature;
        
        // Store mock bet in localStorage
        const mockBet = {
          wallet: "mock-wallet", // Mock wallet identifier
          signature,
          marketId: market.id,
          side: betSide,
          amount: n,
          ts: Date.now(),
        };
        
        const MOCK_KEY = "predikt:mock-bets";
        const existing = localStorage.getItem(MOCK_KEY);
        const bets = existing ? JSON.parse(existing) : [];
        bets.push(mockBet);
        localStorage.setItem(MOCK_KEY, JSON.stringify(bets));
        
        updateToast(tid, {
          loading: false,
          variant: "success",
          title: "Bet placed (simulated)",
          description: `Mock tx: ${signature}`,
          duration: 5000,
        });
      } else {
        // Real mode: send actual transaction
        if (!treasuryPubkey) {
          throw new Error("Treasury address not configured");
        }
        
        const { tx, memoData } = await placeBetReal({
          connection,
          wallet: wallet?.adapter!,
          treasury: treasuryPubkey,
          marketId: market.id,
          side: betSide,
          amountSol: n
        });
        
        // Send transaction using wallet adapter
        signature = await sendTransaction(tx, connection);
        
        // Wait for confirmation (optional, but good UX)
        await connection.confirmTransaction(signature, 'confirmed');
        
        // Parse memo data for API verification
        const expectedMemo = JSON.parse(memoData);
        
        // Store bet record via API
        try {
          await fetch("/api/bets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              signature,
              expectedMemo,
              wallet: publicKey!.toBase58()
            })
          });
        } catch (err) {
          console.warn("Failed to store bet record:", err);
        }
        
        const url = buildExplorerTxUrl(env.cluster, signature);
        updateToast(tid, {
          loading: false,
          variant: "success",
          title: "Bet placed",
          description: `Your ${betSide} bet of ${n} SOL was sent`,
          linkLabel: "View on Explorer",
          linkHref: url,
          duration: 5000,
        });
        
        // TODO: POST to /api/bets with { signature, expectedMemo: memoData }
        // This will be implemented in the next block
      }

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
        {/* Creator Attribution */}
        {market.creatorName && (
          <div className="flex items-center gap-3 mb-4">
            {market.creatorAvatar && (
              <img
                src={market.creatorAvatar}
                alt={market.creatorName}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div className="flex items-center gap-3">
              <div>
                <div className="text-sm text-[color:var(--text)] font-medium">
                  {market.creatorName}
                </div>
                <div className="text-xs text-[color:var(--muted)]">Market Creator</div>
              </div>
              {market.creatorType && (
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    market.creatorType === "KOL"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                      : market.creatorType === "EXPERT"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      : market.creatorType === "PREDIKT"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                  }`}
                >
                  {market.creatorType}
                </span>
              )}
            </div>
          </div>
        )}
        
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
                data-testid="outcome-group"
              />
            </div>

            <label htmlFor="bet-amount" className="mb-2 block text-sm font-semibold text-[color:var(--text)]">
              Bet Amount (SOL)
              {balanceSol != null && (
                <span className="ml-1 font-normal text-[color:var(--muted)]">
                  • Balance:{" "}
                  {balanceSol.toFixed(9).replace(/0+$/, "").replace(/\.$/, "")}{" "}
                  SOL
                  {env.cluster === "devnet" && (
                    <>
                      {" • "}
                      <a
                        href="https://faucet.solana.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 underline"
                      >
                        Get test SOL
                      </a>
                    </>
                  )}
                </span>
              )}
            </label>
            <input
              type="number"
              id="bet-amount"
              inputMode="decimal"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="0.10"
              step="0.000000001"
              min={0.01}
              aria-invalid={!!amountError || undefined}
              aria-describedby={amountError ? "bet-amount-error" : undefined}
              className={`w-full rounded-[var(--radius)] border bg-[color:var(--surface-2)] px-4 py-2 text-[color:var(--text)] outline-none focus-visible:ring-2 ${
                amountError ? "border-red-400" : "border-[var(--border)]"
              }`}
            />
            {amountError && (
              <div id="bet-amount-error" className="mt-2 text-sm text-rose-300">{amountError}</div>
            )}

            {/* Live fee calculation display */}
            <div className="mt-3 text-sm text-[color:var(--muted)]">
              Fee {env.feeBps} bps • Fee: {liveFeeNet.fee} SOL • Net: {liveFeeNet.net} SOL
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <WalletMultiButton className="!min-h-11 !rounded-full !bg-[color:var(--surface)] !text-[color:var(--text)] !border !border-[var(--border)] !px-4 !py-2 hover:!bg-[color:var(--surface-2)]" />
              <button
                onClick={handlePlaceBet}
                disabled={
                  !betSide ||
                  !parsedAmount ||
                  parsedAmount <= 0 ||
                  pending ||
                  !!amountError ||
                  (!isMock && !connected)
                }
                data-testid="place-bet"
                className="btn-primary min-w-[180px] px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending && (
                  <span
                    aria-hidden
                    className="h-4 w-4 animate-spin rounded-full border-2 border-black/40 border-t-black"
                  />
                )}
                {pending ? "Processing..." : ctaButtonText}
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
                value={`${nf.format(market.totalVolume)} SOL`}
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
          
          {/* Shareable referral link */}
          <div className="mt-4">
            <ShareableMarketLink marketId={market.id} creatorId={market.creatorId} />
          </div>
        </aside>
      </div>
    </div>
  );
}
