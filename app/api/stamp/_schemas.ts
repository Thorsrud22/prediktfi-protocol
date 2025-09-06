import { z } from 'zod';

export const StampRequestSchema = z.object({
  insightIds: z.array(z.string().cuid()).min(1).max(100),
  walletAddress: z.string().min(32).max(44), // Base58 Solana address
});

export type StampRequest = z.infer<typeof StampRequestSchema>;

export interface StampResponse {
  stampId: string;
  merkleRoot: string;
  txSig: string;
  chain: string;
  cluster: string;
  insightIds: string[];
  explorerUrl: string;
  createdAt: string;
}
