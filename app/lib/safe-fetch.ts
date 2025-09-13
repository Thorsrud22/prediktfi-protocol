/**
 * Safe fetch utilities for robust JSON parsing
 * Handles 304, 204, Content-Type validation, and prevents JSON.parse errors
 */

export interface SafeFetchResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
  etag?: string;
  fromCache?: boolean;
}

export interface SignalsFetchResult {
  etag?: string;
  payload?: any;
  from: '304' | '204' | '200' | 'error';
  error?: string;
}

/**
 * Safe JSON parser for localStorage and API responses
 * Returns null if parsing fails or input is invalid
 */
export function safeParse<T>(raw: string | null): T | null {
  if (!raw || raw.trim() === '' || raw === 'undefined' || raw === 'null') return null;
  try { 
    return JSON.parse(raw) as T; 
  } catch { 
    return null; 
  }
}

/**
 * Legacy function for backwards compatibility
 * @deprecated Use safeParse instead
 */
export function safeJsonParse<T>(text: string, fallback: T, context = 'unknown'): T {
  const result = safeParse<T>(text);
  return result ?? fallback;
}

/**
 * Safe fetch JSON with robust error handling - never parses 304/204 or non-JSON content
 */
export async function safeFetchJSON<T>(input: RequestInfo | URL, init?: RequestInit): Promise<{ data: T | null; etag?: string; status: number; }> {
  const res = await fetch(input, init);
  const status = res.status;
  const etag = res.headers.get('ETag') ?? undefined;

  // 304/204 → no body to parse
  if (status === 304 || status === 204) return { data: null, etag, status };

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text(); // for logging / sentry
    throw new Error(`Expected JSON but got ${ct} (status ${status}). body: ${text.slice(0,200)}`);
  }
  const data = await res.json() as T;
  return { data, etag, status };
}

/**
 * Safe fetch with comprehensive error handling
 */
export async function safeFetch<T = any>(
  url: string, 
  options: RequestInit = {},
  expectedContentType = 'application/json'
): Promise<SafeFetchResult<T>> {
  try {
    const response = await fetch(url, options);
    const status = response.status;
    const etag = response.headers.get('ETag') || undefined;

    // Handle 304 Not Modified - no body to parse
    if (status === 304) {
      return {
        success: true,
        status,
        etag,
        fromCache: true
      };
    }

    // Handle 204 No Content - no body to parse
    if (status === 204) {
      return {
        success: true,
        status,
        etag,
        data: undefined
      };
    }

    // Check Content-Type before attempting JSON parsing
    const contentType = response.headers.get('content-type') || '';
    
    if (!contentType.includes(expectedContentType)) {
      const text = await response.text();
      return {
        success: false,
        status,
        error: `Expected ${expectedContentType}, got ${contentType}. Body: ${text.substring(0, 200)}`,
        etag
      };
    }

    // For error responses, still try to parse JSON for error details
    if (!response.ok) {
      try {
        const errorData = await response.json();
        return {
          success: false,
          status,
          error: errorData.error || errorData.message || `HTTP ${status}`,
          data: errorData,
          etag
        };
      } catch {
        const text = await response.text();
        return {
          success: false,
          status,
          error: `HTTP ${status}: ${text.substring(0, 200)}`,
          etag
        };
      }
    }

    // Parse successful JSON response
    try {
      const data = await response.json();
      return {
        success: true,
        status,
        data,
        etag
      };
    } catch (error) {
      const text = await response.text();
      return {
        success: false,
        status,
        error: `JSON parse failed: ${error instanceof Error ? error.message : 'Unknown error'}. Body: ${text.substring(0, 200)}`,
        etag
      };
    }

  } catch (error) {
    return {
      success: false,
      status: 0,
      error: `Fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Signals cache type
 */
type SignalsCache = { etag?: string; payload?: any } | null;

let cached: SignalsCache = null;

/**
 * Load signals with robust 304/204 handling using safeFetchJSON
 */
export async function loadSignalsClient(): Promise<any> {
  const headers: Record<string, string> = {};
  if (cached?.etag) headers['If-None-Match'] = cached.etag;

  try {
    const { data, etag, status } = await safeFetchJSON<any>('/api/public/signals', { 
      headers, 
      cache: 'no-store' 
    });

    if (status === 304 && cached?.payload) return cached.payload;               // bruk cache
    if (status === 304 && !cached?.payload) throw new Error('304 without cache');

    if (status === 200 && data) {
      cached = { etag, payload: data };
      return data;
    }

    // 204 eller annet: returner tomt eller det du forventer
    return data;
  } catch (error) {
    console.warn('[loadSignalsClient] Error:', error);
    return null;
  }
}

/**
 * Legacy function for backwards compatibility
 * @deprecated Use loadSignalsClient instead
 */
export async function fetchSignalsClient(prev?: { etag?: string; payload?: any }): Promise<SignalsFetchResult> {
  try {
    const data = await loadSignalsClient();
    if (data) {
      return { etag: cached?.etag, payload: data, from: '200' };
    }
    return { from: 'error', error: 'No data returned' };
  } catch (error) {
    return {
      from: 'error',
      error: `Fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Safe localStorage operations using safeParse
 */
export function safeLocalStorageGet<T>(key: string, fallback: T, context = 'localStorage'): T {
  if (typeof window === 'undefined') return fallback;
  
  try {
    const raw = localStorage.getItem(key);
    const parsed = safeParse<T>(raw);
    return parsed ?? fallback;
  } catch (error) {
    console.warn(`[SafeFetch] ${context}: localStorage.getItem failed for ${key}:`, error);
    return fallback;
  }
}

export function safeLocalStorageSet(key: string, value: any, context = 'localStorage'): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.warn(`[SafeFetch] ${context}: localStorage.setItem failed for ${key}:`, error);
    return false;
  }
}
