/**
 * Standardized event names for consistent logging and database storage
 */

export const EVENT_TYPES = {
  // Insight lifecycle
  INSIGHT_CREATED: 'insight_created',
  INSIGHT_VIEWED: 'insight_viewed',
  INSIGHT_SAVED: 'insight_saved',
  INSIGHT_UPDATED: 'insight_updated',

  // Memo and blockchain
  MEMO_COMMITTED: 'memo_committed',
  MEMO_VERIFIED: 'memo_verified',
  STAMP_REQUESTED: 'stamp_requested',
  STAMP_COMPLETED: 'stamp_completed',

  // Outcome resolution
  OUTCOME_RESOLVED: 'outcome_resolved',
  OUTCOME_DISPUTED: 'outcome_disputed',
  OUTCOME_VERIFIED: 'outcome_verified',

  // Creator activity
  CREATOR_REGISTERED: 'creator_registered',
  CREATOR_UPDATED: 'creator_updated',

  // Feed and discovery
  FEED_VIEWED: 'feed_viewed',
  SEARCH_PERFORMED: 'search_performed',

  // User interactions
  PRICING_VIEWED: 'pricing_viewed',
  ACCOUNT_VIEWED: 'account_viewed',
  QUOTA_CHECK: 'quota_check',

  // System events
  SYSTEM_ERROR: 'system_error',
  SYSTEM_WARNING: 'system_warning'
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

/**
 * Event metadata interfaces for type safety
 */
export interface InsightCreatedMeta {
  plan: string;
  category: string;
  hasCreator: boolean;
  tookMs: number;
  hasCanonical?: boolean;
  resolverKind?: string;
}

export interface MemoCommittedMeta {
  insightId: string;
  hash: string;
  deadline: string;
  txSig: string;
  cluster: string;
  tookMs: number;
}

export interface OutcomeResolvedMeta {
  insightId: string;
  result: 'yes' | 'no' | 'invalid';
  decidedBy: 'agent' | 'user';
  evidenceUrl?: string;
  tookMs: number;
}

export interface FeedViewedMeta {
  filter: string;
  sort: string;
  page: number;
  limit: number;
  resultsCount: number;
  tookMs: number;
}

export interface QuotaCheckMeta {
  plan: string;
  result: 'allowed' | 'denied';
  dailyUsed: number;
  dailyLimit: number;
}

/**
 * Create standardized event for logging
 */
export function createEvent(
  type: EventType,
  meta: Record<string, unknown>,
  userId?: string,
  insightId?: string
) {
  return {
    kind: 'analytics',
    name: type,
    props: meta,
    userId,
    insightId,
    ts: Date.now()
  };
}

/**
 * Validate event type
 */
export function isValidEventType(type: string): type is EventType {
  return Object.values(EVENT_TYPES).includes(type as EventType);
}

/**
 * Get event category from type
 */
export function getEventCategory(type: EventType): string {
  if (type.startsWith('insight_')) return 'insight';
  if (type.startsWith('memo_') || type.startsWith('stamp_')) return 'blockchain';
  if (type.startsWith('outcome_')) return 'resolution';
  if (type.startsWith('creator_')) return 'creator';
  if (type.startsWith('feed_') || type.startsWith('search_')) return 'discovery';
  if (type.startsWith('system_')) return 'system';
  return 'user';
}
