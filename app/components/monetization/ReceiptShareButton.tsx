'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';
import { trackReceiptShare } from '../../lib/trial';
import { getWalletIdentifier } from '../../lib/rate-limit-wallet';
import { isFeatureEnabled } from '../../lib/flags';
import { useToast } from '../ToastProvider';

interface ReceiptShareButtonProps {
  intentId: string;
  receiptId: string;
  platform: 'twitter' | 'linkedin' | 'facebook' | 'copy_trade';
  className?: string;
  children?: React.ReactNode;
}

export function ReceiptShareButton({ 
  intentId, 
  receiptId, 
  platform, 
  className, 
  children 
}: ReceiptShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleShare = async () => {
    if (!isFeatureEnabled('PRO_TRIALS')) {
      // Fallback to regular sharing without tracking
      shareToPlatform();
      return;
    }

    setLoading(true);
    try {
      // For client-side, we need to get wallet ID differently
      const walletId = localStorage.getItem('wallet_id') || '';
      if (walletId) {
        // Track the share for trial eligibility
        await trackReceiptShare(walletId, intentId, platform);
      }
      
      // Perform the actual share
      shareToPlatform();
      
      addToast({
        title: 'Shared!',
        description: 'Receipt shared successfully',
        variant: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to track share:', error);
      // Still perform the share even if tracking fails
      shareToPlatform();
    } finally {
      setLoading(false);
    }
  };

  const shareToPlatform = () => {
    const shareUrl = getShareUrl();
    const shareText = getShareText();
    
    switch (platform) {
      case 'twitter':
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
        break;
      case 'linkedin':
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
        break;
      case 'facebook':
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.open(facebookUrl, '_blank', 'noopener,noreferrer');
        break;
      case 'copy_trade':
        navigator.clipboard.writeText(shareText);
        break;
    }
  };

  const getShareUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return `${baseUrl}/receipts/${receiptId}`;
  };

  const getShareText = () => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return `Check out my trading result on Predikt! ${baseUrl}/receipts/${receiptId}`;
  };

  const getPlatformIcon = () => {
    switch (platform) {
      case 'twitter': return '🐦';
      case 'linkedin': return '💼';
      case 'facebook': return '📘';
      case 'copy_trade': return '📋';
      default: return '🔗';
    }
  };

  const getPlatformName = () => {
    switch (platform) {
      case 'twitter': return 'Twitter';
      case 'linkedin': return 'LinkedIn';
      case 'facebook': return 'Facebook';
      case 'copy_trade': return 'Copy Link';
      default: return 'Share';
    }
  };

  return (
    <Button
      onClick={handleShare}
      disabled={loading}
      className={className}
      variant="outline"
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      ) : (
        <>
          <span className="mr-2">{getPlatformIcon()}</span>
          {children || getPlatformName()}
        </>
      )}
    </Button>
  );
}
