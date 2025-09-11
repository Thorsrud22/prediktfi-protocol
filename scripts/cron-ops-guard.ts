#!/usr/bin/env tsx
/**
 * Ops Guard Cron Job
 * Runs every 10 minutes to check critical metrics
 */

import { runOpsGuardCheck, formatOpsGuardForDigest } from '../lib/monitoring/ops-guard';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚨 Starting Ops Guard cron job...');
    
    // Run ops guard check
    const status = await runOpsGuardCheck();
    
    // Log status
    console.log(`📊 Ops Guard Status: ${status.status.toUpperCase()}`);
    console.log(`   Active alerts: ${status.activeAlerts}`);
    console.log(`   Critical alerts: ${status.criticalAlerts}`);
    
    // If there are critical alerts, we could send notifications here
    if (status.criticalAlerts > 0) {
      console.error('🚨 CRITICAL ALERTS DETECTED - Consider immediate action');
      
      // TODO: Send critical alerts via webhook/Slack/Discord
      // await sendCriticalAlert(status);
    }
    
    // Log warning alerts
    if (status.activeAlerts > status.criticalAlerts) {
      console.warn('⚠️ WARNING ALERTS - Monitor closely');
    }
    
    if (status.status === 'healthy') {
      console.log('✅ All systems healthy');
    }
    
    console.log('✅ Ops Guard cron job completed');
    
  } catch (error) {
    console.error('❌ Ops Guard cron job failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { main as runOpsGuardCron };
