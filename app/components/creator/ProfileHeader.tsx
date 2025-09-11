'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { CreatorScore } from '@/src/lib/creatorClient';
import { buildXShareUrl, buildCopyLink } from '@/src/lib/share';
import { useToast } from '../ToastProvider';
import { trackClient } from '@/lib/analytics';

interface ProfileHeaderProps {
  creator: CreatorScore;
  onShare?: (channel: 'x' | 'copy') => void;
}

export default function ProfileHeader({ creator, onShare }: ProfileHeaderProps) {
  const { addToast } = useToast();
  const { connected, publicKey } = useWallet();
  
  // Check if the logged-in user matches the creator
  // For now, we'll use a simple check - in a real implementation, you'd need to
  // map wallet addresses to creator handles through your user system
  const isOwnProfile = connected && publicKey && 
    localStorage.getItem('creator-handle') === creator.handle;
  
  // Generate share URLs
  const xShareUrl = buildXShareUrl({
    idHashed: creator.idHashed,
    score: creator.score,
    acc90d: creator.accuracy90d,
    handle: creator.handle
  });
  
  const copyLink = buildCopyLink({
    idHashed: creator.idHashed,
    score: creator.score,
    acc90d: creator.accuracy90d,
    handle: creator.handle
  });
  
  const handleXShare = () => {
    window.open(xShareUrl, '_blank', 'noopener,noreferrer');
    onShare?.('x');
  };
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(copyLink);
      onShare?.('copy');
      
      addToast({
        title: "Link copied — share your profile on X",
        description: "Profile link copied to clipboard",
        variant: "success",
        duration: 4000,
        actionLabel: "Open X",
        onAction: () => window.open(xShareUrl, '_blank', 'noopener,noreferrer'),
      });
    } catch (error) {
      console.error('Failed to copy link:', error);
      addToast({
        title: "Copy failed",
        description: "Could not copy link to clipboard",
        variant: "error",
        duration: 3000,
      });
    }
  };
  
  const handleOpenStudio = () => {
    // Track the event
    trackClient('creator_profile_open_studio_clicked', {
      creatorId: creator.idHashed,
      handle: creator.handle,
      referrer_path: document.referrer || '',
      ts: Date.now(),
    });
    
    // Navigate to studio
    window.location.href = '/studio';
  };
  
  // Get rank badge if applicable
  const getRankBadge = () => {
    if (!creator.rank7d || creator.rank7d > 3) return null;
    
    const badges = {
      1: { text: 'Top 1', gradient: 'from-yellow-400 to-yellow-600' },
      2: { text: 'Top 2', gradient: 'from-gray-300 to-gray-500' },
      3: { text: 'Top 3', gradient: 'from-amber-600 to-amber-800' }
    };
    
    const badge = badges[creator.rank7d as keyof typeof badges];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${badge.gradient} text-white`}>
        {badge.text}
      </span>
    );
  };
  
  return (
    <div className="bg-slate-800 rounded-2xl p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Left side - Avatar and info */}
        <div className="flex items-center space-x-4 md:space-x-6">
          {/* Avatar with gradient */}
          <div 
            className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold text-white"
            role="img"
            aria-label={`Avatar for ${creator.handle}`}
          >
            {creator.handle.charAt(0).toUpperCase()}
          </div>
          
          {/* Creator info */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{creator.handle}</h1>
            <p className="text-slate-400 text-sm md:text-base">
              Joined {new Date(creator.joinedAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
            
            {/* Badges */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {getRankBadge()}
              {creator.provisional && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-600 text-slate-300">
                  Provisional
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Right side - Score and actions */}
        <div className="text-center md:text-right">
          <div className="text-3xl md:text-4xl font-bold text-white">
            {creator.score.toFixed(3)}
          </div>
          <div className="text-slate-400 text-sm flex items-center justify-center md:justify-end gap-1">
            Predikt Score
            <div className="group relative">
              <svg className="w-4 h-4 text-slate-500 hover:text-slate-300 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                Based on Brier score: 1 - (average squared error). Lower Brier = higher score.
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
              </div>
            </div>
          </div>
          <div className="text-slate-300 text-sm mt-1">
            90d accuracy {(creator.accuracy90d * 100).toFixed(1)}%
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2 mt-4 justify-center md:justify-end">
            {isOwnProfile && (
              <button
                onClick={handleOpenStudio}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                aria-label="Open in Studio"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Open in Studio</span>
              </button>
            )}
            
            <button
              onClick={handleXShare}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
              aria-label="Share profile on X with OG image"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>Share on X (with OG image)</span>
            </button>
            
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
              aria-label="Copy profile link to clipboard"
            >
              Copy link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
