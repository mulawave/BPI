/**
 * Background Job Scheduler for YouTube Subscription Verification
 * Runs verification job every 5 minutes
 * 
 * Usage: npm run youtube:verify (add this to package.json scripts)
 * Or use with PM2: pm2 start server/jobs/youtubeScheduler.ts --name youtube-jobs
 */

import cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Run every 5 minutes
const CRON_SCHEDULE = '*/5 * * * *';

console.log('🚀 YouTube Verification Scheduler started');
console.log(`📅 Schedule: Every 5 minutes`);

// Run verification job
async function runVerification() {
  console.log(`\n⏰ [${new Date().toISOString()}] Running YouTube subscription verification...`);
  
  try {
    const { stdout, stderr } = await execAsync('npx tsx scripts/verifyYoutubeSubscriptions.ts');
    
    if (stdout) {
      console.log(stdout);
    }
    
    if (stderr && !stderr.includes('ExperimentalWarning')) {
      console.error('Error output:', stderr);
    }
    
    console.log(`✅ [${new Date().toISOString()}] Verification completed successfully`);
  } catch (error: any) {
    console.error(`❌ [${new Date().toISOString()}] Verification failed:`, error.message);
  }
}

// Schedule the job
cron.schedule(CRON_SCHEDULE, runVerification);

// Run once on startup
console.log('🔄 Running initial verification...');
runVerification();

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down YouTube scheduler gracefully...');
  process.exit(0);
});

console.log('✅ Scheduler is running. Press Ctrl+C to stop.\n');
