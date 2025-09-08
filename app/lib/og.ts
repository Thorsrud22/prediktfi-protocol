// OG Image generation helpers for consistent branding and styling

export interface OGColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  text: string;
  textMuted: string;
  background: string;
  surface: string;
  border: string;
}

export const colors: OGColors = {
  primary: '#3b82f6',
  secondary: '#0d9488', 
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.8)',
  background: 'linear-gradient(135deg, #1e1b4b 0%, #0d9488 50%, #2563eb 100%)',
  surface: 'rgba(255, 255, 255, 0.1)',
  border: 'rgba(255, 255, 255, 0.2)',
};

/**
 * Returns proper cache headers for OG images
 */
export function getCacheHeaders() {
  return {
    'Cache-Control': 's-maxage=86400, stale-while-revalidate=604800',
    'Content-Type': 'image/png',
  };
}

/**
 * Truncates text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Get color for probability percentage
 */
export function getProbabilityColor(percentage: number): string {
  if (percentage >= 70) return colors.success;
  if (percentage >= 30) return colors.warning;
  return colors.error;
}

/**
 * Create circular gauge SVG path
 */
export function createCircularGaugePath(percentage: number, radius: number) {
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return {
    radius,
    circumference,
    strokeDasharray,
    strokeDashoffset,
    color: getProbabilityColor(percentage)
  };
}

/**
 * Get styles for verification badge
 */
export function getVerificationBadgeStyles(verified: boolean, size: 'sm' | 'md' | 'lg' = 'md') {
  const sizeStyles = {
    sm: { padding: '4px 8px', fontSize: '14px' },
    md: { padding: '8px 16px', fontSize: '18px' },
    lg: { padding: '12px 24px', fontSize: '24px' }
  };
  
  return {
    ...sizeStyles[size],
    background: verified ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
    borderRadius: '20px',
    border: `1px solid ${verified ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
    color: verified ? colors.success : colors.warning,
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  };
}

/**
 * Get wordmark styles
 */
export function getWordmarkStyles(size: 'sm' | 'md' | 'lg' = 'md') {
  const sizeStyles = {
    sm: { fontSize: '16px', iconSize: '20px' },
    md: { fontSize: '24px', iconSize: '32px' },
    lg: { fontSize: '32px', iconSize: '48px' }
  };
  
  return sizeStyles[size];
}
