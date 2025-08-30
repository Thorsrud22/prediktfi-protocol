export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e1b4b 0%, #7c3aed 100%)",
        color: "white",
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", paddingTop: "4rem" }}>
        <h1
          style={{
            fontSize: "4rem",
            fontWeight: "bold",
            marginBottom: "1rem",
            background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          PrediktFi
        </h1>
        <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
          Tokenized Predictions on Solana
        </h2>
        <p
          style={{
            fontSize: "1.2rem",
            maxWidth: "800px",
            margin: "0 auto 2rem",
            opacity: 0.9,
          }}
        >
          Turn insights into tradable assets. Access the future of on-chain
          prediction markets with real speed and near zero fees.
        </p>
        <button
          style={{
            background: "linear-gradient(90deg, #2563eb, #7c3aed)",
            color: "white",
            padding: "1rem 2rem",
            borderRadius: "9999px",
            border: "none",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(37, 99, 235, 0.3)",
          }}
        >
          Launch App
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "2rem",
          marginTop: "4rem",
          maxWidth: "1200px",
          margin: "4rem auto 0",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            padding: "2rem",
            borderRadius: "1rem",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
            On-Chain Markets
          </h3>
          <p style={{ opacity: 0.8 }}>
            Create and trade prediction assets directly on Solana without
            intermediaries.
          </p>
        </div>

        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            padding: "2rem",
            borderRadius: "1rem",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
            Permissionless
          </h3>
          <p style={{ opacity: 0.8 }}>
            No KYC. Anyone with a wallet can participate across borders.
          </p>
        </div>

        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            padding: "2rem",
            borderRadius: "1rem",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
            High Performance
          </h3>
          <p style={{ opacity: 0.8 }}>
            Sub-second finality and minimal fees so markets feel instant.
          </p>
        </div>
      </div>
    </div>
  );
}
