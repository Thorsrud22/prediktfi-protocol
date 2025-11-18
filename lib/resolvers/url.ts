/**
 * URL Resolution System
 * Fetches HTML content and performs fuzzy matching for automatic outcome proposals
 */

import { URL } from 'url';

export interface UrlResolverConfig {
  href: string;
  expect?: string;
  selector?: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  timeout?: number;
}

export interface UrlResolutionResult {
  proposed: 'YES' | 'NO' | null; // null = tvetydig/ingen forslag
  confidence: number; // 0-1
  evidence: {
    url: string;
    content: string;
    extractedText: string;
    matchedText?: string;
    method: string;
    timestamp: string;
  };
  reasoning: string;
}

/**
 * SSRF Protection - Block private IP ranges
 */
function isPrivateIP(hostname: string): boolean {
  // Block localhost and private IP ranges
  const privateRanges = [
    /^localhost$/i,
    /^127\./,           // 127.0.0.0/8
    /^10\./,            // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12
    /^192\.168\./,      // 192.168.0.0/16
    /^169\.254\./,      // 169.254.0.0/16 (link-local)
    /^::1$/,            // IPv6 localhost
    /^fe80:/i,          // IPv6 link-local
    /^fc00:/i,          // IPv6 unique local
    /^fd00:/i,          // IPv6 unique local
  ];
  
  return privateRanges.some(pattern => pattern.test(hostname));
}

/**
 * Validate and sanitize URL for SSRF protection
 */
function validateUrl(urlString: string): URL {
  let parsedUrl: URL;
  
  try {
    parsedUrl = new URL(urlString);
  } catch (error) {
    throw new Error(`Invalid URL: ${urlString}`);
  }
  
  // Only allow HTTP/HTTPS
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error(`Unsupported protocol: ${parsedUrl.protocol}`);
  }
  
  // Block private IPs
  if (isPrivateIP(parsedUrl.hostname)) {
    throw new Error(`Private IP addresses are not allowed: ${parsedUrl.hostname}`);
  }
  
  // Block common dangerous ports
  const dangerousPorts = ['22', '23', '25', '53', '80', '110', '143', '993', '995'];
  if (parsedUrl.port && dangerousPorts.includes(parsedUrl.port) && parsedUrl.protocol === 'http:') {
    // Allow port 80 for HTTP, but be cautious about others
    if (parsedUrl.port !== '80') {
      throw new Error(`Potentially dangerous port: ${parsedUrl.port}`);
    }
  }
  
  return parsedUrl;
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')           // Collapse whitespace
    .replace(/[^\w\s]/g, ' ')       // Remove special chars
    .replace(/\s+/g, ' ')           // Collapse again
    .trim();
}

/**
 * Extract text content from HTML
 */
function extractTextFromHtml(html: string): string {
  // Simple HTML tag removal (for security, we avoid using a full parser)
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // Remove styles
    .replace(/<[^>]+>/g, ' ')                         // Remove HTML tags
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')                 // Remove HTML entities
    .replace(/\s+/g, ' ')                             // Collapse whitespace
    .trim();
}

/**
 * Perform fuzzy matching between expected text and content
 */
function fuzzyMatch(expected: string, content: string): {
  matches: boolean;
  confidence: number;
  matchedText?: string;
} {
  const normalizedExpected = normalizeText(expected);
  const normalizedContent = normalizeText(content);
  
  // Exact match
  if (normalizedContent.includes(normalizedExpected)) {
    return {
      matches: true,
      confidence: 1.0,
      matchedText: expected
    };
  }
  
  // Word-based matching
  const expectedWords = normalizedExpected.split(' ').filter(w => w.length > 2);
  const contentWords = normalizedContent.split(' ');
  
  if (expectedWords.length === 0) {
    return { matches: false, confidence: 0 };
  }
  
  const matchedWords = expectedWords.filter(word => 
    contentWords.some(contentWord => 
      contentWord.includes(word) || 
      word.includes(contentWord) ||
      // Also check for similar words (basic similarity)
      (word.length > 3 && contentWord.length > 3 && 
       (word.startsWith(contentWord.substring(0, 3)) || contentWord.startsWith(word.substring(0, 3))))
    )
  );
  
  const wordMatchRatio = matchedWords.length / expectedWords.length;
  
  if (wordMatchRatio >= 0.7) {
    return {
      matches: true,
      confidence: wordMatchRatio,
      matchedText: matchedWords.join(' ')
    };
  } else if (wordMatchRatio >= 0.4) {
    return {
      matches: true,
      confidence: wordMatchRatio * 0.8, // Lower confidence for partial matches
      matchedText: matchedWords.join(' ')
    };
  }
  
  return { matches: false, confidence: wordMatchRatio };
}

/**
 * Resolve URL-based insight
 */
export async function resolveUrlInsight(
  canonical: string,
  config: UrlResolverConfig
): Promise<UrlResolutionResult> {
  const startTime = Date.now();
  
  try {
    // Validate URL for SSRF protection
    const validatedUrl = validateUrl(config.href);
    
    // Set up fetch options
    const fetchOptions: RequestInit = {
      method: config.method || 'GET',
      headers: {
        'User-Agent': 'PrediktFi-Resolver/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'close',
        ...config.headers
      },
      signal: AbortSignal.timeout(config.timeout || 15000), // 15 second timeout
      redirect: 'follow',
      mode: 'cors'
    };
    
    console.log(`🌐 Fetching URL: ${validatedUrl.href}`);
    
    // Fetch the content
    const response = await fetch(validatedUrl.href, fetchOptions);

    // Defend against undefined or non-standard fetch mocks
    if (!response || typeof (response as any).ok !== 'boolean') {
      throw new Error('Invalid response from fetch');
    }
    
    if (!response.ok) {
      const status = (response as any).status ?? 'unknown';
      const statusText = (response as any).statusText ?? 'Unknown error';
      throw new Error(`HTTP ${status}: ${statusText}`);
    }
    
    // Check content type
    const contentType =
      response.headers && typeof response.headers.get === 'function'
        ? response.headers.get('content-type') || ''
        : '';
    if (!contentType.includes('text/html') && !contentType.includes('application/json')) {
      throw new Error(`Unsupported content type: ${contentType || 'unknown'}`);
    }
    
    const html = typeof (response as any).text === 'function'
      ? await response.text()
      : '';
    const extractedText = extractTextFromHtml(html);
    
    console.log(`📄 Extracted ${extractedText.length} characters of text`);
    
    // If no expected text provided, we can't make a determination
    if (!config.expect) {
      return {
        proposed: null,
        confidence: 0,
        evidence: {
          url: validatedUrl.href,
          content: html.substring(0, 1000), // First 1000 chars for evidence
          extractedText: extractedText.substring(0, 500),
          method: config.method || 'GET',
          timestamp: new Date().toISOString()
        },
        reasoning: 'No expected text provided for comparison'
      };
    }
    
    // Perform fuzzy matching
    const matchResult = fuzzyMatch(config.expect, extractedText);
    
    // Determine proposal based on match
    let proposed: 'YES' | 'NO' | null = null;
    let reasoning = '';
    
    if (matchResult.confidence >= 0.8) {
      proposed = 'YES';
      reasoning = `High confidence match found: "${matchResult.matchedText}" (${Math.round(matchResult.confidence * 100)}% confidence)`;
    } else if (matchResult.confidence >= 0.5) {
      proposed = 'YES';
      reasoning = `Partial match found: "${matchResult.matchedText}" (${Math.round(matchResult.confidence * 100)}% confidence)`;
    } else if (matchResult.confidence > 0) {
      // Low confidence - no proposal
      proposed = null;
      reasoning = `Low confidence match (${Math.round(matchResult.confidence * 100)}%) - manual review recommended`;
    } else {
      proposed = 'NO';
      reasoning = `No matching text found for "${config.expect}"`;
    }
    
    const tookMs = Date.now() - startTime;
    console.log(`✅ URL resolution completed in ${tookMs}ms: ${proposed || 'NO_PROPOSAL'}`);
    
    return {
      proposed,
      confidence: matchResult.confidence,
      evidence: {
        url: validatedUrl.href,
        content: html.substring(0, 1000),
        extractedText: extractedText.substring(0, 500),
        matchedText: matchResult.matchedText,
        method: config.method || 'GET',
        timestamp: new Date().toISOString()
      },
      reasoning
    };
    
  } catch (error) {
    const tookMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`❌ URL resolution failed after ${tookMs}ms:`, errorMessage);
    
    return {
      proposed: null,
      confidence: 0,
      evidence: {
        url: config.href,
        content: '',
        extractedText: '',
        method: config.method || 'GET',
        timestamp: new Date().toISOString()
      },
      reasoning: `Failed to fetch URL: ${errorMessage}`
    };
  }
}

/**
 * Parse URL resolver configuration from resolverRef
 */
export function parseUrlConfig(resolverRef: string): UrlResolverConfig {
  try {
    const config = JSON.parse(resolverRef);
    return {
      href: config.href || config.url,
      expect: config.expect,
      selector: config.selector,
      method: config.method || 'GET',
      headers: config.headers,
      timeout: config.timeout || 15000
    };
  } catch (error) {
    throw new Error(`Invalid URL resolver configuration: ${resolverRef}`);
  }
}
