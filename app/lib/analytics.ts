// Zero-dependency analytics helper for client + server tracking
export type AnalyticsEvent = 
  | 'pricing_viewed'
  | 'account_viewed'
  | 'checkout_created' 
  | 'checkout_completed'
  | 'license_redeemed'
  | 'pro_activated'
  | 'quota_exhausted'
  | 'pro_bypass_hit'
  | 'already_pro_at_checkout'
  | 'webhook_duplicate_ignored'
  | 'creator_profile_view'
  | 'creator_profile_share_clicked'
  | 'creator_profile_component_toggled'
  | 'creator_profile_open_studio_clicked'
  | 'creator_profile_kpi_clicked'
  | 'feed_viewed'
  | 'feed_error'
  | 'quota_check'
  | 'insight_requested'
  | 'insight_created'
  | 'insight_viewed'
  | 'insight_saved'
  | 'insight_updated'
  | 'insight_completed'
  | 'insight_error'
  | 'memo_committed'
  | 'memo_verified'
  | 'stamp_requested'
  | 'stamp_completed'
  | 'outcome_resolved'
  | 'outcome_disputed'
  | 'outcome_verified'
  | 'creator_registered'
  | 'creator_updated'
  | 'search_performed'
  | 'system_error'
  | 'system_warning'
  | 'insights_stamped'
  | 'stamp_error';

interface AnalyticsPayload {
  name: AnalyticsEvent;
  props?: Record<string, string | number | boolean>;
  ts: number;
}

/**
 * Client-side tracking via sendBeacon (fallback fetch)
 * Only runs in browser, silently fails if network unavailable
 */
export function trackClient(name: AnalyticsEvent, props?: Record<string, string | number | boolean>): void {
  if (typeof window === 'undefined') return;
  
  const payload: AnalyticsPayload = {
    name,
    props: props || {},
    ts: Date.now()
  };

  try {
    // Prefer sendBeacon for reliability during page unload
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics', blob);
    } else {
      // Fallback to fetch with minimal config
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {}); // Silent fail
    }
  } catch {
    // Silent fail - analytics should never break UX
  }
}

/**
 * Server-side tracking via structured console logging
 * Can be ingested by log aggregators without additional deps
 * Respects ENABLE_ANALYTICS environment variable
 */
export function trackServer(name: AnalyticsEvent, props?: Record<string, string | number | boolean>): void {
  // Skip analytics if disabled in environment
  if (process.env.ENABLE_ANALYTICS === 'false') {
    return;
  }
  
  const payload = {
    kind: 'analytics',
    name,
    props: props || {},
    ts: Date.now()
  };
  
  console.log(JSON.stringify(payload));
}
