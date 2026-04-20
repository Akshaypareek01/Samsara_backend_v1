/**
 * cleanup-junk-memberships.js
 *
 * One-shot: find memberships with absurd endDates (>10 years out) and either
 * report them, or delete them with --apply.
 *
 *   Dry-run (default):
 *     node src/scripts/cleanup-junk-memberships.js
 *
 *   Actually delete:
 *     node src/scripts/cleanup-junk-memberships.js --apply
 *
 *   Target a specific user only:
 *     node src/scripts/cleanup-junk-memberships.js --user 69b25b8a832b8707b573e25e [--apply]
 */

import mongoose from 'mongoose';
import config from '../config/config.js';
import { Membership } from '../models/index.js';

const APPLY = process.argv.includes('--apply');
const userIdx = process.argv.indexOf('--user');
const TARGET_USER = userIdx > -1 ? process.argv[userIdx + 1] : null;

const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;
const cutoff = new Date(Date.now() + TEN_YEARS_MS);

const main = async () => {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  console.log(`Connected. Mode: ${APPLY ? 'APPLY (will delete)' : 'DRY-RUN (no changes)'}`);
  console.log(`Cutoff: endDate > ${cutoff.toISOString()} → flagged as junk\n`);

  const filter = { endDate: { $gt: cutoff } };
  if (TARGET_USER) filter.userId = TARGET_USER;

  const junk = await Membership.find(filter).lean();

  if (junk.length === 0) {
    console.log('No junk memberships found.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${junk.length} junk membership(s):\n`);
  junk.forEach((m, i) => {
    console.log(`  [${i + 1}] _id=${m._id}`);
    console.log(`       userId=${m.userId}`);
    console.log(`       provider=${m.paymentProvider}`);
    console.log(`       status=${m.status}`);
    console.log(`       startDate=${m.startDate?.toISOString()}`);
    console.log(`       endDate=${m.endDate?.toISOString()}  ← absurd`);
    console.log(`       createdAt=${m.createdAt?.toISOString()}\n`);
  });

  if (!APPLY) {
    console.log('DRY-RUN — no changes made.');
    console.log('Re-run with --apply to delete these documents.');
    await mongoose.disconnect();
    return;
  }

  const ids = junk.map((m) => m._id);
  const result = await Membership.deleteMany({ _id: { $in: ids } });
  console.log(`Deleted ${result.deletedCount} membership(s).`);

  await mongoose.disconnect();
};

main().catch((e) => {
  console.error('cleanup script crashed:', e);
  process.exit(1);
});
