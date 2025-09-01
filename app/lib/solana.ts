import {
  SystemProgram,
  Transaction,
  TransactionInstruction,
  PublicKey,
} from "@solana/web3.js";

export const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

// Cluster configuration
const CLUSTER = process.env.NEXT_PUBLIC_CLUSTER || "devnet";
const ENDPOINT =
  CLUSTER === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com";

export type BetSide = "YES" | "NO";

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

// Convenience function to get explorer URL using current env cluster
export function getExplorerUrl(signature: string, cluster = ENDPOINT): string {
  const net = cluster.includes("devnet") ? "devnet" : "mainnet";
  return `https://explorer.solana.com/tx/${signature}?cluster=${net}`;
}

/**
 * Verify a transaction signature by calling our API
 */
export async function verifyBetTransaction(signature: string): Promise<{
  ok: boolean;
  memo?: any;
  amountLamports?: number;
  slot?: number;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/bets?sig=${signature}`);
    const data = await response.json();
    return data;
  } catch (error) {
    return { ok: false, error: "NETWORK_ERROR" };
  }
}

export function createBetMemoString(data: {
  marketId: string;
  side: BetSide;
  amount: number;
  ts?: number;
  ref?: string;
}) {
  const memo = { 
    marketId: data.marketId,
    side: data.side, 
    amount: data.amount,
    ts: data.ts ?? Date.now()
  };
  
  // Include referral if present
  if (data.ref) {
    (memo as any).ref = data.ref;
  }
  
  return JSON.stringify(memo);
}

// Get referral from localStorage if exists
function getRefFromStorage(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return localStorage.getItem("predikt:ref") || undefined;
  } catch {
    return undefined;
  }
}

export async function placeBetReal(params: {
  connection: import("@solana/web3.js").Connection;
  wallet: import("@solana/wallet-adapter-base").WalletAdapter;
  treasury: PublicKey;
  marketId: string;
  side: BetSide;
  amountSol: number;
}) {
  const { connection, wallet, treasury, marketId, side, amountSol } = params;
  if (!wallet?.publicKey) throw new Error("WALLET_NOT_CONNECTED");
  const lamports = Math.round(amountSol * 1e9);
  const ref = getRefFromStorage();
  const memoData = createBetMemoString({ marketId, side, amount: amountSol, ref });

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey!,
      toPubkey: treasury,
      lamports,
    }),
    new TransactionInstruction({
      programId: MEMO_PROGRAM_ID,
      keys: [],
      data: Buffer.from(memoData, "utf8"),
    })
  );

  // sendTransaction comes from wallet-adapter-react (client),
  // but this helper can be invoked from client with the adapter.
  // Here we only build tx; signing/sending happens in the page code.
  return { tx, memoData };
}

export async function placeBetMock(params: {
  marketId: string;
  side: BetSide;
  amountSol: number;
}) {
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
  const signature = `mock-${Date.now()}`;
  const ref = getRefFromStorage();
  const memoData = createBetMemoString({
    marketId: params.marketId,
    side: params.side,
    amount: params.amountSol,
    ref,
  });
  return { signature, memoData };
}

export function isMock() {
  return process.env.NEXT_PUBLIC_MOCK_TX === "1";
}