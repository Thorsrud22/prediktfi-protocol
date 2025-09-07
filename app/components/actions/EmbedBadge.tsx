/**
 * Embed Badge Component
 * Social proof badge for embedding in external sites
 */

'use client';

import { useState } from 'react';

interface EmbedBadgeProps {
  intentId: string;
  status: 'simulated' | 'executed' | 'failed';
  performance?: {
    expectedReturn: number;
    confidence: number;
  };
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}

export default function EmbedBadge({ 
  intentId, 
  status, 
  performance, 
  size = 'medium',
  showDetails = true 
}: EmbedBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusColor = () => {
    switch (status) {
      case 'simulated':
        return 'bg-blue-500';
      case 'executed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'simulated':
        return '🧪';
      case 'executed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-xs px-2 py-1';
      case 'medium':
        return 'text-sm px-3 py-2';
      case 'large':
        return 'text-base px-4 py-3';
      default:
        return 'text-sm px-3 py-2';
    }
  };

  const handleClick = () => {
    // Open the receipt in a new tab
    window.open(`/receipt/${intentId}`, '_blank');
  };

  return (
    <div
      className={`inline-flex items-center space-x-2 ${getSizeClasses()} bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Status Indicator */}
      <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${isHovered ? 'animate-pulse' : ''}`} />
      
      {/* Icon */}
      <span className="text-lg">{getStatusIcon()}</span>
      
      {/* Content */}
      <div className="flex flex-col">
        <div className="font-medium text-gray-900">
          Predikt Protocol
        </div>
        {showDetails && performance && (
          <div className="text-xs text-gray-600">
            {performance.expectedReturn > 0 ? '+' : ''}{performance.expectedReturn.toFixed(1)}% • {Math.round(performance.confidence * 100)}% confidence
          </div>
        )}
      </div>
      
      {/* Arrow */}
      <div className="text-gray-400">
        <svg 
          className={`w-4 h-4 transition-transform ${isHovered ? 'translate-x-1' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Embed Code Generator
 */
export function generateEmbedCode(intentId: string, options: {
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
  showDetails?: boolean;
} = {}) {
  const { width = 300, height = 80, theme = 'light', showDetails = true } = options;
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://predikt.fi';
  const embedUrl = `${baseUrl}/embed/badge/${intentId}?theme=${theme}&details=${showDetails}`;
  
  return `
<iframe 
  src="${embedUrl}" 
  width="${width}" 
  height="${height}" 
  frameborder="0" 
  scrolling="no"
  style="border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
  title="Predikt Protocol Trading Receipt"
></iframe>
  `.trim();
}

/**
 * Social Media Share Component
 */
export function SocialShare({ intentId, performance }: { intentId: string, performance?: any }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://predikt.fi';
  const shareUrl = `${baseUrl}/receipt/${intentId}`;
  const ogImageUrl = `${baseUrl}/api/og/receipt/${intentId}`;
  
  const shareText = performance 
    ? `Just made a ${performance.expectedReturn > 0 ? '+' : ''}${performance.expectedReturn?.toFixed(1)}% trade on Predikt Protocol! 🚀`
    : `Check out my trading strategy on Predikt Protocol! 🚀`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Share:</span>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        title="Share on Twitter"
      >
        🐦
      </a>
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
        title="Share on LinkedIn"
      >
        💼
      </a>
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        title="Share on Facebook"
      >
        📘
      </a>
      <button
        onClick={() => navigator.clipboard.writeText(shareUrl)}
        className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        title="Copy Link"
      >
        🔗
      </button>
    </div>
  );
}
