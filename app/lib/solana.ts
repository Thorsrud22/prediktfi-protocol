export type SolanaCluster = "devnet" | "testnet" | "mainnet-beta";

export function getExplorerTxUrl(
  signature: string | undefined,
  cluster: SolanaCluster
): string | undefined {
  if (!signature) return undefined;
  const base = "https://explorer.solana.com/tx/";
  return `${base}${encodeURIComponent(signature)}?cluster=${cluster}`;
}
