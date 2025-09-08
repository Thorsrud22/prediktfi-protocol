import 'server-only';
import { PrismaClient } from '@prisma/client';
import { TrialTriggerType } from '@prisma/client';
import { startProTrial, canStartTrial } from './subscription';

const prisma = new PrismaClient();

export interface TrialEligibility {
  canStart: boolean;
  reason?: string;
  sharedCount?: number;
  requiredCount?: number;
}

/**
 * Check if user is eligible for Pro trial via sharing receipts
 */
export async function checkTrialEligibility(walletId: string): Promise<TrialEligibility> {
  // Check if user can start any trial
  const canStart = await canStartTrial(walletId);
  if (!canStart) {
    return {
      canStart: false,
      reason: 'Already on Pro or active trial',
    };
  }

  // Count shared receipts in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const sharedCount = await prisma.socialShare.count({
    where: {
      walletId,
      createdAt: { gte: sevenDaysAgo },
    },
  });

  const requiredCount = 3;
  const canStartTrial = sharedCount >= requiredCount;

  return {
    canStart: canStartTrial,
    reason: canStartTrial 
      ? undefined 
      : `Need ${requiredCount - sharedCount} more shared receipts`,
    sharedCount,
    requiredCount,
  };
}

/**
 * Start Pro trial for user who shared enough receipts
 */
export async function startTrialFromSharing(walletId: string): Promise<{ success: boolean; message: string }> {
  const eligibility = await checkTrialEligibility(walletId);
  
  if (!eligibility.canStart) {
    return {
      success: false,
      message: eligibility.reason || 'Cannot start trial',
    };
  }

  try {
    await startProTrial(walletId, 'SHARE_RECEIPTS', {
      sharedCount: eligibility.sharedCount,
      requiredCount: eligibility.requiredCount,
    });

    return {
      success: true,
      message: 'Pro trial started! You have 24 hours of Pro access.',
    };
  } catch (error) {
    console.error('Failed to start trial:', error);
    return {
      success: false,
      message: 'Failed to start trial. Please try again.',
    };
  }
}

/**
 * Track a receipt share for trial eligibility
 */
export async function trackReceiptShare(
  walletId: string,
  intentId: string,
  platform: string,
  shareUrl?: string
): Promise<void> {
  await prisma.socialShare.create({
    data: {
      walletId,
      intentId,
      platform,
      shareUrl,
    },
  });
}

/**
 * Get trial status for user
 */
export async function getTrialStatus(walletId: string): Promise<{
  isOnTrial: boolean;
  trialEndsAt?: Date;
  timeRemaining?: number; // minutes
}> {
  const trial = await prisma.proTrial.findFirst({
    where: {
      walletId,
      isActive: true,
      endsAt: { gt: new Date() },
    },
    orderBy: { endsAt: 'desc' },
  });

  if (!trial) {
    return { isOnTrial: false };
  }

  const now = new Date();
  const timeRemaining = Math.max(0, Math.floor((trial.endsAt.getTime() - now.getTime()) / (1000 * 60)));

  return {
    isOnTrial: true,
    trialEndsAt: trial.endsAt,
    timeRemaining,
  };
}
