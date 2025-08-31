"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { getMarketById } from "../../lib/markets";
import { useToast } from "../../components/ToastProvider";
import { getExplorerTxUrl } from "../../lib/solana";
import { LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js";

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

  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { addToast, updateToast } = useToast();
  const [betAmount, setBetAmount] = useState("");
  const [betSide, setBetSide] = useState<"yes" | "no" | null>(null);
  const [pending, setPending] = useState(false);
  const [balanceLamports, setBalanceLamports] = useState<number | null>(null);

  // Fetch wallet balance when connected/publicKey changes
  useEffect(() => {
    let cancelled = false;
    async function fetchBalance() {
      if (!publicKey) {
        setBalanceLamports(null);
        return;
      }
      try {
        const lamports = await connection.getBalance(publicKey);
        if (!cancelled) setBalanceLamports(lamports);
      } catch (e) {
        if (!cancelled) setBalanceLamports(null);
      }
    }
    fetchBalance();
    return () => {
      cancelled = true;
    };
  }, [publicKey, connection]);

  const balanceSol =
    balanceLamports != null ? balanceLamports / LAMPORTS_PER_SOL : null;

  const exceedsBalance = useMemo(() => {
    if (balanceSol == null) return false;
    const s = betAmount.trim();
    if (!s) return false;
    const n = Number(s);
    if (!Number.isFinite(n)) return false;
    return n > balanceSol + 1e-12;
  }, [betAmount, balanceSol]);

  const amountError: string | null = useMemo(() => {
    const s = betAmount.trim();
    if (!s) return "Enter an amount";
    // Prevent scientific notation and invalid characters by relying on parsing and decimal check
    const n = Number(s);
    if (!Number.isFinite(n)) return "Enter a valid number";
    if (n < 0.01) return "Minimum is 0.01 SOL";
    const parts = s.split(".");
    if (parts[1] && parts[1].length > 9) return "Max 9 decimals";
    if (balanceSol != null && n > balanceSol + 1e-12)
      return `Exceeds balance (${balanceSol
        .toFixed(9)
        .replace(/0+$/, "")
        .replace(/\.$/, "")} SOL)`;
    return null;
  }, [betAmount, balanceSol]);

  const handlePlaceBet = async () => {
    if (!connected || !betAmount || !betSide) {
      addToast({
        title: "Action needed",
        description: !connected
          ? "Connect your wallet to place a bet."
          : !betSide
          ? "Choose side before placing a bet."
          : "Enter a valid amount before placing a bet.",
        variant: "info",
        duration: 4000,
      });
      return;
    }
    if (amountError) return; // Should be disabled already
    setPending(true);
    // Loading toast
    const toastId = addToast({
      title: "Sending transaction",
      loading: true,
      duration: 0,
    });

    try {
      // Placeholder demo tx: a no-op transfer of 0 SOL to self, replace with program call
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey!,
          toPubkey: publicKey!,
          lamports: 0,
        })
      );
      const signature = await sendTransaction(tx, connection);

      const link = getExplorerTxUrl(signature, "devnet");
      updateToast(toastId, {
        title: "Bet placed",
        description: `Placed ${betAmount} SOL on ${betSide.toUpperCase()}.`,
        variant: "success",
        loading: false,
        linkLabel: link ? "View on Explorer" : undefined,
        linkHref: link,
        duration: 3000,
      });
    } catch (e) {
      updateToast(toastId, {
        title: "Transaction failed",
        variant: "error",
        loading: false,
        duration: 3000,
      });
    }
    setPending(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0a0e1a 0%, #1a2332 50%, #0a0e1a 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          padding: "1rem 2rem",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <a href="/" style={{ textDecoration: "none" }}>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              background: "linear-gradient(90deg, #00d4ff, #0ea5e9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0,
            }}
          >
            PrediktFi
          </h1>
        </a>
        <WalletMultiButton />
      </header>

      <main style={{ padding: "2rem", maxWidth: 1000, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.75rem",
          }}
        >
          <h2 style={{ fontSize: "2rem", margin: 0 }}>{market.title}</h2>
          <span
            aria-hidden={!connected}
            style={{
              fontSize: "0.8rem",
              padding: "0.15rem 0.5rem",
              borderRadius: "9999px",
              background: "rgba(16,185,129,0.25)",
              border: "1px solid rgba(16,185,129,0.6)",
              color: "#ffffff",
              fontWeight: 700,
              letterSpacing: 0.2,
              opacity: connected ? 1 : 0,
              transform: connected ? "translateY(0)" : "translateY(-2px)",
              pointerEvents: "none",
              transition: "opacity 140ms ease, transform 140ms ease",
              willChange: "opacity, transform",
            }}
          >
            Connected
          </span>
        </div>
        <p style={{ opacity: 0.8, marginBottom: "1rem" }}>
          {market.description}
        </p>
        <div style={{ fontSize: "0.9rem", opacity: 0.7, marginBottom: "2rem" }}>
          Volume: {market.totalVolume.toLocaleString()} SOL • Ends:{" "}
          {market.endDate}
        </div>

        {/* Betting Panel */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            padding: "2rem",
            borderRadius: "1rem",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            maxWidth: 520,
          }}
        >
          <h3 style={{ marginBottom: "1rem" }}>🎲 Place Your Bet</h3>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  background: "rgba(16, 185, 129, 0.2)",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                }}
              >
                <div style={{ fontWeight: "bold", color: "#10b981" }}>YES</div>
                <div style={{ fontSize: "1.1rem" }}>
                  ${market.yesPrice.toFixed(2)}
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  background: "rgba(244, 63, 94, 0.2)",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(244, 63, 94, 0.4)",
                }}
              >
                <div style={{ fontWeight: "bold", color: "#f43f5e" }}>NO</div>
                <div style={{ fontSize: "1.1rem" }}>
                  ${market.noPrice.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
            Choose Side:
          </label>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <button
              onClick={() => setBetSide("yes")}
              style={{
                flex: 1,
                padding: "0.75rem",
                borderRadius: 8,
                border:
                  betSide === "yes"
                    ? "2px solid #10b981"
                    : "1px solid rgba(16,185,129,0.4)",
                background:
                  betSide === "yes"
                    ? "rgba(16,185,129,0.3)"
                    : "rgba(16,185,129,0.1)",
                color: "#10b981",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              YES ${market.yesPrice.toFixed(2)}
            </button>
            <button
              onClick={() => setBetSide("no")}
              style={{
                flex: 1,
                padding: "0.75rem",
                borderRadius: 8,
                border:
                  betSide === "no"
                    ? "2px solid #f43f5e"
                    : "1px solid rgba(244,63,94,0.4)",
                background:
                  betSide === "no"
                    ? "rgba(244,63,94,0.3)"
                    : "rgba(244,63,94,0.1)",
                color: "#f43f5e",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              NO ${market.noPrice.toFixed(2)}
            </button>
          </div>

          <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
            Bet Amount (SOL){" "}
            {balanceSol != null && (
              <span style={{ fontWeight: 400, opacity: 0.8 }}>
                • Balance:{" "}
                {balanceSol.toFixed(9).replace(/0+$/, "").replace(/\.$/, "")}{" "}
                SOL
              </span>
            )}
          </label>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            placeholder="0.1"
            step="0.000000001"
            min="0.01"
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: 8,
              border: amountError
                ? "1px solid rgba(244,63,94,0.7)"
                : "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.05)",
              color: exceedsBalance ? "rgba(255,255,255,0.55)" : "white",
              fontSize: "1rem",
              marginBottom: 16,
            }}
          />
          {amountError && (
            <div
              style={{
                color: "#f87171",
                fontSize: "0.9rem",
                marginTop: -8,
                marginBottom: 16,
              }}
            >
              {amountError}
            </div>
          )}

          <button
            onClick={handlePlaceBet}
            disabled={!betAmount || !betSide || pending || !!amountError}
            style={{
              width: "100%",
              padding: "1rem",
              borderRadius: 8,
              border: "none",
              background:
                !betAmount || !betSide || pending || !!amountError
                  ? "rgba(255,255,255,0.1)"
                  : "linear-gradient(90deg, #0ea5e9, #0891b2)",
              color:
                !betAmount || !betSide || pending || !!amountError
                  ? "rgba(255,255,255,0.5)"
                  : "white",
              fontSize: "1.1rem",
              fontWeight: 700,
              cursor:
                !betAmount || !betSide || pending || !!amountError
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              {pending && (
                <span
                  aria-hidden="true"
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.35)",
                    borderTopColor: "#ffffff",
                    display: "inline-block",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              )}
              {!betAmount || !betSide
                ? "Select Side & Amount"
                : pending
                ? "Processing..."
                : `Place ${betAmount} SOL Bet`}
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}
