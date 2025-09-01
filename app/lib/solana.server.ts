'use server';

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import type { SendTransactionOptions } from "@solana/wallet-adapter-base";
import { MEMO_PROGRAM_ID } from "./solana";

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
  const lamports = Number(BigInt(Math.floor(amountSol * 1_000_000_000)));

  const transferIx = SystemProgram.transfer({
    fromPubkey: wallet.publicKey,
    toPubkey,
    lamports: lamports,
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
