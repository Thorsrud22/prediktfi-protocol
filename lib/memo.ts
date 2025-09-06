import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

export interface MemoPayload {
  t: 'predikt.v1';
  pid: string; // prediction ID
  h: string;   // hash
  d: string;   // deadline ISO
  w: string;   // wallet address
}

/**
 * Creates a Solana memo transaction payload
 */
export function createMemoPayload(
  predictionId: string,
  hash: string,
  deadline: Date,
  walletAddress: string
): MemoPayload {
  return {
    t: 'predikt.v1',
    pid: predictionId,
    h: hash,
    d: deadline.toISOString(),
    w: walletAddress
  };
}

/**
 * Creates a Solana memo instruction
 */
export function createMemoInstruction(payload: MemoPayload): TransactionInstruction {
  const memoText = JSON.stringify(payload);
  
  return new TransactionInstruction({
    keys: [],
    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    data: Buffer.from(memoText, 'utf8')
  });
}

/**
 * Validates memo payload structure and content
 */
export function validateMemoPayload(
  payload: any,
  expectedHash: string,
  expectedWallet: string,
  expectedDeadline: Date
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!payload || typeof payload !== 'object') {
    errors.push('Invalid payload format');
    return { valid: false, errors };
  }
  
  if (payload.t !== 'predikt.v1') {
    errors.push('Invalid payload type');
  }
  
  if (!payload.pid || typeof payload.pid !== 'string') {
    errors.push('Missing or invalid prediction ID');
  }
  
  if (payload.h !== expectedHash) {
    errors.push('Hash mismatch');
  }
  
  if (payload.w !== expectedWallet) {
    errors.push('Wallet address mismatch');
  }
  
  if (payload.d !== expectedDeadline.toISOString()) {
    errors.push('Deadline mismatch');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Fetches transaction details from Solana RPC
 */
export async function getTransactionDetails(
  connection: Connection,
  signature: string
): Promise<{
  slot: number;
  memoData: string | null;
} | null> {
  try {
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });
    
    if (!transaction) {
      return null;
    }
    
    // Find memo instruction in log messages (simpler approach)
    let memoData: string | null = null;
    
    if (transaction.meta?.logMessages) {
      for (const log of transaction.meta.logMessages) {
        if (log.includes('Program log: Memo')) {
          // Extract memo data from log message
          const match = log.match(/Program log: Memo \(len \d+\): "(.+)"/);
          if (match) {
            memoData = match[1];
            break;
          }
        }
      }
    }
    
    return {
      slot: transaction.slot,
      memoData
    };
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }
}

/**
 * Parses memo data into payload object
 */
export function parseMemoData(memoData: string): MemoPayload | null {
  try {
    const payload = JSON.parse(memoData);
    if (payload.t === 'predikt.v1') {
      return payload as MemoPayload;
    }
    return null;
  } catch {
    return null;
  }
}
