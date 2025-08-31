type UiCluster = "devnet" | "mainnet-beta";

const rawCluster = process.env.NEXT_PUBLIC_CLUSTER;
export const cluster: UiCluster =
  rawCluster === "mainnet-beta" ? "mainnet-beta" : "devnet";

export const protocolTreasury = process.env.NEXT_PUBLIC_PROTOCOL_TREASURY || "";

export const feeBps = Number(process.env.NEXT_PUBLIC_FEE_BPS ?? 200);

export const mockTx = process.env.NEXT_PUBLIC_MOCK_TX === "1";

export const isReal = !mockTx;

export const clusterQuery = `?cluster=${cluster}`;

export const env = {
  cluster,
  protocolTreasury,
  feeBps,
  mockTx,
  isReal,
  clusterQuery,
};

export type AppEnv = typeof env;
