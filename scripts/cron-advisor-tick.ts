// scripts/cron-advisor-tick.ts
import { AlertsEngine } from '../app/lib/advisor/alerts-engine';
import { isFeatureEnabled } from '../app/lib/flags';

async function runAdvisorTick() {
  console.log('🕐 Starting advisor tick job...');
  
  try {
    // Check if advisor features are enabled
    if (!isFeatureEnabled('ADVISOR') || !isFeatureEnabled('ALERTS')) {
      console.log('⏭️ Advisor features disabled, skipping tick');
      return;
    }

    // Initialize alerts engine
    const alertsEngine = new AlertsEngine();
    
    // Run alerts evaluation
    await alertsEngine.evaluateAllRules();
    
    console.log('✅ Advisor tick completed successfully');
  } catch (error) {
    console.error('❌ Advisor tick failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runAdvisorTick()
    .then(() => {
      console.log('🎉 Advisor tick job finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Advisor tick job crashed:', error);
      process.exit(1);
    });
}

export { runAdvisorTick };
