import 'server-only';
import { PrismaClient } from '@prisma/client';
import { UserTier, SubscriptionStatus, QuotaType, TrialTriggerType } from '@prisma/client';

const prisma = new PrismaClient();

export interface QuotaLimits {
  intentsWeekly: number;
  insightsDaily: number;
  quotesDaily: number;
}

export const QUOTA_LIMITS: Record<UserTier, QuotaLimits> = {
  FREE: {
    intentsWeekly: 5,
    insightsDaily: 10,
    quotesDaily: 20,
  },
  PRO: {
    intentsWeekly: 30,
    insightsDaily: 100,
    quotesDaily: 200,
  },
};

export interface UserSubscriptionInfo {
  [x: string]: any;
  tier: UserTier;
  isPro: boolean;
  isTrial: boolean;
  trialEndsAt?: Date;
  planExpiresAt?: Date;
  quotas: {
    intentsWeekly: { used: number; limit: number; remaining: number };
    insightsDaily: { used: number; limit: number; remaining: number };
    quotesDaily: { used: number; limit: number; remaining: number };
  };
}

/**
 * Get or create user subscription with quotas
 */
export async function getUserSubscription(walletId: string): Promise<UserSubscriptionInfo> {
  let subscription = await prisma.userSubscription.findUnique({
    where: { walletId },
    include: { quotas: true },
  });

  if (!subscription) {
    // Create new free subscription
    subscription = await prisma.userSubscription.create({
      data: {
        walletId,
        tier: 'FREE',
        status: 'ACTIVE',
        quotas: {
          create: [
            {
              quotaType: 'INTENTS_WEEKLY',
              limit: QUOTA_LIMITS.FREE.intentsWeekly,
              resetAt: getNextWeekReset(),
            },
            {
              quotaType: 'INSIGHTS_DAILY',
              limit: QUOTA_LIMITS.FREE.insightsDaily,
              resetAt: getNextDayReset(),
            },
            {
              quotaType: 'QUOTES_DAILY',
              limit: QUOTA_LIMITS.FREE.quotesDaily,
              resetAt: getNextDayReset(),
            },
          ],
        },
      },
      include: { quotas: true },
    });
  }

  // Check for active trial
  const activeTrial = await prisma.proTrial.findFirst({
    where: {
      walletId,
      isActive: true,
      endsAt: { gt: new Date() },
    },
    orderBy: { endsAt: 'desc' },
  });

  const isTrial = !!activeTrial;
  let effectiveTier = isTrial ? 'PRO' : subscription.tier;
  let isPro = effectiveTier === 'PRO';

  // Get current quotas
  const quotas = await getCurrentQuotas(subscription.id, effectiveTier);

  // Check if plan has expired (for paid plans)
  const planExpiresAt = subscription.planExpiresAt;
  const isPlanExpired = planExpiresAt ? new Date() > planExpiresAt : false;
  
  // If plan expired, downgrade to free
  if (isPlanExpired && subscription.tier === 'PRO') {
    await prisma.userSubscription.update({
      where: { id: subscription.id },
      data: { tier: 'FREE' },
    });
    effectiveTier = 'FREE';
    isPro = false;
  }

  return {
    tier: effectiveTier,
    isPro,
    isTrial,
    trialEndsAt: activeTrial?.endsAt,
    planExpiresAt: planExpiresAt || undefined,
    quotas,
  };
}

/**
 * Check if user can perform an action (quota check)
 */
export async function checkQuota(
  walletId: string,
  quotaType: QuotaType,
  amount: number = 1
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const subscription = await getUserSubscription(walletId);
  const quota = subscription.quotas[getQuotaKey(quotaType)];

  return {
    allowed: quota.remaining >= amount,
    remaining: quota.remaining,
    resetAt: getResetTime(quotaType),
  };
}

/**
 * Consume quota for an action
 */
export async function consumeQuota(
  walletId: string,
  quotaType: QuotaType,
  amount: number = 1
): Promise<boolean> {
  const subscription = await getUserSubscription(walletId);
  const quota = subscription.quotas[getQuotaKey(quotaType)];

  if (quota.remaining < amount) {
    return false;
  }

  // Update quota usage
  await prisma.userQuota.updateMany({
    where: {
      subscriptionId: subscription.subscription?.id,
      quotaType,
      resetAt: getResetTime(quotaType),
    },
    data: {
      used: { increment: amount },
    },
  });

  return true;
}

/**
 * Upgrade user to Pro tier
 */
export async function upgradeToPro(
  walletId: string,
  subscriptionId?: string,
  planExpiresAt?: Date
): Promise<void> {
  const expiresAt = planExpiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

  await prisma.userSubscription.upsert({
    where: { walletId },
    update: {
      tier: 'PRO',
      status: 'ACTIVE',
      subscriptionId,
      planExpiresAt: expiresAt,
    },
    create: {
      walletId,
      tier: 'PRO',
      status: 'ACTIVE',
      subscriptionId,
      planExpiresAt: expiresAt,
      quotas: {
        create: [
          {
            quotaType: 'INTENTS_WEEKLY',
            limit: QUOTA_LIMITS.PRO.intentsWeekly,
            resetAt: getNextWeekReset(),
          },
          {
            quotaType: 'INSIGHTS_DAILY',
            limit: QUOTA_LIMITS.PRO.insightsDaily,
            resetAt: getNextDayReset(),
          },
          {
            quotaType: 'QUOTES_DAILY',
            limit: QUOTA_LIMITS.PRO.quotesDaily,
            resetAt: getNextDayReset(),
          },
        ],
      },
    },
  });
}

/**
 * Start Pro trial for user
 */
export async function startProTrial(
  walletId: string,
  triggerType: TrialTriggerType,
  triggerData?: any
): Promise<void> {
  const trialEndsAt = new Date();
  trialEndsAt.setHours(trialEndsAt.getHours() + 24); // 24-hour trial

  await prisma.proTrial.create({
    data: {
      walletId,
      triggerType,
      triggerData: triggerData ? JSON.stringify(triggerData) : null,
      endsAt: trialEndsAt,
    },
  });
}

/**
 * Check if user can start a trial (not already on trial or Pro)
 */
export async function canStartTrial(walletId: string): Promise<boolean> {
  const subscription = await getUserSubscription(walletId);
  return !subscription.isPro && !subscription.isTrial;
}

/**
 * Get current quotas for subscription
 */
async function getCurrentQuotas(
  subscriptionId: string,
  tier: UserTier
): Promise<UserSubscriptionInfo['quotas']> {
  const limits = QUOTA_LIMITS[tier];
  const now = new Date();

  // Get or create current quotas
  const quotas = await Promise.all([
    getOrCreateQuota(subscriptionId, 'INTENTS_WEEKLY', limits.intentsWeekly, getNextWeekReset()),
    getOrCreateQuota(subscriptionId, 'INSIGHTS_DAILY', limits.insightsDaily, getNextDayReset()),
    getOrCreateQuota(subscriptionId, 'QUOTES_DAILY', limits.quotesDaily, getNextDayReset()),
  ]);

  return {
    intentsWeekly: {
      used: quotas[0].used,
      limit: quotas[0].limit,
      remaining: Math.max(0, quotas[0].limit - quotas[0].used),
    },
    insightsDaily: {
      used: quotas[1].used,
      limit: quotas[1].limit,
      remaining: Math.max(0, quotas[1].limit - quotas[1].used),
    },
    quotesDaily: {
      used: quotas[2].used,
      limit: quotas[2].limit,
      remaining: Math.max(0, quotas[2].limit - quotas[2].used),
    },
  };
}

async function getOrCreateQuota(
  subscriptionId: string,
  quotaType: QuotaType,
  limit: number,
  resetAt: Date
) {
  const quota = await prisma.userQuota.findUnique({
    where: {
      subscriptionId_quotaType_resetAt: {
        subscriptionId,
        quotaType,
        resetAt,
      },
    },
  });

  if (quota) {
    return quota;
  }

  return await prisma.userQuota.create({
    data: {
      subscriptionId,
      quotaType,
      limit,
      resetAt,
    },
  });
}

function getQuotaKey(quotaType: QuotaType): keyof UserSubscriptionInfo['quotas'] {
  switch (quotaType) {
    case 'INTENTS_WEEKLY':
      return 'intentsWeekly';
    case 'INSIGHTS_DAILY':
      return 'insightsDaily';
    case 'QUOTES_DAILY':
      return 'quotesDaily';
  }
}

function getResetTime(quotaType: QuotaType): Date {
  switch (quotaType) {
    case 'INTENTS_WEEKLY':
      return getNextWeekReset();
    case 'INSIGHTS_DAILY':
    case 'QUOTES_DAILY':
      return getNextDayReset();
  }
}

function getNextWeekReset(): Date {
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + (7 - now.getDay())); // Next Sunday
  nextWeek.setHours(0, 0, 0, 0);
  return nextWeek;
}

function getNextDayReset(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}
