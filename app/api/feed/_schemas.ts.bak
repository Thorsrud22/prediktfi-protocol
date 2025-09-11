import { z } from 'zod';

export const FeedQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  filter: z.enum(['all', 'KOL', 'EXPERT', 'COMMUNITY', 'PREDIKT']).default('all'),
  sort: z.enum(['recent', 'trending']).default('recent'),
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
}
