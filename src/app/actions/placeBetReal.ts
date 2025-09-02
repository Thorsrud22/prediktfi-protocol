"use server";

import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction, clusterApiUrl } from "@solana/web3.js";
import { redirect } from "next/navigation";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

export async function placeBetReal(formData: FormData) {
  try {
    // Extract form data
    const marketId = formData.get("marketId") as string;
    const side = formData.get("side") as "YES" | "NO";
    const amount = parseFloat(formData.get("amount") as string);
    const walletPublicKey = formData.get("walletPublicKey") as string;
    
    if (!marketId || !side || !amount || !walletPublicKey) {
      throw new Error("Missing required parameters");
    }

    // Get cluster from environment or default to devnet
    const cluster = process.env.SOLANA_CLUSTER || "devnet";
    const connection = new Connection(
      cluster === "mainnet-beta" ? clusterApiUrl("mainnet-beta") : clusterApiUrl("devnet"),
      "confirmed"
    );

    // Get treasury address from environment
    const treasuryAddress = process.env.SOLANA_TREASURY;
    if (!treasuryAddress) {
      throw new Error("SOLANA_TREASURY environment variable not set");
    }
    
    const treasury = new PublicKey(treasuryAddress);
    const fromPubkey = new PublicKey(walletPublicKey);

    // Create memo data with all required fields
    const memoData = {
      marketId,
      side,
      amount,
      ref: "", // Will be set from localStorage on client
      creatorId: "", // Will be set from localStorage on client  
      ts: Date.now(),
    };

    // Convert amount to lamports
    const lamports = Math.round(amount * 1e9);

    // Create transaction with transfer and memo
    const transaction = new Transaction();
    
    // Add transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey: treasury,
        lamports,
      })
    );

    // Add memo instruction
    transaction.add(
      new TransactionInstruction({
        programId: MEMO_PROGRAM_ID,
        keys: [],
        data: Buffer.from(JSON.stringify(memoData), "utf8"),
      })
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    // Serialize transaction for client-side signing
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    // Return transaction data to client for signing
    return {
      success: true,
      transaction: serializedTransaction.toString("base64"),
      memoData: JSON.stringify(memoData),
    };

  } catch (error) {
    console.error("placeBetReal error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function handleBetTransaction(signature: string) {
  // Redirect to portfolio with signature
  redirect(`/me?sig=${signature}`);
}
