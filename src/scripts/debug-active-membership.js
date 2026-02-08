/**
 * Debug script: why GET /payments/memberships/active returns 404 for a user.
 * Usage: node src/scripts/debug-active-membership.js <userId>
 */
import mongoose from 'mongoose';
import config from '../config/config.js';
import { Membership } from '../models/index.js';

const USER_ID = process.argv[2] || '6888798e1e493d459d0ce350';

async function debug() {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);

  const userId = USER_ID;
  const now = new Date();

  console.log('\n--- User ID:', userId);
  console.log('--- Now (server):', now.toISOString());

  // All memberships for this user
  const all = await Membership.find({ userId }).populate('planId').lean();
  console.log('\n--- All memberships for user:', all.length);

  if (all.length === 0) {
    console.log('No membership documents found for this userId. 404 is expected.');
    process.exit(0);
    return;
  }

  all.forEach((m, i) => {
    const startOk = m.startDate <= now;
    const endOk = m.endDate >= now;
    const statusOk = m.status === 'active';
    const wouldMatch = statusOk && startOk && endOk;
    console.log(`\n[${i + 1}] _id: ${m._id}`);
    console.log('    status:', m.status, statusOk ? '✓' : '✗ (must be "active")');
    console.log('    startDate:', m.startDate?.toISOString?.() ?? m.startDate, startOk ? '✓' : '✗ (must be <= now)');
    console.log('    endDate:', m.endDate?.toISOString?.() ?? m.endDate, endOk ? '✓' : '✗ (must be >= now)');
    console.log('    -> matches getActiveMembership?', wouldMatch ? 'YES' : 'NO');
  });

  // Exact query used by the API
  const active = await Membership.getActiveMembership(userId);
  console.log('\n--- getActiveMembership(userId) result:', active ? 'FOUND' : 'null (404)');

  await mongoose.disconnect();
  process.exit(0);
}

debug().catch((err) => {
  console.error(err);
  process.exit(1);
});
