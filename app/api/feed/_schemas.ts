import { z } from 'zod';

export const FeedQuerySchema = z.object({
  // Legacy parameters for backward compatibility
  page: z.coerce.number().min(1).catch(1),
  filter: z.string().catch('all'),
  
  // New parameters as requested
  category: z.string().catch('all'),
  q: z.string().catch(''),
  cursor: z.string().catch(''),
  limit: z.coerce.number().min(1).max(50).catch(20),
  sort: z.string().catch('recent'),
  timeframe: z.string().catch('30d'),
});

export type FeedQuery = z.infer<typeof FeedQuerySchema>;

export interface FeedInsight {
  id: string;
  question: string;
  category: string;
  probability: number;
  confidence: number;
  stamped: boolean;
  createdAt: string;
  visibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
  creator?: {
    handle: string;
    score: number;
  };
}

export interface FeedResponse {
  insights: FeedInsight[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    current: string;
    available: string[];
  };
  // New fields for enhanced API
  nextCursor: string | null;
  query: string;
  category: string;
  sort: string;
  timeframe: string;
}
