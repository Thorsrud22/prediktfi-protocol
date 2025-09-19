/**
 * Cron job for P2A monitoring
 * Runs synthetic tests and SLO monitoring every 10 minutes
 */

import SyntheticTester from './synthetic-p2a';
import SLOMonitor from './slo-monitor';

async function runP2AMonitoring() {
  console.log('🔄 Starting P2A monitoring cycle...');
  const startTime = Date.now();
  
  try {
    // Run synthetic tests
    console.log('🧪 Running synthetic tests...');
    const syntheticTester = new SyntheticTester();
    await syntheticTester.runAllTests();
    await syntheticTester.reportResults();
    
    // Run SLO monitoring
    console.log('📊 Running SLO monitoring...');
    const sloMonitor = new SLOMonitor();
    await sloMonitor.checkAllSLOs();
    
    const duration = Date.now() - startTime;
    console.log(`✅ P2A monitoring cycle completed in ${duration}ms`);
    
  } catch (error) {
    console.error('💥 P2A monitoring cycle failed:', error);
    process.exit(1);
  }
}

// Run monitoring if called directly
if (require.main === module) {
  runP2AMonitoring()
    .then(() => {
      console.log('🎉 P2A monitoring completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 P2A monitoring failed:', error);
      process.exit(1);
    });
}

export default runP2AMonitoring;
