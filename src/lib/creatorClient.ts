/**
 * Creator API client utilities
 * Handles fetching creator data with proper error handling and caching
 */

export interface CreatorScore {
  idHashed: string;
  handle: string;
  score: number;            // 0..1
  accuracy90d: number;      // 0..1
  joinedAt: string;         // ISO
  rank7d?: number | null;   // 1..3 for badge
  provisional: boolean;     // n<50
  counts: { resolved: number; pending: number; last90d: number; total: number };
}

export interface CreatorHistoryItem {
  day: string;
  score: number;
}

export interface CreatorHistory {
  period: '30d' | '90d';
  items: CreatorHistoryItem[];
}

export interface CreatorInsightLite {
  id: string;
  title: string;
  category: string;
  predicted: number;        // 0..1
  status: 'OPEN' | 'RESOLVED';
  resolved?: 'YES' | 'NO';
  createdAt: string;
}

/**
 * Safe JSON fetch with proper error handling for 204/304/non-JSON responses
 */
export async function safeFetchJSON<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(url, options);
    
    // Handle 304 Not Modified
    if (response.status === 304) {
      return null;
    }
    
    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }
    
    // Handle non-OK responses
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Response is not JSON');
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('safeFetchJSON error:', error);
    throw error;
  }
}

/**
 * Get creator score and basic info
 */
export async function getCreatorScore(id: string): Promise<CreatorScore> {
  const data = await safeFetchJSON<CreatorScore>(`/api/public/creators/${encodeURIComponent(id)}/score`);
  if (!data) {
    throw new Error('Creator not found');
  }
  return data;
}

/**
 * Get creator history data
 */
export async function getCreatorHistory(id: string, period: '30d' | '90d' = '90d'): Promise<CreatorHistory> {
  const data = await safeFetchJSON<CreatorHistory>(`/api/public/creators/${encodeURIComponent(id)}/history?period=${period}`);
  if (!data) {
    throw new Error('Creator history not found');
  }
  return data;
}

/**
 * Get creator insights
 */
export async function getCreatorInsights(id: string, limit: number = 10): Promise<CreatorInsightLite[]> {
  const data = await safeFetchJSON<CreatorInsightLite[]>(`/api/public/creators/${encodeURIComponent(id)}/insights?limit=${limit}`);
  if (!data) {
    return [];
  }
  return data;
}

/**
 * Fetch all creator profile data in parallel
 */
export async function getCreatorProfileData(id: string) {
  try {
    const [score, history, insights] = await Promise.all([
      getCreatorScore(id),
      getCreatorHistory(id, '90d'),
      getCreatorInsights(id, 10)
    ]);
    
    return { score, history, insights };
  } catch (error) {
    console.error('Error fetching creator profile data:', error);
    throw error;
  }
}

/**
 * Safe parse for handling potential JSON parsing errors
 */
export function safeParse<T>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error);
    return null;
  }
}
