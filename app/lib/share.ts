// Share URL builder with referral attribution support

interface ShareUrlOptions {
  ref?: string;
  creator?: string;
}

export function buildShareUrl(path: string, options?: ShareUrlOptions): string {
  // Get referral data from localStorage if available (client-side only)
  let ref = options?.ref;
  let creator = options?.creator;
  
  if (typeof window !== 'undefined') {
    ref = ref || localStorage.getItem('predikt:ref') || undefined;
    creator = creator || localStorage.getItem('predikt:creatorId') || undefined;
  }
  
  const url = new URL(path, typeof window !== 'undefined' ? window.location.origin : 'https://predikt.fi');
  
  if (ref && typeof ref === 'string' && ref.length <= 64) {
    url.searchParams.set('ref', ref.replace(/[^a-zA-Z0-9_-]/g, ''));
  }
  
  if (creator && typeof creator === 'string' && creator.length <= 64) {
    url.searchParams.set('creator', creator.replace(/[^a-zA-Z0-9_-]/g, ''));
  }
  
  return url.toString();
}

export function buildXShareUrl({ 
  question, 
  prob, 
  signature 
}: {
  question: string; 
  prob: number; 
  signature?: string;
}): string {
  const pct = Math.round(prob * 100);
  
  // Use canonical permalink when signature is available
  const shareUrl = signature 
    ? buildShareUrl(`/i/${signature}`)
    : buildShareUrl('/studio');
  
  const text = `I logged an AI-backed insight on-chain: "${question}" — Prob: ${pct}% • Verify: ${shareUrl} #Predikt`;
  
  const encodedText = encodeURIComponent(text);
  return `https://twitter.com/intent/tweet?text=${encodedText}`;
}

// Store referral data from URL params
export function persistReferralData(searchParams: URLSearchParams): void {
  if (typeof window === 'undefined') return;
  
  const ref = searchParams.get('ref');
  const creator = searchParams.get('creator');
  
  if (ref && typeof ref === 'string' && ref.length <= 64) {
    const sanitized = ref.replace(/[^a-zA-Z0-9_-]/g, '');
    if (sanitized) {
      localStorage.setItem('predikt:ref', sanitized);
    }
  }
  
  if (creator && typeof creator === 'string' && creator.length <= 64) {
    const sanitized = creator.replace(/[^a-zA-Z0-9_-]/g, '');
    if (sanitized) {
      localStorage.setItem('predikt:creatorId', sanitized);
    }
  }
}
