import { 
  TransactionInstruction, 
  PublicKey, 
  Connection,
  Transaction
} from '@solana/web3.js';

/**
 * Solana Memo program ID
 */
export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

/**
 * Predikt memo payload structure
 */
export interface PrediktMemoPayload {
  t: 'predikt.v1'; // Type identifier
  pid: string;     // Prediction ID
  h: string;       // Hash of canonical statement
  d: string;       // Deadline ISO string
  w: string;       // Wallet address
}

/**
 * Create a Solana memo instruction
 */
export function createMemoInstruction(
  publicKey: PublicKey, 
  message: string
): TransactionInstruction {
  return new TransactionInstruction({
    keys: [
      {
        pubkey: publicKey,
        isSigner: true,
        isWritable: false,
      },
    ],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(message, 'utf8'),
  });
}

/**
 * Create Predikt memo payload
 */
export function createPrediktMemoPayload(
  predictionId: string,
  hash: string,
  deadline: Date,
  walletAddress: string
): PrediktMemoPayload {
  return {
    t: 'predikt.v1',
    pid: predictionId,
    h: hash,
    d: deadline.toISOString(),
    w: walletAddress,
  };
}

/**
 * Serialize memo payload to JSON string
 */
export function serializeMemoPayload(payload: PrediktMemoPayload): string {
  return JSON.stringify(payload);
}

/**
 * Parse memo payload from JSON string
 */
export function parseMemoPayload(jsonString: string): PrediktMemoPayload | null {
  try {
    const payload = JSON.parse(jsonString);
    
    // Validate required fields
    if (
      payload.t === 'predikt.v1' &&
      typeof payload.pid === 'string' &&
      typeof payload.h === 'string' &&
      typeof payload.d === 'string' &&
      typeof payload.w === 'string'
    ) {
      return payload;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Verify memo payload matches prediction data
 */
export function verifyMemoPayload(
  payload: PrediktMemoPayload,
  expectedPredictionId: string,
  expectedHash: string,
  expectedDeadline: Date,
  expectedWallet: string
): boolean {
  return (
    payload.pid === expectedPredictionId &&
    payload.h === expectedHash &&
    payload.d === expectedDeadline.toISOString() &&
    payload.w === expectedWallet
  );
}

/**
 * Get transaction from Solana using signature
 * Simplified version - in production we'd parse the transaction properly
 */
export async function getTransactionMemo(
  connection: Connection,
  signature: string
): Promise<string | null> {
  try {
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
    });
    
    if (!transaction) {
      return null;
    }
    
    // For V1, we'll store the memo content separately
    // This is a placeholder that would need proper implementation
    // based on the specific transaction structure
    return null;
  } catch {
    return null;
  }
}

/**
 * Create a complete memo transaction
 */
export function createMemoTransaction(
  publicKey: PublicKey,
  payload: PrediktMemoPayload,
  recentBlockhash: string
): Transaction {
  const message = serializeMemoPayload(payload);
  const instruction = createMemoInstruction(publicKey, message);
  
  const transaction = new Transaction({
    recentBlockhash,
    feePayer: publicKey,
  });
  
  transaction.add(instruction);
  
  return transaction;
}
