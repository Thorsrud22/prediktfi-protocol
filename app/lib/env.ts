import type { SolanaCluster } from "./solana";

export const env = {
  cluster:
    (process.env.NEXT_PUBLIC_CLUSTER as SolanaCluster | undefined) ||
    ("devnet" as const),
  programId: process.env.NEXT_PUBLIC_PROGRAM_ID,
  protocolTreasury: process.env.NEXT_PUBLIC_PROTOCOL_TREASURY,
  feeBps: Number(process.env.NEXT_PUBLIC_FEE_BPS ?? 200),
  mockTx: process.env.NEXT_PUBLIC_MOCK_TX === "1",
};

export type AppEnv = typeof env;
