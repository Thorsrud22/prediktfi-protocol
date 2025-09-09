/**
 * Analytics Events System
 * Typed helpers for view→copy→sign funnel tracking
 */

import { z } from 'zod';
import { prisma } from '../../../app/lib/prisma';
import crypto from 'crypto';

// Event types enum
export const ANALYTICS_EVENT_TYPES = {
  MODEL_METRICS_VIEW: 'model_metrics_view',
  LEAGUE_VIEW: 'league_view', 
  MODEL_COPY_CLICKED: 'model_copy_clicked',
  INTENT_CREATED_FROM_COPY: 'intent_created_from_copy',
  INTENT_EXECUTED_FROM_COPY: 'intent_executed_from_copy',
  CONTEXT_SHOWN: 'context_shown',
  CONTEXT_HIDDEN: 'context_hidden'
} as const;

export type AnalyticsEventType = typeof ANALYTICS_EVENT_TYPES[keyof typeof ANALYTICS_EVENT_TYPES];

// Event payload schemas
export const ModelMetricsViewSchema = z.object({
  type: z.literal(ANALYTICS_EVENT_TYPES.MODEL_METRICS_VIEW),
  modelId: z.string().min(1)
});

export const LeagueViewSchema = z.object({
  type: z.literal(ANALYTICS_EVENT_TYPES.LEAGUE_VIEW)
});

export const ModelCopyClickedSchema = z.object({
  type: z.literal(ANALYTICS_EVENT_TYPES.MODEL_COPY_CLICKED),
  modelId: z.string().min(1)
});

export const IntentCreatedFromCopySchema = z.object({
  type: z.literal(ANALYTICS_EVENT_TYPES.INTENT_CREATED_FROM_COPY),
  modelId: z.string().min(1),
  intentId: z.string().min(1)
});

export const IntentExecutedFromCopySchema = z.object({
  type: z.literal(ANALYTICS_EVENT_TYPES.INTENT_EXECUTED_FROM_COPY),
  modelId: z.string().min(1),
  intentId: z.string().min(1)
});

export const ContextShownSchema = z.object({
  type: z.literal(ANALYTICS_EVENT_TYPES.CONTEXT_SHOWN),
  modelIdHash: z.string().optional()
});

export const ContextHiddenSchema = z.object({
  type: z.literal(ANALYTICS_EVENT_TYPES.CONTEXT_HIDDEN),
  modelIdHash: z.string().optional()
});

// Union schema for all events
export const AnalyticsEventSchema = z.discriminatedUnion('type', [
  ModelMetricsViewSchema,
  LeagueViewSchema,
  ModelCopyClickedSchema,
  IntentCreatedFromCopySchema,
  IntentExecutedFromCopySchema,
  ContextShownSchema,
  ContextHiddenSchema
]);

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

// Database schema for analytics events
export interface AnalyticsEventRecord {
  id: string;
  sessionId: string;
  eventType: AnalyticsEventType;
  modelIdHash?: string; // Hashed modelId for privacy
  intentId?: string;
  timestamp: Date;
  userAgent?: string;
  referer?: string;
}

/**
 * Hash a model ID for privacy (no PII)
 */
export function hashModelId(modelId: string): string {
  return crypto.createHash('sha256').update(modelId).digest('hex').slice(0, 16);
}

/**
 * Generate idempotency key for event deduplication
 */
export function generateIdempotencyKey(
  sessionId: string,
  eventType: AnalyticsEventType,
  modelId?: string,
  timestamp?: Date
): string {
  const minute = Math.floor((timestamp?.getTime() || Date.now()) / (60 * 1000));
  const key = `${sessionId}:${eventType}:${modelId || 'none'}:${minute}`;
  return crypto.createHash('md5').update(key).digest('hex');
}

/**
 * Check if event should be debounced (for view events and context events)
 */
export function shouldDebounceEvent(eventType: AnalyticsEventType): boolean {
  return eventType === ANALYTICS_EVENT_TYPES.MODEL_METRICS_VIEW ||
         eventType === ANALYTICS_EVENT_TYPES.LEAGUE_VIEW ||
         eventType === ANALYTICS_EVENT_TYPES.CONTEXT_SHOWN ||
         eventType === ANALYTICS_EVENT_TYPES.CONTEXT_HIDDEN;
}

/**
 * Store analytics event in database
 */
export async function storeAnalyticsEvent(
  event: AnalyticsEvent,
  sessionId: string,
  userAgent?: string,
  referer?: string
): Promise<{ success: boolean; reason?: string }> {
  try {
    // Generate idempotency key
    const idempotencyKey = generateIdempotencyKey(
      sessionId,
      event.type,
      'modelId' in event ? event.modelId : undefined
    );

    // Check if event already exists (idempotency)
    const existingEvent = await prisma.analyticsEvent.findUnique({
      where: { idempotencyKey }
    });

    if (existingEvent) {
      return { success: false, reason: 'duplicate' };
    }

    // Prepare event data
    const eventData: any = {
      id: crypto.randomUUID(),
      sessionId,
      eventType: event.type,
      timestamp: new Date(),
      userAgent: userAgent?.slice(0, 255), // Limit length
      referer: referer?.slice(0, 255),
      idempotencyKey
    };

    // Add model ID hash if present
    if ('modelId' in event) {
      eventData.modelIdHash = hashModelId(event.modelId);
    }

    // Add intent ID if present
    if ('intentId' in event) {
      eventData.intentId = event.intentId;
    }

    // Store in database
    await prisma.analyticsEvent.create({
      data: eventData
    });

    return { success: true };

  } catch (error) {
    console.error('Failed to store analytics event:', error);
    return { success: false, reason: 'database_error' };
  }
}

/**
 * Get session-based debounce status for view events
 */
export async function getSessionDebounceStatus(
  sessionId: string,
  eventType: AnalyticsEventType,
  modelId?: string
): Promise<{ shouldSkip: boolean; lastEventTime?: Date }> {
  if (!shouldDebounceEvent(eventType)) {
    return { shouldSkip: false };
  }

  try {
    const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
    
    const recentEvent = await prisma.analyticsEvent.findFirst({
      where: {
        sessionId,
        eventType,
        modelIdHash: modelId ? hashModelId(modelId) : undefined,
        timestamp: { gte: tenSecondsAgo }
      },
      orderBy: { timestamp: 'desc' }
    });

    if (recentEvent) {
      return { 
        shouldSkip: true, 
        lastEventTime: recentEvent.timestamp 
      };
    }

    return { shouldSkip: false };

  } catch (error) {
    console.error('Failed to check debounce status:', error);
    return { shouldSkip: false };
  }
}

/**
 * Validate analytics event payload
 */
export function validateAnalyticsEvent(payload: unknown): {
  success: boolean;
  event?: AnalyticsEvent;
  error?: string;
} {
  try {
    const event = AnalyticsEventSchema.parse(payload);
    return { success: true, event };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      };
    }
    return {
      success: false,
      error: 'Invalid event format'
    };
  }
}
