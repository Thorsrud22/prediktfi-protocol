/**
 * Helper functions for Solana Explorer links
 */

export type SolanaCluster = "devnet" | "mainnet-beta" | "testnet";

/**
 * Get Solana Explorer transaction URL
 * @param signature - Transaction signature
 * @param cluster - Solana cluster (reads from document.body.dataset or falls back to SOLANA_CLUSTER)
 * @returns Full explorer URL
 */
export function getExplorerTxUrl(signature: string, cluster?: SolanaCluster): string {
  // Try to read cluster from document body dataset first
  let targetCluster = cluster;
  
  if (!targetCluster && typeof document !== 'undefined') {
    targetCluster = document.body.dataset.cluster as SolanaCluster;
  }
  
  // Fall back to devnet (never expose server env to client)
  if (!targetCluster) {
    targetCluster = "devnet"; // Safe default for client-side usage
  }
  
  const baseUrl = "https://explorer.solana.com/tx";
  const clusterParam = targetCluster === "mainnet-beta" ? "" : `?cluster=${targetCluster}`;
  
  return `${baseUrl}/${signature}${clusterParam}`;
}

/**
 * Format timestamp to local time string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted local time string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}
