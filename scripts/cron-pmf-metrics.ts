/**
 * PMF Metrics Cron Job
 * Calculates and stores PMF metrics daily
 */

import { PMFTracker } from '../app/lib/analytics/pmf-tracker';

async function calculatePMFMetrics() {
  console.log('📊 Starting PMF metrics calculation...');
  const startTime = Date.now();
  
  try {
    // Calculate metrics for different periods
    const periods = ['daily', 'weekly', 'monthly'] as const;
    
    for (const period of periods) {
      console.log(`📈 Calculating ${period} metrics...`);
      
      // Calculate metrics
      const metrics = await PMFTracker.calculateMetrics(period);
      
      // Store metrics
      await PMFTracker.storeMetrics(metrics, period);
      
      console.log(`✅ ${period} metrics calculated:`, {
        clickSimRate: `${Math.round(metrics.clickSimRate * 100)}%`,
        simSignRate: `${Math.round(metrics.simSignRate * 100)}%`,
        d7Retention: `${Math.round(metrics.d7Retention * 100)}%`,
        socialSharing: metrics.socialSharing,
        signalFollowing: `${Math.round(metrics.signalFollowing * 100)}%`
      });
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ PMF metrics calculation completed in ${duration}ms`);
    
  } catch (error) {
    console.error('💥 PMF metrics calculation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  calculatePMFMetrics()
    .then(() => {
      console.log('🎉 PMF metrics calculation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 PMF metrics calculation failed:', error);
      process.exit(1);
    });
}

export default calculatePMFMetrics;
