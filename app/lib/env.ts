type UiCluster = "devnet" | "mainnet-beta";

// Use only allowed environment variables
const mockTx = process.env.NEXT_PUBLIC_MOCK_TX === "1";

// Read cluster from environment variable, defaulting to devnet for safety
const rawCluster = process.env.SOLANA_CLUSTER;
export const cluster: UiCluster = (rawCluster === "mainnet-beta") ? "mainnet-beta" : "devnet";

export const feeBps = 200; // Fixed fee instead of env variable

export const isReal = !mockTx;

export const clusterQuery = `?cluster=${cluster}`;

export const env = {
  cluster,
  feeBps,
  mockTx,
  isReal,
  clusterQuery,
};

export type AppEnv = typeof env;
