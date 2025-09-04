import { NextRequest } from 'next/server';

export interface PlanInfo {
  isPro: boolean;
  plan: 'pro' | 'free';
}

/**
 * Get plan information from httpOnly cookie in request
 * Fallback to 'free' if cookie missing or invalid
 */
export function getPlanFromRequest(req: NextRequest): PlanInfo {
  const planCookie = req.cookies.get('predikt_plan')?.value;
  
  if (planCookie === 'pro') {
    return { isPro: true, plan: 'pro' };
  }
  
  return { isPro: false, plan: 'free' };
}

/**
 * Convenient helper to check if request is from Pro user
 */
export function isProRequest(req: NextRequest): boolean {
  return getPlanFromRequest(req).isPro;
}

/**
 * Set production-secure Pro cookie with proper security flags
 * Always sets: httpOnly, secure (in prod), sameSite, path, maxAge, domain (if configured)
 */
export function setProCookie(response: Response, plan: 'pro' | 'free' = 'pro'): void {
  const isProd = process.env.NODE_ENV === 'production';
  const baseUrl = process.env.PREDIKT_BASE_URL || '';
  
  // Extract domain from PREDIKT_BASE_URL if same domain
  let domain: string | undefined;
  if (baseUrl && isProd) {
    try {
      const url = new URL(baseUrl);
      domain = url.hostname;
    } catch {
      // Invalid URL, no domain
    }
  }
  
  const cookieOptions: string[] = [
    `predikt_plan=${plan}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=31536000' // 1 year
  ];
  
  if (isProd) {
    cookieOptions.push('Secure');
  }
  
  if (domain) {
    cookieOptions.push(`Domain=${domain}`);
  }
  
  const cookieString = cookieOptions.join('; ');
  response.headers.set('Set-Cookie', cookieString);
}
