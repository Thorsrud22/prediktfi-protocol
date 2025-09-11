/**
 * Social sharing utilities
 * Handles X (Twitter) sharing with UTM tracking
 */

export interface ShareData {
  idHashed: string;
  score: number;
  acc90d: number;
  handle: string;
  baseUrl?: string;
}

/**
 * Build X (Twitter) share URL with UTM tracking
 */
export function buildXShareUrl(data: ShareData): string {
  const baseUrl = data.baseUrl || 'https://prediktfi.com';
  const profileUrl = `${baseUrl}/creator/${data.idHashed}`;
  
  const scoreStr = data.score.toFixed(3);
  const accStr = (data.acc90d * 100).toFixed(1);
  
  const text = `Check out my prediction stats on @PrediktFi — Score ${scoreStr} (90d accuracy ${accStr}%). ${profileUrl}`;
  
  const params = new URLSearchParams({
    text,
    url: profileUrl,
    hashtags: 'PrediktFi,predictions,AI',
    via: 'PrediktFi',
    utm_source: 'x',
    utm_medium: 'social',
    utm_campaign: 'creator_profile'
  });
  
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * Copy link to clipboard with UTM tracking
 */
export function buildCopyLink(data: ShareData): string {
  const baseUrl = data.baseUrl || 'https://prediktfi.com';
  const profileUrl = `${baseUrl}/creator/${data.idHashed}`;
  
  const params = new URLSearchParams({
    utm_source: 'copy',
    utm_medium: 'link',
    utm_campaign: 'creator_profile'
  });
  
  return `${profileUrl}?${params.toString()}`;
}

/**
 * Generate share text for different platforms
 */
export function generateShareText(data: ShareData, platform: 'x' | 'linkedin' | 'generic' = 'generic'): string {
  const scoreStr = data.score.toFixed(3);
  const accStr = (data.acc90d * 100).toFixed(1);
  
  switch (platform) {
    case 'x':
      return `Check out my prediction stats on @PrediktFi — Score ${scoreStr} (90d accuracy ${accStr}%)`;
    case 'linkedin':
      return `I've been tracking my prediction accuracy on PrediktFi. Current score: ${scoreStr} with ${accStr}% accuracy over the last 90 days.`;
    case 'generic':
    default:
      return `My prediction performance on PrediktFi: Score ${scoreStr}, 90-day accuracy ${accStr}%`;
  }
}
