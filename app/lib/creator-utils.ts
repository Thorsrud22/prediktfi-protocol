// Creator utility functions for admin hub

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple consecutive hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

export function buildRefUrl(siteUrl: string, marketId: string, creatorId: string, ref?: string): string {
  const baseUrl = siteUrl || "http://localhost:3000";
  const marketPath = `/market/${encodeURIComponent(marketId)}`;
  
  const url = new URL(marketPath, baseUrl);
  
  // Use ref if provided, otherwise fall back to creatorId
  const refValue = ref || creatorId;
  if (refValue) {
    url.searchParams.set("ref", refValue);
  }
  if (creatorId) {
    url.searchParams.set("creator", creatorId);
  }
  
  return url.toString();
}

export function generateMarketId(title: string): string {
  const slug = slugifyTitle(title);
  const year = new Date().getFullYear();
  const suffix = `-${year}`;
  
  // Ensure we have a reasonable base slug
  const baseSlug = slug || 'market';
  
  return baseSlug + suffix;
}
