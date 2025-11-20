/**
 * Safe JSON Parsing Utilities
 * 
 * Provides safe JSON parsing with proper error handling and content-type validation
 * to prevent JSON.parse errors from breaking the application
 */

/**
 * Safe JSON parsing with error handling
 */
export function safeJsonParse<T = unknown>(jsonString: string, fallback?: T): T | null {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('JSON parse error:', error);
    return fallback || null;
  }
}

/**
 * Safe response.json() with content-type validation
 */
export async function safeResponseJson<T = unknown>(
  response: Response,
  fallback?: T
): Promise<T | null> {
  try {
    // Check if response is successful
    if (!response.ok) {
      console.warn(`Response not OK: ${response.status} ${response.statusText}`);
      return fallback || null;
    }

    // Check content-type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`Expected JSON content-type, got: ${contentType}`);
      return fallback || null;
    }

    // Check if response has content (not 204 No Content)
    if (response.status === 204) {
      console.warn('Response is 204 No Content, cannot parse JSON');
      return fallback || null;
    }

    // Parse JSON
    const text = await response.text();
    if (!text.trim()) {
      console.warn('Response body is empty');
      return fallback || null;
    }

    return JSON.parse(text);
  } catch (error) {
    console.warn('Response JSON parse error:', error);
    return fallback || null;
  }
}

/**
 * Safe fetch with JSON parsing
 */
export async function safeFetchJson<T = unknown>(
  url: string,
  options?: RequestInit,
  fallback?: T
): Promise<{ data: T | null; success: boolean; error?: string }> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      return {
        data: fallback || null,
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await safeResponseJson<T>(response, fallback);

    return {
      data,
      success: data !== null,
      error: data === null ? 'Failed to parse JSON' : undefined
    };
  } catch (error) {
    return {
      data: fallback || null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Safe request body parsing for API routes
 */
export async function safeParseRequestBody<T = unknown>(
  request: Request,
  fallback?: T
): Promise<{ data: T | null; success: boolean; error?: string }> {
  try {
    const text = await request.text();

    if (!text.trim()) {
      return {
        data: fallback || null,
        success: false,
        error: 'Request body is empty'
      };
    }

    const data = safeJsonParse<T>(text, fallback);

    return {
      data,
      success: data !== null,
      error: data === null ? 'Invalid JSON in request body' : undefined
    };
  } catch (error) {
    return {
      data: fallback || null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Validate JSON response structure
 */
export function validateJsonStructure<T>(
  data: unknown,
  validator: (data: unknown) => data is T
): { isValid: boolean; data?: T; error?: string } {
  try {
    if (validator(data)) {
      return { isValid: true, data };
    } else {
      return { isValid: false, error: 'Data does not match expected structure' };
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Validation error'
    };
  }
}

/**
 * Safe JSON stringify with error handling
 */
export function safeJsonStringify<T = unknown>(
  data: T,
  fallback: string = '{}'
): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.warn('JSON stringify error:', error);
    return fallback;
  }
}
