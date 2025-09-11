import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { createQR } from '@solana/pay';
import QRCode from 'qrcode';

// Environment variables with defaults
const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'mainnet-beta';
const PAYMENT_SOLANA_WALLET = process.env.PAYMENT_SOLANA_WALLET || 'Ez6dxRTZPCR41LNFPTPH9FjpDkX8NusbP1HDJy2vmnd5';
const USDC_MINT = process.env.USDC_MINT || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Create Solana connection
export function getSolanaConnection(): Connection {
  const rpcUrl = SOLANA_NETWORK === 'mainnet-beta' 
    ? 'https://api.mainnet-beta.solana.com'
    : clusterApiUrl(SOLANA_NETWORK as any);
  
  return new Connection(rpcUrl, 'confirmed');
}

// Get payment wallet public key
export function getPaymentWallet(): PublicKey {
  return new PublicKey(PAYMENT_SOLANA_WALLET);
}

// Get USDC mint public key
export function getUsdcMint(): PublicKey {
  return new PublicKey(USDC_MINT);
}

// Validate base58 string
export function isValidBase58(str: string): boolean {
  try {
    new PublicKey(str);
    return true;
  } catch {
    return false;
  }
}

// Generate QR code data URL
export async function generateQRCodeDataUrl(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

// Create Solana Pay URL
export function createSolanaPayUrl(params: {
  recipient: string;
  amount: number;
  splToken?: string;
  reference?: string;
  label?: string;
  message?: string;
}): string {
  const { recipient, amount, splToken, reference, label, message } = params;
  
  const url = new URL('solana:');
  url.searchParams.set('address', recipient);
  url.searchParams.set('amount', amount.toString());
  
  if (splToken) {
    url.searchParams.set('spl-token', splToken);
  }
  
  if (reference) {
    url.searchParams.set('reference', reference);
  }
  
  if (label) {
    url.searchParams.set('label', label);
  }
  
  if (message) {
    url.searchParams.set('message', message);
  }
  
  return url.toString();
}

// Format amount for display
export function formatAmount(amount: number, decimals: number = 6): string {
  return amount.toFixed(decimals);
}

// Convert USD to SOL (mock function - in production, use real price feed)
export async function getSolPriceInUsd(): Promise<number> {
  // In production, fetch from a real price API like CoinGecko or Jupiter
  // For now, return a mock price
  return 100; // $100 per SOL
}

// Calculate SOL amount from USD
export async function calculateSolAmount(usdAmount: number): Promise<number> {
  const solPrice = await getSolPriceInUsd();
  return usdAmount / solPrice;
}
