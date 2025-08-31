"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface Market {
  id: string;
  title: string;
  description: string;
  endDate: string;
  yesPrice: number;
  noPrice: number;
  totalVolume: number;
  isActive: boolean;
}

const mockMarkets: Market[] = [
  {
    id: "1",
    title: "Will SOL hit $300 by end of 2025?",
    description: "Solana (SOL) will reach $300 USD by December 31, 2025",
    endDate: "2025-12-31",
    yesPrice: 0.65,
    noPrice: 0.35,
    totalVolume: 15420,
    isActive: true,
  },
  {
    id: "2",
    title: "Will there be a new US President elected in 2028?",
    description: "A new person will be elected as US President in 2028",
    endDate: "2028-11-07",
    yesPrice: 0.95,
    noPrice: 0.05,
    totalVolume: 8930,
    isActive: true,
  },
  {
    id: "3",
    title: "Will Bitcoin ETF approval boost price above $100k?",
    description:
      "Bitcoin will reach above $100,000 within 6 months of major ETF approval",
    endDate: "2025-06-30",
    yesPrice: 0.42,
    noPrice: 0.58,
    totalVolume: 22100,
    isActive: true,
  },
];

export default function Home() {
  const { connected, publicKey } = useWallet();
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [betSide, setBetSide] = useState<"yes" | "no" | null>(null);

  const handlePlaceBet = () => {
    if (!connected || !selectedMarket || !betAmount || !betSide) {
      alert("Please connect wallet and select a market with bet amount");
      return;
    }

    // Here you would integrate with your Solana program
    alert(
      `Placing ${betAmount} SOL bet on ${betSide.toUpperCase()} for: ${
        selectedMarket.title
      }`
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0a0d1f 0%, #1a1d4b 50%, #0a0d1f 100%)",
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
            background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0,
          }}
        >
          PrediktFi
        </h1>
        <WalletMultiButton />
      </header>

      <div style={{ padding: "2rem" }}>
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
          // Main App
          <div>
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                🎯 Active Markets
              </h2>
              <p style={{ opacity: 0.7 }}>
                Connected: {publicKey?.toBase58().slice(0, 8)}...
                {publicKey?.toBase58().slice(-8)}
              </p>
            </div>

            {/* Markets Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
                gap: "1.5rem",
                marginBottom: "2rem",
              }}
            >
              {mockMarkets.map((market) => (
                <div
                  key={market.id}
                  onClick={() => setSelectedMarket(market)}
                  style={{
                    background:
                      selectedMarket?.id === market.id
                        ? "rgba(96, 165, 250, 0.2)"
                        : "rgba(255, 255, 255, 0.05)",
                    padding: "1.5rem",
                    borderRadius: "1rem",
                    border:
                      selectedMarket?.id === market.id
                        ? "2px solid #60a5fa"
                        : "1px solid rgba(255, 255, 255, 0.1)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.2rem",
                      marginBottom: "0.5rem",
                      color: "#ffffff",
                    }}
                  >
                    {market.title}
                  </h3>
                  <p
                    style={{
                      opacity: 0.7,
                      marginBottom: "1rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    {market.description}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "1rem",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          background: "rgba(34, 197, 94, 0.2)",
                          padding: "0.5rem 1rem",
                          borderRadius: "0.5rem",
                          border: "1px solid rgba(34, 197, 94, 0.3)",
                        }}
                      >
                        <div style={{ fontWeight: "bold", color: "#22c55e" }}>
                          YES
                        </div>
                        <div style={{ fontSize: "1.1rem" }}>
                          ${market.yesPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          background: "rgba(239, 68, 68, 0.2)",
                          padding: "0.5rem 1rem",
                          borderRadius: "0.5rem",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                        }}
                      >
                        <div style={{ fontWeight: "bold", color: "#ef4444" }}>
                          NO
                        </div>
                        <div style={{ fontSize: "1.1rem" }}>
                          ${market.noPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>
                    Volume: {market.totalVolume.toLocaleString()} SOL • Ends:{" "}
                    {market.endDate}
                  </div>
                </div>
              ))}
            </div>

            {/* Betting Panel */}
            {selectedMarket && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  padding: "2rem",
                  borderRadius: "1rem",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  maxWidth: "500px",
                  margin: "0 auto",
                }}
              >
                <h3 style={{ marginBottom: "1rem", textAlign: "center" }}>
                  🎲 Place Your Bet
                </h3>
                <p
                  style={{
                    marginBottom: "1.5rem",
                    opacity: 0.8,
                    textAlign: "center",
                  }}
                >
                  {selectedMarket.title}
                </p>

                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    Choose Side:
                  </label>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button
                      onClick={() => setBetSide("yes")}
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        border:
                          betSide === "yes"
                            ? "2px solid #22c55e"
                            : "1px solid rgba(34, 197, 94, 0.3)",
                        background:
                          betSide === "yes"
                            ? "rgba(34, 197, 94, 0.3)"
                            : "rgba(34, 197, 94, 0.1)",
                        color: "#22c55e",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      YES ${selectedMarket.yesPrice.toFixed(2)}
                    </button>
                    <button
                      onClick={() => setBetSide("no")}
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        border:
                          betSide === "no"
                            ? "2px solid #ef4444"
                            : "1px solid rgba(239, 68, 68, 0.3)",
                        background:
                          betSide === "no"
                            ? "rgba(239, 68, 68, 0.3)"
                            : "rgba(239, 68, 68, 0.1)",
                        color: "#ef4444",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      NO ${selectedMarket.noPrice.toFixed(2)}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    Bet Amount (SOL):
                  </label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    placeholder="0.1"
                    step="0.01"
                    min="0.01"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "white",
                      fontSize: "1rem",
                    }}
                  />
                </div>

                <button
                  onClick={handlePlaceBet}
                  disabled={!betAmount || !betSide}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    background:
                      !betAmount || !betSide
                        ? "rgba(255, 255, 255, 0.1)"
                        : "linear-gradient(90deg, #2563eb, #7c3aed)",
                    color:
                      !betAmount || !betSide
                        ? "rgba(255, 255, 255, 0.5)"
                        : "white",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    cursor: !betAmount || !betSide ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                  }}
                >
                  {!betAmount || !betSide
                    ? "Select Side & Amount"
                    : `Place ${betAmount} SOL Bet`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
