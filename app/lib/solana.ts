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

type WalletLike = {
  publicKey: PublicKey | null;
  sendTransaction: (
    tx: Transaction,
    connection: Connection,
    options?: SendTransactionOptions
  ) => Promise<string>;
};

export async function sendSolWithMemo(args: {
  connection: Connection;
  wallet: WalletLike;
  treasury: string; // base58 pubkey
  amountSol: number;
  memo: string;
}): Promise<string> {
  const { connection, wallet, treasury, amountSol, memo } = args;
  if (!wallet.publicKey) throw new Error("Wallet not connected");
  if (!treasury) throw new Error("Missing treasury address");
  if (!Number.isFinite(amountSol) || amountSol <= 0)
    throw new Error("Amount must be > 0");

  const toPubkey = new PublicKey(treasury);
  const lamports = solToLamports(amountSol);

  const transferIx = SystemProgram.transfer({
    fromPubkey: wallet.publicKey,
    toPubkey,
    lamports: Number(lamports),
  });

  const dataBytes = (() => {
    // Prefer Buffer when available; otherwise use Uint8Array and coerce type.
    if (typeof Buffer !== "undefined") {
      return Buffer.from(memo ?? "", "utf8");
    }
    const u8 = new TextEncoder().encode(memo ?? "");
    return u8 as unknown as Buffer; // web3.js accepts byte-like data; TS expects Buffer type
  })();

  const memoIx = new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [],
    data: dataBytes,
  });

  const tx = new Transaction().add(transferIx, memoIx);
  // Let wallet adapter set recent blockhash and fee payer inside sendTransaction
  const signature = await wallet.sendTransaction(tx, connection, {
    skipPreflight: false,
  });
  return signature;
}
