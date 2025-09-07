/**
 * PMF (Product-Market Fit) Metrics Tracker
 * Tracks critical metrics for measuring product success
 */

import { prisma } from '../prisma';

export interface PMFMetrics {
  clickSimRate: number;        // Click→Sim rate ≥ 50%
  simSignRate: number;         // Sim→Sign rate ≥ 25%
  d7Retention: number;         // D7 retention ≥ 35%
  socialSharing: number;       // ≥ 20 shared receipts/week
  signalFollowing: number;     // Following all signals (30d) positive ≥ 50%
}

export interface PMFTargets {
  clickSimRate: 0.5;           // 50%
  simSignRate: 0.25;           // 25%
  d7Retention: 0.35;           // 35%
  socialSharing: 20;           // 20 shares/week
  signalFollowing: 0.5;        // 50%
}

export class PMFTracker {
  private static readonly TARGETS: PMFTargets = {
    clickSimRate: 0.5,
    simSignRate: 0.25,
    d7Retention: 0.35,
    socialSharing: 20,
    signalFollowing: 0.5
  };

  /**
   * Track user event for analytics
   */
  static async trackEvent(
    walletId: string,
    eventType: string,
    eventData?: any,
    sessionId?: string,
    userAgent?: string,
    referrer?: string
  ): Promise<void> {
    try {
      await prisma?.userEvent?.create({
        data: {
          walletId,
          eventType,
          eventData: eventData ? JSON.stringify(eventData) : null,
          sessionId,
          userAgent,
          referrer,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to track user event:', error);
    }
  }

  /**
   * Track "Trade this" button click
   */
  static async trackTradeButtonClick(
    walletId: string,
    insightId: string,
    sessionId?: string
  ): Promise<void> {
    await this.trackEvent(
      walletId,
      'click_trade_button',
      { insightId },
      sessionId
    );
  }

  /**
   * Track intent simulation
   */
  static async trackIntentSimulation(
    walletId: string,
    intentId: string,
    sessionId?: string
  ): Promise<void> {
    await this.trackEvent(
      walletId,
      'simulate_intent',
      { intentId },
      sessionId
    );
  }

  /**
   * Track intent signing/execution
   */
  static async trackIntentSigning(
    walletId: string,
    intentId: string,
    sessionId?: string
  ): Promise<void> {
    await this.trackEvent(
      walletId,
      'sign_intent',
      { intentId },
      sessionId
    );
  }

  /**
   * Track social sharing
   */
  static async trackSocialShare(
    walletId: string,
    intentId: string,
    platform: string,
    shareUrl?: string
  ): Promise<void> {
    // Track in user events
    await this.trackEvent(
      walletId,
      'share_receipt',
      { intentId, platform, shareUrl }
    );

    // Track in social shares table
    try {
      await prisma?.socialShare?.create({
        data: {
          intentId,
          walletId,
          platform,
          shareUrl,
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to track social share:', error);
    }
  }

  /**
   * Update user retention data
   */
  static async updateUserRetention(
    walletId: string,
    isAction: boolean = true
  ): Promise<void> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Get or create retention record
      let retention = await prisma?.userRetention?.findUnique({
        where: { walletId }
      });

      if (!retention) {
        // First time user
        retention = await prisma?.userRetention?.create({
          data: {
            walletId,
            firstAction: now,
            lastAction: now,
            totalActions: isAction ? 1 : 0
          }
        });
      } else {
        // Update existing user
        const daysSinceFirst = Math.floor(
          (now.getTime() - retention.firstAction.getTime()) / (1000 * 60 * 60 * 24)
        );

        const updates: any = {
          lastAction: now,
          totalActions: retention.totalActions + (isAction ? 1 : 0)
        };

        // Update retention flags based on days since first action
        if (daysSinceFirst >= 1) updates.d1Active = true;
        if (daysSinceFirst >= 3) updates.d3Active = true;
        if (daysSinceFirst >= 7) updates.d7Active = true;
        if (daysSinceFirst >= 14) updates.d14Active = true;
        if (daysSinceFirst >= 30) updates.d30Active = true;

        await prisma?.userRetention?.update({
          where: { walletId },
          data: updates
        });
      }
    } catch (error) {
      console.error('Failed to update user retention:', error);
    }
  }

  /**
   * Calculate current PMF metrics
   */
  static async calculateMetrics(period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<PMFMetrics> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Calculate Click→Sim Rate
    const clickEvents = await prisma?.userEvent?.count({
      where: {
        eventType: 'click_trade_button',
        timestamp: { gte: startDate }
      }
    }) || 0;

    const simEvents = await prisma?.userEvent?.count({
      where: {
        eventType: 'simulate_intent',
        timestamp: { gte: startDate }
      }
    }) || 0;

    const clickSimRate = clickEvents > 0 ? simEvents / clickEvents : 0;

    // Calculate Sim→Sign Rate
    const signEvents = await prisma?.userEvent?.count({
      where: {
        eventType: 'sign_intent',
        timestamp: { gte: startDate }
      }
    }) || 0;

    const simSignRate = simEvents > 0 ? signEvents / simEvents : 0;

    // Calculate D7 Retention
    const d7RetentionUsers = await prisma?.userRetention?.count({
      where: {
        d7Active: true,
        firstAction: { gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) } // Users who joined 7+ days ago
      }
    }) || 0;

    const totalD7EligibleUsers = await prisma?.userRetention?.count({
      where: {
        firstAction: { gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) }
      }
    }) || 0;

    const d7Retention = totalD7EligibleUsers > 0 ? d7RetentionUsers / totalD7EligibleUsers : 0;

    // Calculate Social Sharing (weekly count)
    const socialShares = await prisma?.socialShare?.count({
      where: {
        createdAt: { gte: startDate }
      }
    }) || 0;

    // Calculate Signal Following (30-day positive rate)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get users who have been active for 30+ days
    const longTermUsers = await prisma?.userRetention?.findMany({
      where: {
        firstAction: { lte: thirtyDaysAgo },
        d30Active: true
      }
    }) || [];

    // For now, we'll use a simplified calculation
    // In a real implementation, this would analyze actual trading performance
    const signalFollowing = longTermUsers.length > 0 ? 
      longTermUsers.filter(user => user.totalActions >= 5).length / longTermUsers.length : 0;

    return {
      clickSimRate,
      simSignRate,
      d7Retention,
      socialSharing: socialShares,
      signalFollowing
    };
  }

  /**
   * Store PMF metrics in database
   */
  static async storeMetrics(metrics: PMFMetrics, period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<void> {
    try {
      const targets = this.TARGETS;
      
      // Store each metric
      await Promise.all([
        prisma?.pMFMetric?.create({
          data: {
            metricType: 'click_sim_rate',
            value: metrics.clickSimRate,
            target: targets.clickSimRate,
            period,
            date: new Date()
          }
        }),
        prisma?.pMFMetric?.create({
          data: {
            metricType: 'sim_sign_rate',
            value: metrics.simSignRate,
            target: targets.simSignRate,
            period,
            date: new Date()
          }
        }),
        prisma?.pMFMetric?.create({
          data: {
            metricType: 'd7_retention',
            value: metrics.d7Retention,
            target: targets.d7Retention,
            period,
            date: new Date()
          }
        }),
        prisma?.pMFMetric?.create({
          data: {
            metricType: 'social_sharing',
            value: metrics.socialSharing,
            target: targets.socialSharing,
            period,
            date: new Date()
          }
        }),
        prisma?.pMFMetric?.create({
          data: {
            metricType: 'signal_following',
            value: metrics.signalFollowing,
            target: targets.signalFollowing,
            period,
            date: new Date()
          }
        })
      ]);
    } catch (error) {
      console.error('Failed to store PMF metrics:', error);
    }
  }

  /**
   * Get PMF metrics with status
   */
  static async getMetricsWithStatus(period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<{
    metrics: PMFMetrics;
    status: Record<keyof PMFMetrics, 'pass' | 'fail' | 'warning'>;
    targets: PMFTargets;
  }> {
    const metrics = await this.calculateMetrics(period);
    const targets = this.TARGETS;

    const status: Record<keyof PMFMetrics, 'pass' | 'fail' | 'warning'> = {
      clickSimRate: metrics.clickSimRate >= targets.clickSimRate ? 'pass' : 
                   metrics.clickSimRate >= targets.clickSimRate * 0.8 ? 'warning' : 'fail',
      simSignRate: metrics.simSignRate >= targets.simSignRate ? 'pass' : 
                  metrics.simSignRate >= targets.simSignRate * 0.8 ? 'warning' : 'fail',
      d7Retention: metrics.d7Retention >= targets.d7Retention ? 'pass' : 
                  metrics.d7Retention >= targets.d7Retention * 0.8 ? 'warning' : 'fail',
      socialSharing: metrics.socialSharing >= targets.socialSharing ? 'pass' : 
                    metrics.socialSharing >= targets.socialSharing * 0.8 ? 'warning' : 'fail',
      signalFollowing: metrics.signalFollowing >= targets.signalFollowing ? 'pass' : 
                      metrics.signalFollowing >= targets.signalFollowing * 0.8 ? 'warning' : 'fail'
    };

    return { metrics, status, targets };
  }
}
