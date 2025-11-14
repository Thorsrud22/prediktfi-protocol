import { z } from 'zod';

// NEW BLOKK 3: Proof Agent API Schema
export const CreateInsightSchema = z.object({
  rawText: z.string().min(3).max(1000),
  p: z.number().min(0).max(1).optional(),
  deadline: z.string().optional(), // ISO UTC date or datetime
  resolverKind: z.enum(['price', 'url', 'text']).default('price'),
  resolverRef: z.string().min(1).optional(),
  visibility: z.enum(['public', 'followers', 'private']).default('public'),
});

export const CommitInsightSchema = z.object({
  id: z.string().min(1), // ULID/KSUID
  signature: z.string().min(1),
  cluster: z.enum(['devnet', 'mainnet']).default('devnet'),
});

export const GetInsightSchema = z.object({
  id: z.string().min(1),
});

export type CreateInsightRequest = z.infer<typeof CreateInsightSchema>;
export type CommitInsightRequest = z.infer<typeof CommitInsightSchema>;
export type GetInsightRequest = z.infer<typeof GetInsightSchema>;

// NEW BLOKK 3: Response interfaces
export interface CreateInsightResponse {
  insight: {
    id: string;
    canonical: string;
    p: number;
    deadline: string;
    resolverKind: string;
    resolverRef: string;
    status: string;
    createdAt: string;
    visibility: 'public' | 'followers' | 'private';
  };
  commitPayload: {
    t: 'predikt.v1';
    pid: string;
    h: string; // full 64-hex hash
    d: string; // YYYY-MM-DD
    w?: string; // full wallet or omitted
  };
  publicUrl: string;
  receiptUrl: string;
  shareText: string;
}

export interface CommitInsightResponse {
  status: 'committed';
  explorerUrl: string;
}

export interface InsightResponse {
  id: string;
  canonical: string;
  p: number;
  deadline: string;
  resolverKind: string;
  resolverRef: string;
  status: 'OPEN' | 'COMMITTED' | 'RESOLVED';
  memoSig?: string;
  slot?: number;
  createdAt: string;
  creator?: {
    handle: string;
    score: number;
    accuracy: number;
  };
  outcome?: {
    result: 'YES' | 'NO' | 'INVALID';
    evidenceUrl?: string;
    decidedBy: 'AGENT' | 'USER';
    decidedAt: string;
  };
}

// Health check response
export interface HealthResponse {
  version: string;
  commit: string;
  rpc: {
    ok: boolean;
    slot?: number;
  };
}
