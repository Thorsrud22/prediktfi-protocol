/**
 * SVG receipt generator for shareable prediction cards
 */

export interface PredictionReceiptData {
  id: string;
  statement: string;
  probability: number;
  deadline: Date;
  topic: string;
  hash: string;
  isCommitted: boolean;
  createdAt: Date;
  userName?: string;
  userAddress?: string;
}

export interface ReceiptOptions {
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
  showHash?: boolean;
  showCommitment?: boolean;
}

/**
 * Generate SVG receipt for a prediction
 */
export function generatePredictionReceipt(
  data: PredictionReceiptData,
  options: ReceiptOptions = {}
): string {
  const {
    width = 400,
    height = 600,
    theme = 'light',
    showHash = true,
    showCommitment = true,
  } = options;

  const colors = getThemeColors(theme);
  const padding = 20;
  const contentWidth = width - (padding * 2);

  // Calculate text wrapping for statement
  const maxLineLength = Math.floor(contentWidth / 8); // Approximate characters per line
  const wrappedStatement = wrapText(data.statement, maxLineLength);
  const statementLines = wrappedStatement.split('\n');

  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.gradientStart};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.gradientEnd};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.1"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGradient)" rx="16"/>
  
  <!-- Header -->
  <rect x="${padding}" y="${padding}" width="${contentWidth}" height="60" fill="${colors.headerBg}" rx="8" filter="url(#shadow)"/>
  <text x="${width/2}" y="${padding + 25}" text-anchor="middle" fill="${colors.headerText}" font-family="Arial, sans-serif" font-size="12" font-weight="bold">
    🔮 PREDIKT PROOF RECEIPT
  </text>
  <text x="${width/2}" y="${padding + 45}" text-anchor="middle" fill="${colors.headerSubtext}" font-family="Arial, sans-serif" font-size="10">
    Verified Prediction Platform
  </text>
  
  <!-- Topic Badge -->
  <rect x="${padding + 10}" y="${padding + 80}" width="80" height="24" fill="${colors.topicBg}" rx="12"/>
  <text x="${padding + 50}" y="${padding + 96}" text-anchor="middle" fill="${colors.topicText}" font-family="Arial, sans-serif" font-size="10" font-weight="bold">
    ${getTopicEmoji(data.topic)} ${data.topic.toUpperCase()}
  </text>
  
  <!-- Status Badge -->
  <rect x="${width - padding - 90}" y="${padding + 80}" width="80" height="24" fill="${getStatusColor(data.isCommitted)}" rx="12"/>
  <text x="${width - padding - 50}" y="${padding + 96}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="9" font-weight="bold">
    ${data.isCommitted ? '⛓️ COMMITTED' : '📝 DRAFT'}
  </text>
  
  <!-- Statement -->
  <rect x="${padding}" y="${padding + 120}" width="${contentWidth}" height="${60 + (statementLines.length * 16)}" fill="${colors.cardBg}" rx="8" filter="url(#shadow)"/>
  <text x="${padding + 15}" y="${padding + 140}" fill="${colors.labelText}" font-family="Arial, sans-serif" font-size="10" font-weight="bold">
    PREDICTION STATEMENT
  </text>
  ${statementLines.map((line, index) => 
    `<text x="${padding + 15}" y="${padding + 160 + (index * 16)}" fill="${colors.valueText}" font-family="Arial, sans-serif" font-size="12">${escapeXml(line)}</text>`
  ).join('')}
  
  <!-- Probability -->
  <rect x="${padding}" y="${padding + 220 + (statementLines.length * 16)}" width="${contentWidth/2 - 5}" height="80" fill="${colors.cardBg}" rx="8" filter="url(#shadow)"/>
  <text x="${padding + 15}" y="${padding + 240 + (statementLines.length * 16)}" fill="${colors.labelText}" font-family="Arial, sans-serif" font-size="10" font-weight="bold">
    PROBABILITY
  </text>
  <text x="${padding + 15}" y="${padding + 265 + (statementLines.length * 16)}" fill="${colors.probabilityText}" font-family="Arial, sans-serif" font-size="28" font-weight="bold">
    ${(data.probability * 100).toFixed(0)}%
  </text>
  <text x="${padding + 15}" y="${padding + 285 + (statementLines.length * 16)}" fill="${colors.labelText}" font-family="Arial, sans-serif" font-size="9">
    Confidence Level
  </text>
  
  <!-- Deadline -->
  <rect x="${padding + contentWidth/2 + 5}" y="${padding + 220 + (statementLines.length * 16)}" width="${contentWidth/2 - 5}" height="80" fill="${colors.cardBg}" rx="8" filter="url(#shadow)"/>
  <text x="${padding + contentWidth/2 + 20}" y="${padding + 240 + (statementLines.length * 16)}" fill="${colors.labelText}" font-family="Arial, sans-serif" font-size="10" font-weight="bold">
    DEADLINE
  </text>
  <text x="${padding + contentWidth/2 + 20}" y="${padding + 265 + (statementLines.length * 16)}" fill="${colors.valueText}" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
    ${formatDate(data.deadline)}
  </text>
  <text x="${padding + contentWidth/2 + 20}" y="${padding + 285 + (statementLines.length * 16)}" fill="${colors.labelText}" font-family="Arial, sans-serif" font-size="9">
    ${getDaysUntil(data.deadline)} days left
  </text>
  
  ${showHash ? `
  <!-- Hash -->
  <rect x="${padding}" y="${padding + 320 + (statementLines.length * 16)}" width="${contentWidth}" height="40" fill="${colors.cardBg}" rx="8" filter="url(#shadow)"/>
  <text x="${padding + 15}" y="${padding + 335 + (statementLines.length * 16)}" fill="${colors.labelText}" font-family="Arial, sans-serif" font-size="10" font-weight="bold">
    PREDICTION HASH
  </text>
  <text x="${padding + 15}" y="${padding + 350 + (statementLines.length * 16)}" fill="${colors.hashText}" font-family="Monaco, monospace" font-size="8">
    ${data.hash}
  </text>
  ` : ''}
  
  ${showCommitment && data.isCommitted ? `
  <!-- Commitment Info -->
  <rect x="${padding}" y="${padding + 380 + (statementLines.length * 16)}" width="${contentWidth}" height="50" fill="${colors.commitmentBg}" rx="8" filter="url(#shadow)"/>
  <text x="${padding + 15}" y="${padding + 395 + (statementLines.length * 16)}" fill="${colors.commitmentText}" font-family="Arial, sans-serif" font-size="10" font-weight="bold">
    ⛓️ BLOCKCHAIN VERIFIED
  </text>
  <text x="${padding + 15}" y="${padding + 410 + (statementLines.length * 16)}" fill="${colors.commitmentText}" font-family="Arial, sans-serif" font-size="9">
    This prediction is immutably recorded on Solana blockchain
  </text>
  <text x="${padding + 15}" y="${padding + 425 + (statementLines.length * 16)}" fill="${colors.commitmentText}" font-family="Arial, sans-serif" font-size="8">
    Committed: ${formatDateTime(data.createdAt)}
  </text>
  ` : ''}
  
  <!-- Footer -->
  <rect x="${padding}" y="${height - 60}" width="${contentWidth}" height="40" fill="${colors.footerBg}" rx="8"/>
  <text x="${width/2}" y="${height - 35}" text-anchor="middle" fill="${colors.footerText}" font-family="Arial, sans-serif" font-size="8">
    Generated by Predikt Protocol • predikt.fi
  </text>
  <text x="${width/2}" y="${height - 20}" text-anchor="middle" fill="${colors.footerSubtext}" font-family="Arial, sans-serif" font-size="7">
    ID: ${data.id.slice(0, 8)}... • Created: ${formatDate(data.createdAt)}
  </text>
</svg>`.trim();

  return svg;
}

/**
 * Get theme colors
 */
function getThemeColors(theme: 'light' | 'dark') {
  if (theme === 'dark') {
    return {
      gradientStart: '#1a1a2e',
      gradientEnd: '#16213e',
      headerBg: '#2d3748',
      headerText: '#ffffff',
      headerSubtext: '#a0aec0',
      cardBg: '#2d3748',
      labelText: '#a0aec0',
      valueText: '#ffffff',
      probabilityText: '#4299e1',
      hashText: '#9ca3af',
      topicBg: '#4a5568',
      topicText: '#ffffff',
      commitmentBg: '#553c9a',
      commitmentText: '#e9d8fd',
      footerBg: '#2d3748',
      footerText: '#a0aec0',
      footerSubtext: '#718096',
    };
  }
  
  return {
    gradientStart: '#f7fafc',
    gradientEnd: '#edf2f7',
    headerBg: '#ffffff',
    headerText: '#2d3748',
    headerSubtext: '#718096',
    cardBg: '#ffffff',
    labelText: '#718096',
    valueText: '#2d3748',
    probabilityText: '#3182ce',
    hashText: '#6b7280',
    topicBg: '#4299e1',
    topicText: '#ffffff',
    commitmentBg: '#805ad5',
    commitmentText: '#ffffff',
    footerBg: '#f7fafc',
    footerText: '#718096',
    footerSubtext: '#a0aec0',
  };
}

/**
 * Get status color based on commitment
 */
function getStatusColor(isCommitted: boolean): string {
  return isCommitted ? '#805ad5' : '#718096';
}

/**
 * Get topic emoji
 */
function getTopicEmoji(topic: string): string {
  const emojis: Record<string, string> = {
    'Cryptocurrency': '₿',
    'Technology': '💻',
    'Politics': '🏛️',
    'Sports': '⚽',
    'Weather': '🌤️',
  };
  return emojis[topic] || '📊';
}

/**
 * Wrap text to fit within specified line length
 */
function wrapText(text: string, maxLength: number): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length <= maxLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is longer than maxLength, force break
        lines.push(word.slice(0, maxLength));
        currentLine = word.slice(maxLength);
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.join('\n');
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format date and time for display
 */
function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get days until deadline
 */
function getDaysUntil(deadline: Date): number {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Escape XML characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Convert SVG to data URL for sharing
 */
export function svgToDataUrl(svg: string): string {
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Download SVG as file
 */
export function downloadSvg(svg: string, filename: string): void {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
