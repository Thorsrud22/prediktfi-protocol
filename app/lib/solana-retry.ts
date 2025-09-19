/**
 * Solana transaction retry utilities with blockhash expiry handling
 */

import { Connection, Transaction, TransactionSignature, SendOptions } from '@solana/web3.js';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface TransactionResult {
  signature: TransactionSignature;
  blockTime: number;
  success: boolean;
  error?: string;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};

/**
 * Send transaction with automatic blockhash refresh and retry
 */
export async function sendTransactionWithRetry(
  connection: Connection,
  transaction: Transaction,
  options: SendOptions = {},
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<TransactionResult> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      // Get fresh blockhash for each attempt
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      
      // Send transaction
      const signature = await connection.sendTransaction(transaction, [], {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        ...options
      });
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }
      
      // Get block time
      const txInfo = await connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });
      
      return {
        signature,
        blockTime: txInfo?.blockTime || Date.now() / 1000,
        success: true
      };
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if it's a blockhash expiry error
      const isBlockhashExpired = lastError.message.includes('blockhash') || 
                                lastError.message.includes('expired') ||
                                lastError.message.includes('BlockhashNotFound');
      
      // If it's not a blockhash error and we're not on the last attempt, don't retry
      if (!isBlockhashExpired && attempt < retryConfig.maxRetries) {
        throw lastError;
      }
      
      // If this is the last attempt, throw the error
      if (attempt === retryConfig.maxRetries) {
        return {
          signature: '',
          blockTime: 0,
          success: false,
          error: lastError.message
        };
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, attempt - 1),
        retryConfig.maxDelay
      );
      
      console.log(`Transaction attempt ${attempt}/${retryConfig.maxRetries} failed: ${lastError.message}. Retrying in ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return {
    signature: '',
    blockTime: 0,
    success: false,
    error: lastError!.message
  };
}

/**
 * Build transaction with fresh blockhash
 */
export async function buildTransactionWithFreshBlockhash(
  connection: Connection,
  transaction: Transaction
): Promise<Transaction> {
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  return transaction;
}

/**
 * Check if error is related to blockhash expiry
 */
export function isBlockhashExpiredError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return message.includes('blockhash') || 
         message.includes('expired') ||
         message.includes('blockhashnotfound') ||
         message.includes('block height') ||
         message.includes('slot');
}
