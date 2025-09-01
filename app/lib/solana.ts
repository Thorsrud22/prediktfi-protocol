import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import type { SendTransactionOptions } from "@solana/wallet-adapter-base";

export type SolanaCluster = "devnet" | "testnet" | "mainnet-beta";

// Memo Program ID (SPL Memo v1)
export const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

// Convert SOL (number) to lamports (bigint)
export function solToLamports(sol: number): bigint {
  if (!Number.isFinite(sol)) throw new Error("Invalid SOL amount");
  // Use floor to avoid sending more than intended due to FP rounding
  const lamports = Math.floor(sol * 1_000_000_000);
  if (lamports < 0) throw new Error("Amount must be non-negative");
  return BigInt(lamports);
}

// Format lamports (bigint) to SOL string with 6 decimals, trim trailing zeros
export function formatLamportsToSol(l: bigint): string {
  const micro = (l + 500n) / 1000n; // round to 6 decimals (drop 3 of 9)
  const whole = micro / 1_000_000n;
  const frac = micro % 1_000_000n;
  const fracStr = frac.toString().padStart(6, "0").replace(/0+$/, "");
  return fracStr.length ? `${whole.toString()}.${fracStr}` : whole.toString();
}

// Build an Explorer URL (cluster restricted to devnet|mainnet-beta as requested)
export function buildExplorerTxUrl(
  cluster: "devnet" | "mainnet-beta",
  sig: string
): string {
  const base = "https://explorer.solana.com/tx/";
  return `${base}${encodeURIComponent(sig)}?cluster=${cluster}`;
}

// Back-compat helper (used elsewhere). Accepts testnet too.
export function getExplorerTxUrl(
  signature: string | undefined,
  cluster: SolanaCluster
): string | undefined {
  if (!signature) return undefined;
  const base = "https://explorer.solana.com/tx/";
  return `${base}${encodeURIComponent(signature)}?cluster=${cluster}`;
}

// sendSolWithMemo moved to solana.server.ts for server-only usage

export type BetMemoData = {
  marketId: string;
  side: "YES" | "NO";
  amount: number; // i SOL, appen konverterer til lamports utenfor
};

export function createBetMemoString(data: BetMemoData): string {
  return JSON.stringify(data);
}

export function buildTransferWithMemoInstruction(
  from: PublicKey,
  to: PublicKey,
  lamports: number,
  memoData: BetMemoData
): { transferIx: TransactionInstruction; memoIx: TransactionInstruction } {
  const transferIx = SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports });
  const memoIx = new TransactionInstruction({
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(createBetMemoString(memoData), "utf-8"),
  });
  return { transferIx, memoIx };
}