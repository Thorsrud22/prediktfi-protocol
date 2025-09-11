#!/usr/bin/env tsx
/**
 * Enhanced Weekly Digest
 * Includes creator health metrics and system performance
 */

import { PrismaClient } from '@prisma/client';
import { getCreatorHealthMetrics, formatCreatorHealthForDigest } from '../lib/monitoring/creator-health';
import { sloMonitor } from '../lib/observability/slo';

const prisma = new PrismaClient();

interface WeeklyDigestData {
  period: string;
  creatorHealth: any;
  systemHealth: any;
  abTestResults?: string;
  generatedAt: Date;
}

/**
 * Get system health metrics
 */
async function getSystemHealthMetrics() {
  const sloStatus = sloMonitor.getSLOStatus();
  
  return {
    overall: sloStatus.overall,
    metrics: sloStatus.metrics,
    uptime: sloStatus.uptime
  };
}

/**
 * Generate the complete weekly digest
 */
async function generateWeeklyDigest(): Promise<string> {
  console.log('📊 Generating enhanced weekly digest...');
  
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const period = `${weekAgo.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`;
  
  // Collect all metrics
  const [creatorHealth, systemHealth] = await Promise.all([
    getCreatorHealthMetrics(),
    getSystemHealthMetrics()
  ]);
  
  // Generate digest content
  let digest = `# 📈 Weekly Digest - ${period}\n\n`;
  digest += `*Generated: ${now.toISOString()}*\n\n`;
  
  // System Health Overview
  digest += '## 🏥 System Health\n\n';
  digest += `**Overall Status:** ${systemHealth.overall === 'healthy' ? '✅ Healthy' : systemHealth.overall === 'degraded' ? '⚠️ Degraded' : '❌ Critical'}\n\n`;
  
  digest += '### SLO Metrics\n';
  systemHealth.metrics.forEach((metric: any) => {
    const status = metric.status === 'healthy' ? '✅' : metric.status === 'warning' ? '⚠️' : '❌';
    digest += `- ${status} **${metric.name}**: ${metric.value}${metric.unit || ''} (target: ${metric.target}${metric.unit || ''})\n`;
  });
  digest += '\n';
  
  // Creator Health Section
  digest += formatCreatorHealthForDigest(creatorHealth);
  
  // Summary
  digest += '## 📋 Summary\n\n';
  digest += `- **System Status**: ${systemHealth.overall}\n`;
  digest += `- **Top Creators (7d)**: ${creatorHealth.topCreators7d.length}\n`;
  digest += `- **Top Creators (30d)**: ${creatorHealth.topCreators30d.length}\n`;
  digest += `- **Active Movers**: ${creatorHealth.movers.length}\n`;
  digest += `- **New Stable Creators**: ${creatorHealth.provisionalToStable}\n`;
  digest += `- **Leaderboard P95**: ${creatorHealth.leaderboardP95}ms\n\n`;
  
  digest += '---\n';
  digest += '*This digest is automatically generated every week. For questions, contact the development team.*\n';
  
  return digest;
}

/**
 * Send digest via webhook (placeholder)
 */
async function sendDigest(digest: string): Promise<void> {
  // TODO: Implement webhook sending to Slack/Discord/Email
  console.log('📤 Sending digest...');
  console.log('Digest length:', digest.length, 'characters');
  
  // For now, just log to console
  console.log('\n=== WEEKLY DIGEST ===');
  console.log(digest);
  console.log('=== END DIGEST ===\n');
}

async function main() {
  try {
    console.log('🚀 Starting enhanced weekly digest generation...');
    
    const digest = await generateWeeklyDigest();
    await sendDigest(digest);
    
    console.log('✅ Weekly digest generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate weekly digest:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { generateWeeklyDigest, getCreatorHealthMetrics, getSystemHealthMetrics };
