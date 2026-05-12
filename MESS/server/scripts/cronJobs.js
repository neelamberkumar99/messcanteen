const cron = require('node-cron');
const dietService = require('../services/dietService');
const billingService = require('../services/billingService');

// Run every day at 00:00 (Midnight)
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily diet auto-reset...');
  try {
    const results = await dietService.autoResetDiets();
    console.log(`Auto-reset ${results.length} diet logs.`);
  } catch (err) {
    console.error('Error in daily auto-reset cron:', err);
  }
});

// Run every day at 01:00 to update fines for overdue bills
cron.schedule('0 1 * * *', async () => {
  console.log('Running daily fine calculation update...');
  try {
    const updates = await billingService.updateFinesForOverdueBills();
    console.log(`Updated fines for ${updates.length} bills.`);
  } catch (err) {
    console.error('Error in daily fine update cron:', err);
  }
});

console.log('Cron jobs scheduled: Diet Auto-reset (00:00), Fine Update (01:00)');
