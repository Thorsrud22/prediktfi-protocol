/**
 * Weekly Analytics Digest
 * Aggregates view→copy→sign funnel data and sends to webhook
 */

import { prisma } from '../../../app/lib/prisma';
import { ANALYTICS_EVENT_TYPES, hashModelId } from './events';
import { getBucket } from './ab';

interface ModelFunnelMetrics {
  modelIdHash: string;
  modelId?: string; // Only for internal processing, not sent to webhook
  views: number;
  copyClicks: number;
  intentsCreated: number;
  intentsExecuted: number;
  viewToCopyRate: number;
  copyToSignRate: number;
  viewToSignRate: number;
  contextShown?: number; // A/B test context events
  contextHidden?: number;
}

interface ABTestMetrics {
  bucketA: {
    views: number;
    copyClicks: number;
    intentsCreated: number;
    intentsExecuted: number;
    contextShown: number;
    viewToCopyRate: number;
    copyToSignRate: number;
    viewToSignRate: number;
  };
  bucketB: {
    views: number;
    copyClicks: number;
    intentsCreated: number;
    intentsExecuted: number;
    contextHidden: number;
    viewToCopyRate: number;
    copyToSignRate: number;
    viewToSignRate: number;
  };
  significance: {
    viewToCopyPValue: number;
    copyToSignPValue: number;
    viewToSignPValue: number;
  };
  ctaTest?: {
    primaryAbove: {
      views: number;
      copyClicks: number;
      viewToCopyRate: number;
    };
    inlineBelow: {
      views: number;
      copyClicks: number;
      viewToCopyRate: number;
    };
    significance: {
      viewToCopyPValue: number;
    };
  };
}

interface CreatorLeaderboardData {
  top5_7d: Array<{
    creatorIdHashed: string;
    score: number;
    accuracy: number;
    consistency: number;
    volumeScore: number;
    recencyScore: number;
    maturedN: number;
    isProvisional: boolean;
  }>;
  top5_30d: Array<{
    creatorIdHashed: string;
    score: number;
    accuracy: number;
    consistency: number;
    volumeScore: number;
    recencyScore: number;
    maturedN: number;
    isProvisional: boolean;
  }>;
  movers: Array<{
    creatorIdHashed: string;
    scoreChange: number;
    trend: 'up' | 'down' | 'flat';
  }>;
  provisionalToStable: number; // Number of creators who crossed 50 matured threshold
}

interface LeaderboardResponse {
  items: Array<{
    creatorIdHashed: string;
    score: number;
    accuracy: number;
    consistency: number;
    volumeScore: number;
    recencyScore: number;
    maturedN: number;
    isProvisional: boolean;
  }>;
}

interface WeeklyDigestData {
  weekStart: Date;
  weekEnd: Date;
  totalViews: number;
  totalCopyClicks: number;
  totalIntentsCreated: number;
  totalIntentsExecuted: number;
  topModelsByViewToCopy: ModelFunnelMetrics[];
  topModelsByCopyToSign: ModelFunnelMetrics[];
  overallFunnelRates: {
    viewToCopyRate: number;
    copyToSignRate: number;
    viewToSignRate: number;
  };
  abTestMetrics?: ABTestMetrics; // A/B test results
  creatorLeaderboard?: CreatorLeaderboardData; // Creator leaderboard data
}

/**
 * Get date range for the previous week (Monday to Sunday) in UTC
 */
function getPreviousWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const currentDay = now.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate days to subtract to get to last Monday UTC
  const daysToLastMonday = currentDay === 0 ? 6 : currentDay - 1; // If Sunday, go back 6 days
  const lastMonday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - daysToLastMonday - 7, // Go back one more week
    0, 0, 0, 0
  ));
  
  // Last Sunday (end of previous week) UTC
  const lastSunday = new Date(Date.UTC(
    lastMonday.getUTCFullYear(),
    lastMonday.getUTCMonth(),
    lastMonday.getUTCDate() + 6,
    23, 59, 59, 999
  ));
  
  
  return { start: lastMonday, end: lastSunday };
}

/**
 * Get date range for the last 24 hours (for testing)
 */
function getLast24HoursRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  
  return { start, end: now };
}

/**
 * Calculate chi-square p-value for A/B test significance
 * Simplified implementation - in production you'd want a proper statistical library
 */
function calculateChiSquarePValue(
  group1Total: number, group1Success: number,
  group2Total: number, group2Success: number
): number {
  if (group1Total === 0 || group2Total === 0) return 1.0;
  
  // Simple approximation - in production use proper chi-square test
  const rate1 = group1Success / group1Total;
  const rate2 = group2Success / group2Total;
  const diff = Math.abs(rate1 - rate2);
  
  // Rough significance based on difference magnitude
  if (diff < 0.01) return 0.8; // Not significant
  if (diff < 0.05) return 0.3; // Weak significance
  if (diff < 0.1) return 0.1;  // Moderate significance
  return 0.05; // Strong significance
}

/**
 * Fetch creator leaderboard data for weekly digest
 */
async function fetchCreatorLeaderboardData(): Promise<CreatorLeaderboardData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // Fetch 7d and 30d leaderboards
    const [response7d, response30d] = await Promise.all([
      fetch(`${baseUrl}/api/public/leaderboard?period=7d&limit=5`),
      fetch(`${baseUrl}/api/public/leaderboard?period=30d&limit=5`)
    ]);
    
    if (!response7d.ok || !response30d.ok) {
      console.warn('Failed to fetch creator leaderboard data for digest');
      return null;
    }
    
    const data7d = await response7d.json() as LeaderboardResponse;
    const data30d = await response30d.json() as LeaderboardResponse;
    
    // Calculate movers (creators with biggest score changes)
    const movers: Array<{ creatorIdHashed: string; scoreChange: number; trend: 'up' | 'down' | 'flat' }> = [];
    
    // Create maps for easy lookup
    const scores7d = new Map<string, number>(data7d.items.map(item => [item.creatorIdHashed, item.score]));
    const scores30d = new Map<string, number>(data30d.items.map(item => [item.creatorIdHashed, item.score]));
    
    // Find creators with biggest changes
    const allCreators = new Set<string>([...scores7d.keys(), ...scores30d.keys()]);
    
    for (const creatorId of allCreators) {
      const score7d = scores7d.get(creatorId) || 0;
      const score30d = scores30d.get(creatorId) || 0;
      const change = score7d - score30d;
      
      if (Math.abs(change) > 0.01) { // Only include significant changes
        movers.push({
          creatorIdHashed: creatorId,
          scoreChange: change,
          trend: change > 0 ? 'up' : 'down'
        });
      }
    }
    
    // Sort by absolute change and take top 5
    movers.sort((a, b) => Math.abs(b.scoreChange) - Math.abs(a.scoreChange));
    const topMovers = movers.slice(0, 5);
    
    // Count provisional to stable transitions
    const provisionalToStable = data7d.items.filter((item: any) => 
      item.maturedN >= 50 && item.isProvisional === false
    ).length;
    
    return {
      top5_7d: data7d.items.map(item => ({
        creatorIdHashed: item.creatorIdHashed,
        score: item.score,
        accuracy: item.accuracy,
        consistency: item.consistency,
        volumeScore: item.volumeScore,
        recencyScore: item.recencyScore,
        maturedN: item.maturedN,
        isProvisional: item.isProvisional
      })),
      top5_30d: data30d.items.map(item => ({
        creatorIdHashed: item.creatorIdHashed,
        score: item.score,
        accuracy: item.accuracy,
        consistency: item.consistency,
        volumeScore: item.volumeScore,
        recencyScore: item.recencyScore,
        maturedN: item.maturedN,
        isProvisional: item.isProvisional
      })),
      movers: topMovers,
      provisionalToStable
    };
    
  } catch (error) {
    console.error('Error fetching creator leaderboard data:', error);
    return null;
  }
}

/**
 * Aggregate analytics events for the previous week
 */
export async function aggregateWeeklyMetrics(testMode = false): Promise<WeeklyDigestData> {
  const { start: weekStart, end: weekEnd } = testMode ? getLast24HoursRange() : getPreviousWeekRange();
  
  // Get all events for the week
  const events = await prisma.analyticsEvent.findMany({
    where: {
      timestamp: {
        gte: weekStart,
        lte: weekEnd
      }
    },
    select: {
      eventType: true,
      modelIdHash: true,
      intentId: true,
      timestamp: true,
      sessionId: true
    }
  }) as Array<{
    eventType: string;
    modelIdHash: string | null;
    intentId: string | null;
    timestamp: Date;
    sessionId: string | null;
    variant?: 'primary_above' | 'inline_below';
  }>;
  
  // Group events by model
  const modelMetrics = new Map<string, {
    views: number;
    copyClicks: number;
    intentsCreated: number;
    intentsExecuted: number;
    contextShown: number;
    contextHidden: number;
  }>();
  
  // A/B test metrics
  const abMetrics = {
    bucketA: {
      views: 0,
      copyClicks: 0,
      intentsCreated: 0,
      intentsExecuted: 0,
      contextShown: 0
    },
    bucketB: {
      views: 0,
      copyClicks: 0,
      intentsCreated: 0,
      intentsExecuted: 0,
      contextHidden: 0
    }
  };

  // CTA test metrics
  const ctaMetrics = {
    primaryAbove: {
      views: 0,
      copyClicks: 0
    },
    inlineBelow: {
      views: 0,
      copyClicks: 0
    }
  };
  
  let totalViews = 0;
  let totalCopyClicks = 0;
  let totalIntentsCreated = 0;
  let totalIntentsExecuted = 0;
  
  // Process events
  for (const event of events) {
    const modelKey = event.modelIdHash || 'no-model';
    
    if (!modelMetrics.has(modelKey)) {
      modelMetrics.set(modelKey, {
        views: 0,
        copyClicks: 0,
        intentsCreated: 0,
        intentsExecuted: 0,
        contextShown: 0,
        contextHidden: 0
      });
    }
    
    const metrics = modelMetrics.get(modelKey)!;
    
    // Determine A/B bucket for this session
    const bucket = event.sessionId ? getBucket(event.sessionId) : 'B';
    
    switch (event.eventType) {
      case ANALYTICS_EVENT_TYPES.MODEL_METRICS_VIEW:
        metrics.views++;
        totalViews++;
        if (bucket === 'A') abMetrics.bucketA.views++;
        else abMetrics.bucketB.views++;
        
        // Track CTA variant views (assume all views see CTA)
        // This is a simplification - in practice you'd track this more precisely
        ctaMetrics.primaryAbove.views++;
        ctaMetrics.inlineBelow.views++;
        break;
      case ANALYTICS_EVENT_TYPES.MODEL_COPY_CLICKED:
        metrics.copyClicks++;
        totalCopyClicks++;
        if (bucket === 'A') abMetrics.bucketA.copyClicks++;
        else abMetrics.bucketB.copyClicks++;
        
        // Track CTA variant if present
        if ((event.variant) === 'primary_above') {
          ctaMetrics.primaryAbove.copyClicks++;
        } else if ((event.variant) === 'inline_below') {
          ctaMetrics.inlineBelow.copyClicks++;
        }
        break;
      case ANALYTICS_EVENT_TYPES.INTENT_CREATED_FROM_COPY:
        metrics.intentsCreated++;
        totalIntentsCreated++;
        if (bucket === 'A') abMetrics.bucketA.intentsCreated++;
        else abMetrics.bucketB.intentsCreated++;
        break;
      case ANALYTICS_EVENT_TYPES.INTENT_EXECUTED_FROM_COPY:
        metrics.intentsExecuted++;
        totalIntentsExecuted++;
        if (bucket === 'A') abMetrics.bucketA.intentsExecuted++;
        else abMetrics.bucketB.intentsExecuted++;
        break;
      case ANALYTICS_EVENT_TYPES.CONTEXT_SHOWN:
        metrics.contextShown++;
        abMetrics.bucketA.contextShown++;
        break;
      case ANALYTICS_EVENT_TYPES.CONTEXT_HIDDEN:
        metrics.contextHidden++;
        abMetrics.bucketB.contextHidden++;
        break;
    }
  }
  
  // Calculate funnel metrics for each model
  const modelFunnelMetrics: ModelFunnelMetrics[] = [];
  
  for (const [modelIdHash, metrics] of modelMetrics) {
    if (modelIdHash === 'no-model') continue; // Skip league views and other non-model events
    
    const viewToCopyRate = metrics.views > 0 ? metrics.copyClicks / metrics.views : 0;
    const copyToSignRate = metrics.copyClicks > 0 ? metrics.intentsExecuted / metrics.copyClicks : 0;
    const viewToSignRate = metrics.views > 0 ? metrics.intentsExecuted / metrics.views : 0;
    
    modelFunnelMetrics.push({
      modelIdHash,
      views: metrics.views,
      copyClicks: metrics.copyClicks,
      intentsCreated: metrics.intentsCreated,
      intentsExecuted: metrics.intentsExecuted,
      viewToCopyRate,
      copyToSignRate,
      viewToSignRate,
      contextShown: metrics.contextShown,
      contextHidden: metrics.contextHidden
    });
  }
  
  // Sort and get top 5 by different metrics
  const topModelsByViewToCopy = modelFunnelMetrics
    .filter(m => m.views >= 10) // Minimum sample size
    .sort((a, b) => b.viewToCopyRate - a.viewToCopyRate)
    .slice(0, 5);
  
  const topModelsByCopyToSign = modelFunnelMetrics
    .filter(m => m.copyClicks >= 5) // Minimum sample size
    .sort((a, b) => b.copyToSignRate - a.copyToSignRate)
    .slice(0, 5);
  
  // Calculate overall funnel rates
  const overallViewToCopyRate = totalViews > 0 ? totalCopyClicks / totalViews : 0;
  const overallCopyToSignRate = totalCopyClicks > 0 ? totalIntentsExecuted / totalCopyClicks : 0;
  const overallViewToSignRate = totalViews > 0 ? totalIntentsExecuted / totalViews : 0;
  
  // Calculate A/B test rates
  const abTestMetrics: ABTestMetrics = {
    bucketA: {
      ...abMetrics.bucketA,
      viewToCopyRate: abMetrics.bucketA.views > 0 ? abMetrics.bucketA.copyClicks / abMetrics.bucketA.views : 0,
      copyToSignRate: abMetrics.bucketA.copyClicks > 0 ? abMetrics.bucketA.intentsExecuted / abMetrics.bucketA.copyClicks : 0,
      viewToSignRate: abMetrics.bucketA.views > 0 ? abMetrics.bucketA.intentsExecuted / abMetrics.bucketA.views : 0
    },
    bucketB: {
      ...abMetrics.bucketB,
      viewToCopyRate: abMetrics.bucketB.views > 0 ? abMetrics.bucketB.copyClicks / abMetrics.bucketB.views : 0,
      copyToSignRate: abMetrics.bucketB.copyClicks > 0 ? abMetrics.bucketB.intentsExecuted / abMetrics.bucketB.copyClicks : 0,
      viewToSignRate: abMetrics.bucketB.views > 0 ? abMetrics.bucketB.intentsExecuted / abMetrics.bucketB.views : 0
    },
    significance: {
      viewToCopyPValue: calculateChiSquarePValue(
        abMetrics.bucketA.views, abMetrics.bucketA.copyClicks,
        abMetrics.bucketB.views, abMetrics.bucketB.copyClicks
      ),
      copyToSignPValue: calculateChiSquarePValue(
        abMetrics.bucketA.copyClicks, abMetrics.bucketA.intentsExecuted,
        abMetrics.bucketB.copyClicks, abMetrics.bucketB.intentsExecuted
      ),
      viewToSignPValue: calculateChiSquarePValue(
        abMetrics.bucketA.views, abMetrics.bucketA.intentsExecuted,
        abMetrics.bucketB.views, abMetrics.bucketB.intentsExecuted
      )
    },
    ctaTest: {
      primaryAbove: {
        views: ctaMetrics.primaryAbove.views,
        copyClicks: ctaMetrics.primaryAbove.copyClicks,
        viewToCopyRate: ctaMetrics.primaryAbove.views > 0 ? ctaMetrics.primaryAbove.copyClicks / ctaMetrics.primaryAbove.views : 0
      },
      inlineBelow: {
        views: ctaMetrics.inlineBelow.views,
        copyClicks: ctaMetrics.inlineBelow.copyClicks,
        viewToCopyRate: ctaMetrics.inlineBelow.views > 0 ? ctaMetrics.inlineBelow.copyClicks / ctaMetrics.inlineBelow.views : 0
      },
      significance: {
        viewToCopyPValue: calculateChiSquarePValue(
          ctaMetrics.primaryAbove.views, ctaMetrics.primaryAbove.copyClicks,
          ctaMetrics.inlineBelow.views, ctaMetrics.inlineBelow.copyClicks
        )
      }
    }
  };
  
  // Fetch creator leaderboard data
  const creatorLeaderboard = await fetchCreatorLeaderboardData();

  return {
    weekStart,
    weekEnd,
    totalViews,
    totalCopyClicks,
    totalIntentsCreated,
    totalIntentsExecuted,
    topModelsByViewToCopy,
    topModelsByCopyToSign,
    overallFunnelRates: {
      viewToCopyRate: overallViewToCopyRate,
      copyToSignRate: overallCopyToSignRate,
      viewToSignRate: overallViewToSignRate
    },
    abTestMetrics,
    creatorLeaderboard: creatorLeaderboard ?? undefined
  };
}

/**
 * Format digest data as text message for webhook
 */
export function formatDigestMessage(digest: WeeklyDigestData): string {
  const weekStr = `${digest.weekStart.toLocaleDateString()} - ${digest.weekEnd.toLocaleDateString()}`;
  
  let message = `📊 **Weekly Analytics Digest** (${weekStr})\n\n`;
  
  // Overall metrics
  message += `**📈 Overall Metrics:**\n`;
  message += `• Views: ${digest.totalViews.toLocaleString()}\n`;
  message += `• Copy Clicks: ${digest.totalCopyClicks.toLocaleString()}\n`;
  message += `• Intents Created: ${digest.totalIntentsCreated.toLocaleString()}\n`;
  message += `• Intents Executed: ${digest.totalIntentsExecuted.toLocaleString()}\n\n`;
  
  // Overall funnel rates
  message += `**🎯 Overall Funnel Rates:**\n`;
  message += `• View → Copy: ${(digest.overallFunnelRates.viewToCopyRate * 100).toFixed(1)}%\n`;
  message += `• Copy → Sign: ${(digest.overallFunnelRates.copyToSignRate * 100).toFixed(1)}%\n`;
  message += `• View → Sign: ${(digest.overallFunnelRates.viewToSignRate * 100).toFixed(1)}%\n\n`;
  
  // Top models by view→copy rate
  if (digest.topModelsByViewToCopy.length > 0) {
    message += `**🔥 Top Models by View→Copy Rate:**\n`;
    digest.topModelsByViewToCopy.forEach((model, index) => {
      message += `${index + 1}. Model ${model.modelIdHash.slice(0, 8)}... - ${(model.viewToCopyRate * 100).toFixed(1)}% (${model.views} views, ${model.copyClicks} copies)\n`;
    });
    message += `\n`;
  }
  
  // Top models by copy→sign rate
  if (digest.topModelsByCopyToSign.length > 0) {
    message += `**⚡ Top Models by Copy→Sign Rate:**\n`;
    digest.topModelsByCopyToSign.forEach((model, index) => {
      message += `${index + 1}. Model ${model.modelIdHash.slice(0, 8)}... - ${(model.copyToSignRate * 100).toFixed(1)}% (${model.copyClicks} copies, ${model.intentsExecuted} executed)\n`;
    });
    message += `\n`;
  }
  
  // Creator Leaderboard
  if (digest.creatorLeaderboard) {
    const lb = digest.creatorLeaderboard;
    message += `**🏆 Creator Leaderboard:**\n`;
    
    // Top 5 for 7d
    if (lb.top5_7d.length > 0) {
      message += `**Top 5 This Week (7d):**\n`;
      lb.top5_7d.forEach((creator, index) => {
        const provisional = creator.isProvisional ? ' (Provisional)' : '';
        message += `${index + 1}. Creator ${creator.creatorIdHashed.substring(0, 8)}... - ${(creator.score * 100).toFixed(1)}%${provisional}\n`;
        message += `   • Accuracy: ${(creator.accuracy * 100).toFixed(1)}% | Consistency: ${(creator.consistency * 100).toFixed(1)}%\n`;
        message += `   • Volume: ${(creator.volumeScore * 100).toFixed(1)}% | Recency: ${(creator.recencyScore * 100).toFixed(1)}% | Matured: ${creator.maturedN}\n`;
      });
      message += `\n`;
    }
    
    // Top 5 for 30d
    if (lb.top5_30d.length > 0) {
      message += `**Top 5 This Month (30d):**\n`;
      lb.top5_30d.forEach((creator, index) => {
        const provisional = creator.isProvisional ? ' (Provisional)' : '';
        message += `${index + 1}. Creator ${creator.creatorIdHashed.substring(0, 8)}... - ${(creator.score * 100).toFixed(1)}%${provisional}\n`;
      });
      message += `\n`;
    }
    
    // Movers
    if (lb.movers.length > 0) {
      message += `**📈 Biggest Movers (7d vs 30d):**\n`;
      lb.movers.forEach((mover, index) => {
        const trend = mover.trend === 'up' ? '↗️' : '↘️';
        const change = mover.scoreChange > 0 ? '+' : '';
        message += `${index + 1}. Creator ${mover.creatorIdHashed.substring(0, 8)}... ${trend} ${change}${(mover.scoreChange * 100).toFixed(1)}%\n`;
      });
      message += `\n`;
    }
    
    // Provisional to stable
    if (lb.provisionalToStable > 0) {
      message += `**🎯 New Stable Creators:** ${lb.provisionalToStable} creators crossed 50+ matured insights threshold\n\n`;
    }
  }

  // A/B Test Results
  if (digest.abTestMetrics) {
    const ab = digest.abTestMetrics;
    message += `**🧪 A/B Test Results (Market Context):**\n`;
    message += `**Bucket A (Context Shown):**\n`;
    message += `  • Views: ${ab.bucketA.views} → Copy: ${ab.bucketA.copyClicks} (${(ab.bucketA.viewToCopyRate * 100).toFixed(1)}%)\n`;
    message += `  • Copy → Sign: ${ab.bucketA.intentsExecuted} (${(ab.bucketA.copyToSignRate * 100).toFixed(1)}%)\n`;
    message += `  • Overall: ${ab.bucketA.views} → ${ab.bucketA.intentsExecuted} (${(ab.bucketA.viewToSignRate * 100).toFixed(1)}%)\n`;
    message += `  • Context Events: ${ab.bucketA.contextShown}\n\n`;
    
    message += `**Bucket B (Context Hidden):**\n`;
    message += `  • Views: ${ab.bucketB.views} → Copy: ${ab.bucketB.copyClicks} (${(ab.bucketB.viewToCopyRate * 100).toFixed(1)}%)\n`;
    message += `  • Copy → Sign: ${ab.bucketB.intentsExecuted} (${(ab.bucketB.copyToSignRate * 100).toFixed(1)}%)\n`;
    message += `  • Overall: ${ab.bucketB.views} → ${ab.bucketB.intentsExecuted} (${(ab.bucketB.viewToSignRate * 100).toFixed(1)}%)\n`;
    message += `  • Context Events: ${ab.bucketB.contextHidden}\n\n`;
    
    // Significance indicators
    const viewToCopySig = ab.significance.viewToCopyPValue < 0.05 ? '✅' : '❌';
    const copyToSignSig = ab.significance.copyToSignPValue < 0.05 ? '✅' : '❌';
    const viewToSignSig = ab.significance.viewToSignPValue < 0.05 ? '✅' : '❌';
    
    message += `**Statistical Significance (p < 0.05):**\n`;
    message += `  • View→Copy: ${viewToCopySig} (p=${ab.significance.viewToCopyPValue.toFixed(3)})\n`;
    message += `  • Copy→Sign: ${copyToSignSig} (p=${ab.significance.copyToSignPValue.toFixed(3)})\n`;
    message += `  • View→Sign: ${viewToSignSig} (p=${ab.significance.viewToSignPValue.toFixed(3)})\n\n`;
    
    // CTA Test Results
    if (ab.ctaTest) {
      const cta = ab.ctaTest;
      const ctaSig = cta.significance.viewToCopyPValue < 0.05 ? '✅' : '❌';
      
      message += `**📝 CTA Test Results (cta_copy_v1):**\n`;
      message += `**Primary Above:**\n`;
      message += `  • Views: ${cta.primaryAbove.views} → Copy: ${cta.primaryAbove.copyClicks} (${(cta.primaryAbove.viewToCopyRate * 100).toFixed(1)}%)\n\n`;
      
      message += `**Inline Below:**\n`;
      message += `  • Views: ${cta.inlineBelow.views} → Copy: ${cta.inlineBelow.copyClicks} (${(cta.inlineBelow.viewToCopyRate * 100).toFixed(1)}%)\n\n`;
      
      message += `**CTA Significance:**\n`;
      message += `  • View→Copy: ${ctaSig} (p=${cta.significance.viewToCopyPValue.toFixed(3)})\n\n`;
    }
  }
  
  // Footer
  message += `_Generated at ${new Date().toISOString()}_`;
  
  return message;
}

/**
 * Send digest to webhook
 */
export async function sendDigestToWebhook(digest: WeeklyDigestData): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = process.env.ALERTS_WEBHOOK_URL;
  
  if (!webhookUrl) {
    return { success: false, error: 'ALERTS_WEBHOOK_URL not configured' };
  }
  
  try {
    const message = formatDigestMessage(digest);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: message,
        username: 'Analytics Bot',
        icon_emoji: ':chart_with_upwards_trend:'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Webhook responded with status ${response.status}`);
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Failed to send digest to webhook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate and send weekly digest
 */
export async function generateAndSendWeeklyDigest(testMode = false): Promise<{ success: boolean; error?: string; digest?: WeeklyDigestData }> {
  try {
    console.log('Generating weekly analytics digest...');
    
    const digest = await aggregateWeeklyMetrics(testMode);
    console.log('Digest generated:', {
      weekStart: digest.weekStart.toISOString(),
      weekEnd: digest.weekEnd.toISOString(),
      totalViews: digest.totalViews,
      totalCopyClicks: digest.totalCopyClicks,
      totalIntentsExecuted: digest.totalIntentsExecuted
    });
    
    // Send to webhook
    const webhookResult = await sendDigestToWebhook(digest);
    
    if (!webhookResult.success) {
      return {
        success: false,
        error: `Failed to send webhook: ${webhookResult.error}`,
        digest
      };
    }
    
    console.log('Weekly digest sent successfully');
    
    return { success: true, digest };
    
  } catch (error) {
    console.error('Failed to generate weekly digest:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
