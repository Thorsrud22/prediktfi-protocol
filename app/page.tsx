"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { markets } from "./lib/markets";
import Hero from "./components/Hero";

// Render wallet button only on the client to prevent hydration mismatches
const WalletMultiButtonDynamic = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

// Markets are now imported from app/lib/markets

export default function Home() {
  const { connected, publicKey } = useWallet();

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
      {/* Header */}
      <header
        style={{
          padding: "1rem 2rem",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            background: "linear-gradient(90deg, #00d4ff, #0ea5e9)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0,
          }}
        >
          PrediktFi
        </h1>
        <WalletMultiButtonDynamic />
      </header>

      <main style={{ padding: "2rem" }}>
        {/* Hero section (static, non-breaking) */}
        <Hero />
        {!connected ? (
          // Welcome Screen
          <div style={{ textAlign: "center", paddingTop: "4rem" }}>
            <h2 style={{ fontSize: "3rem", marginBottom: "1rem" }}>
              Welcome to PrediktFi
            </h2>
            <p
              style={{
                fontSize: "1.2rem",
                maxWidth: "600px",
                margin: "0 auto 2rem",
                opacity: 0.8,
              }}
            >
              Connect your Phantom wallet to start trading prediction markets on
              Solana
            </p>
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                padding: "2rem",
                borderRadius: "1rem",
                maxWidth: "500px",
                margin: "0 auto",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <h3 style={{ marginBottom: "1rem" }}>🚀 Get Started:</h3>
              <ol style={{ textAlign: "left", lineHeight: "1.8" }}>
                <li>Connect your Phantom wallet</li>
                <li>Browse prediction markets</li>
                <li>Place your bets on outcomes</li>
                <li>Earn rewards for correct predictions</li>
              </ol>
            </div>
          </div>
        ) : (
          // Main App: catalog only
          <div>
            <div
              style={{
                marginBottom: "2rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <h2 style={{ fontSize: "2rem", margin: 0 }}>🎯 Active Markets</h2>
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

            {/* Markets Grid */}
            {markets.length === 0 ? (
              <div
                role="status"
                aria-live="polite"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "1rem",
                  padding: "2rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "1.25rem", marginBottom: 8 }}>
                  No markets available
                </div>
                <div style={{ opacity: 0.8 }}>
                  Check back later or create a new market.
                </div>
              </div>
            ) : (
              <div className="markets-grid" style={{ marginBottom: "2rem" }}>
                {markets.map((market) => (
                  <Link
                    key={market.id}
                    href={`/market/${market.id}`}
                    className="market-card"
                    aria-labelledby={`market-title-${market.id}`}
                    aria-describedby={`market-desc-${market.id}`}
                  >
                    <h3
                      id={`market-title-${market.id}`}
                      style={{
                        fontSize: "1.2rem",
                        marginBottom: "0.75rem",
                        color: "#ffffff",
                        minHeight: 44, // touch target for heading area
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {market.title}
                    </h3>
                    <p
                      id={`market-desc-${market.id}`}
                      style={{
                        opacity: 0.7,
                        marginBottom: "1rem",
                        fontSize: "0.95rem",
                        minHeight: 44, // ensure paragraph click area tall enough
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {market.description}
                    </p>

                    <div
                      style={{
                        fontSize: "0.9rem",
                        opacity: 0.7,
                        minHeight: 44, // touch target for footer row
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      Volume: {market.totalVolume.toLocaleString()} SOL • Ends:{" "}
                      {""}
                      {market.endDate}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
