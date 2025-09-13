// app/lib/advisor/alerts-engine.ts
import { prisma } from '../prisma';
import { HoldingsService, PortfolioSnapshot } from './holdings';
import { RiskAnalyzer } from './risk';
import { InAppChannel } from './channels/inapp';
import { EmailChannel } from './channels/email';
import { WebhookChannel } from './channels/webhook';

export interface AlertRule {
  id: string;
  walletId: string;
  name: string;
  ruleJson: any;
  channel: 'inapp' | 'email' | 'webhook';
  target?: string;
  enabled: boolean;
}

export interface AlertEvent {
  ruleId: string;
  firedAt: Date;
  payload: any;
  delivered: boolean;
}

export interface AlertContext {
  walletId: string;
  snapshot: PortfolioSnapshot;
  previousSnapshot?: PortfolioSnapshot;
  riskAssessment: any;
}

export class AlertsEngine {
  private channels = {
    inapp: new InAppChannel(),
    email: new EmailChannel(),
    webhook: new WebhookChannel()
  };

  async evaluateAllRules(): Promise<void> {
    try {
      console.log('🔍 Starting alerts evaluation...');
      
      // Get all enabled alert rules
      const rules = await prisma.alertRule.findMany({
        where: { enabled: true },
        include: { wallet: true }
      });

      console.log(`📊 Found ${rules.length} active alert rules`);

      // Group rules by wallet for efficient processing
      const rulesByWallet = this.groupRulesByWallet(rules);

      // Process each wallet
      for (const [walletId, walletRules] of rulesByWallet) {
        await this.processWalletRules(walletId, walletRules);
      }

      console.log('✅ Alerts evaluation completed');
    } catch (error) {
      console.error('❌ Error in alerts evaluation:', error);
    }
  }

  private groupRulesByWallet(rules: any[]): Map<string, any[]> {
    const grouped = new Map<string, any[]>();
    
    for (const rule of rules) {
      if (!grouped.has(rule.walletId)) {
        grouped.set(rule.walletId, []);
      }
      grouped.get(rule.walletId)!.push(rule);
    }
    
    return grouped;
  }

  private async processWalletRules(walletId: string, rules: any[]): Promise<void> {
    try {
      // Get wallet info
      const wallet = await prisma.wallet.findUnique({
        where: { id: walletId }
      });

      if (!wallet) {
        console.warn(`⚠️ Wallet ${walletId} not found`);
        return;
      }

      // Get current portfolio snapshot
      const snapshot = await HoldingsService.getPortfolioSnapshot(wallet.address);
      
      // Get previous snapshot for comparison
      const previousSnapshot = await this.getPreviousSnapshot(walletId);
      
      // Perform risk analysis
      const riskAssessment = RiskAnalyzer.analyzePortfolioRisk(snapshot);

      // Create alert context
      const context: AlertContext = {
        walletId,
        snapshot,
        previousSnapshot,
        riskAssessment
      };

      // Evaluate each rule
      for (const rule of rules) {
        await this.evaluateRule(rule, context);
      }

      // Save current snapshot for future comparisons
      await this.saveSnapshot(walletId, snapshot);

    } catch (error) {
      console.error(`❌ Error processing wallet ${walletId}:`, error);
    }
  }

  private async evaluateRule(rule: any, context: AlertContext): Promise<void> {
    try {
      const ruleConfig = JSON.parse(rule.ruleJson);
      const shouldFire = await this.checkRuleCondition(ruleConfig, context);

      if (shouldFire) {
        await this.fireAlert(rule, context, ruleConfig);
      }
    } catch (error) {
      console.error(`❌ Error evaluating rule ${rule.id}:`, error);
    }
  }

  private async checkRuleCondition(ruleConfig: any, context: AlertContext): Promise<boolean> {
    const { snapshot, previousSnapshot } = context;

    switch (ruleConfig.type) {
      case 'price_drop':
        return this.checkPriceDrop(ruleConfig, snapshot, previousSnapshot);
      
      case 'price_rise':
        return this.checkPriceRise(ruleConfig, snapshot, previousSnapshot);
      
      case 'concentration':
        return this.checkConcentration(ruleConfig, snapshot);
      
      case 'volatility':
        return this.checkVolatility(ruleConfig, snapshot);
      
      case 'drawdown':
        return this.checkDrawdown(ruleConfig, snapshot, previousSnapshot);
      
      case 'stablecoin_depeg':
        return this.checkStablecoinDepeg(ruleConfig, snapshot);
      
      default:
        console.warn(`⚠️ Unknown rule type: ${ruleConfig.type}`);
        return false;
    }
  }

  private checkPriceDrop(ruleConfig: any, snapshot: PortfolioSnapshot, previousSnapshot?: PortfolioSnapshot): boolean {
    if (!previousSnapshot) return false;
    
    const priceChange = (snapshot.totalValueUsd - previousSnapshot.totalValueUsd) / 
                       previousSnapshot.totalValueUsd * 100;
    
    return priceChange <= -ruleConfig.threshold;
  }

  private checkPriceRise(ruleConfig: any, snapshot: PortfolioSnapshot, previousSnapshot?: PortfolioSnapshot): boolean {
    if (!previousSnapshot) return false;
    
    const priceChange = (snapshot.totalValueUsd - previousSnapshot.totalValueUsd) / 
                       previousSnapshot.totalValueUsd * 100;
    
    return priceChange >= ruleConfig.threshold;
  }

  private checkConcentration(ruleConfig: any, snapshot: PortfolioSnapshot): boolean {
    if (ruleConfig.asset === 'portfolio') {
      return snapshot.concentration.top5Percent > ruleConfig.threshold;
    }
    
    // Check specific asset concentration
    const assetHolding = snapshot.holdings.find(h => h.symbol === ruleConfig.asset);
    if (!assetHolding) return false;
    
    const concentration = (assetHolding.valueUsd / snapshot.totalValueUsd) * 100;
    return concentration > ruleConfig.threshold;
  }

  private checkVolatility(ruleConfig: any, snapshot: PortfolioSnapshot): boolean {
    // Simple volatility check based on diversification
    return snapshot.risk.diversification === 'low';
  }

  private checkDrawdown(ruleConfig: any, snapshot: PortfolioSnapshot, previousSnapshot?: PortfolioSnapshot): boolean {
    if (!previousSnapshot) return false;
    
    const drawdown = snapshot.risk.drawdownFromAth;
    return drawdown >= ruleConfig.threshold;
  }

  private checkStablecoinDepeg(ruleConfig: any, snapshot: PortfolioSnapshot): boolean {
    // Check if stablecoins have depegged
    const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD'];
    const stablecoinHoldings = snapshot.holdings.filter(h => stablecoins.includes(h.symbol));
    
    for (const holding of stablecoinHoldings) {
      // In a real implementation, you'd check current price vs $1.00
      // For now, we'll simulate this
      const priceDeviation = Math.abs(holding.valueUsd / holding.amount - 1.0) * 100;
      if (priceDeviation > ruleConfig.threshold) {
        return true;
      }
    }
    
    return false;
  }

  private async fireAlert(rule: any, context: AlertContext, ruleConfig: any): Promise<void> {
    try {
      // Create alert event
      const alertEvent = await prisma.alertEvent.create({
        data: {
          ruleId: rule.id,
          payloadJson: JSON.stringify({
            ruleName: rule.name,
            ruleType: ruleConfig.type,
            threshold: ruleConfig.threshold,
            currentValue: this.getCurrentValue(ruleConfig, context),
            walletAddress: context.snapshot.walletId,
            timestamp: new Date().toISOString()
          })
        }
      });

      // Send notification via appropriate channel
      const channel = this.channels[rule.channel as keyof typeof this.channels];
      if (channel) {
        const success = await channel.send({
          target: rule.target,
          payload: JSON.parse(alertEvent.payloadJson),
          ruleName: rule.name
        });

        // Update delivery status
        await prisma.alertEvent.update({
          where: { id: alertEvent.id },
          data: { 
            delivered: success,
            deliveredAt: success ? new Date() : null
          }
        });

        console.log(`📢 Alert fired: ${rule.name} via ${rule.channel} (${success ? 'delivered' : 'failed'})`);
      }

    } catch (error) {
      console.error(`❌ Error firing alert for rule ${rule.id}:`, error);
    }
  }

  private getCurrentValue(ruleConfig: any, context: AlertContext): any {
    const { snapshot, previousSnapshot } = context;

    switch (ruleConfig.type) {
      case 'price_drop':
      case 'price_rise':
        return previousSnapshot ? 
          ((snapshot.totalValueUsd - previousSnapshot.totalValueUsd) / previousSnapshot.totalValueUsd * 100).toFixed(2) + '%' :
          'N/A';
      
      case 'concentration':
        return ruleConfig.asset === 'portfolio' ? 
          snapshot.concentration.top5Percent.toFixed(1) + '%' :
          'Asset-specific';
      
      case 'volatility':
        return snapshot.risk.diversification;
      
      case 'drawdown':
        return snapshot.risk.drawdownFromAth.toFixed(2) + '%';
      
      case 'stablecoin_depeg':
        return 'Stablecoin price deviation';
      
      default:
        return 'Unknown';
    }
  }

  private async getPreviousSnapshot(walletId: string): Promise<PortfolioSnapshot | undefined> {
    try {
      const snapshots = await prisma.holdingSnapshot.findMany({
        where: { walletId },
        orderBy: { ts: 'desc' },
        take: 1
      });

      if (snapshots.length === 0) return undefined;

      // Reconstruct snapshot from database records
      const holdings = snapshots.map(s => ({
        asset: s.asset,
        symbol: s.asset, // Would need to resolve symbol from asset
        amount: parseFloat(s.amount),
        valueUsd: parseFloat(s.valueUsd),
        mint: s.asset,
        decimals: 9 // Default, would need to resolve
      }));

      return {
        walletId,
        timestamp: snapshots[0].ts,
        totalValueUsd: holdings.reduce((sum, h) => sum + h.valueUsd, 0),
        holdings,
        topPositions: holdings.slice(0, 5),
        concentration: {
          hhi: 0, // Would need to calculate
          top5Percent: 0,
          stablecoinPercent: 0
        },
        pnl: {
          estimated24h: 0,
          estimated7d: 0,
          estimated30d: 0
        },
        risk: {
          drawdownFromAth: 0,
          volatility: 0,
          diversification: 'medium'
        }
      };
    } catch (error) {
      console.error('Error getting previous snapshot:', error);
      return undefined;
    }
  }

  private async saveSnapshot(walletId: string, snapshot: PortfolioSnapshot): Promise<void> {
    try {
      // Save holdings snapshot
      await prisma.holdingSnapshot.createMany({
        data: snapshot.holdings.map(holding => ({
          walletId,
          asset: holding.asset,
          amount: holding.amount.toString(),
          valueUsd: holding.valueUsd.toString()
        }))
      });
    } catch (error) {
      console.error('Error saving snapshot:', error);
    }
  }

  // Test a specific rule against historical data
  async testRule(ruleId: string, days: number = 7): Promise<any> {
    try {
      const rule = await prisma.alertRule.findUnique({
        where: { id: ruleId },
        include: { wallet: true }
      });

      if (!rule) {
        throw new Error('Rule not found');
      }

      // Get historical snapshots
      const snapshots = await prisma.holdingSnapshot.findMany({
        where: { 
          walletId: rule.walletId,
          ts: {
            gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { ts: 'asc' }
      });

      // Simulate rule evaluation
      const results = [];
      for (let i = 1; i < snapshots.length; i++) {
        const current = snapshots[i];
        const previous = snapshots[i - 1];
        
        // Simple test logic
        const ruleConfig = JSON.parse(rule.ruleJson);
        const wouldFire = this.testRuleCondition(ruleConfig, current, previous);
        
        results.push({
          timestamp: current.ts,
          wouldFire,
          currentValue: parseFloat(current.valueUsd),
          previousValue: parseFloat(previous.valueUsd)
        });
      }

      return {
        ruleName: rule.name,
        testPeriod: `${days} days`,
        totalChecks: results.length,
        alertsFired: results.filter(r => r.wouldFire).length,
        results
      };
    } catch (error) {
      console.error('Error testing rule:', error);
      throw error;
    }
  }

  private testRuleCondition(ruleConfig: any, current: any, previous: any): boolean {
    // Simplified test logic
    const change = (parseFloat(current.valueUsd) - parseFloat(previous.valueUsd)) / parseFloat(previous.valueUsd) * 100;
    
    switch (ruleConfig.type) {
      case 'price_drop':
        return change <= -ruleConfig.threshold;
      case 'price_rise':
        return change >= ruleConfig.threshold;
      default:
        return false;
    }
  }
}
