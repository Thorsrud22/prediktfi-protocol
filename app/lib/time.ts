export function timeAgo(timestamp: number | string | Date): string {
  const now = Date.now();
  const ts = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  const diffMs = now - ts;
  
  if (diffMs < 60000) return "just now"; // < 1 minute
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m`; // < 1 hour
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h`; // < 1 day
  if (diffMs < 172800000) return "yesterday"; // < 2 days
  if (diffMs < 604800000) return `${Math.floor(diffMs / 86400000)}d`; // < 1 week
  
  // For older timestamps, use simple date
  return new Date(ts).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

export function formatHorizon(horizon: string): string {
  const horizonMap: Record<string, string> = {
    '1w': '1 week',
    '1m': '1 month', 
    '3m': '3 months',
    '6m': '6 months',
    '1y': '1 year',
    '2y': '2 years'
  };
  return horizonMap[horizon] || horizon;
}

export function formatTs(timestamp: number | string | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
