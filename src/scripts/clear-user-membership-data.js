/**
 * Remove all membership (and optionally transaction) records for one user so
 * IAP / RevenueCat testing starts from a clean slate.
 *
 * Usage:
 *   node src/scripts/clear-user-membership-data.js --email test@gmail.com
 *   node src/scripts/clear-user-membership-data.js --user 6888798e1e493d459d0ce350
 *
 * Dry-run (default): prints counts only.
 *   node src/scripts/clear-user-membership-data.js --email test@gmail.com --apply
 *
 * Keep transactions (only delete memberships):
 *   node src/scripts/clear-user-membership-data.js --email test@gmail.com --apply --keep-transactions
 */

import mongoose from 'mongoose';
import config from '../config/config.js';
import { User, Membership, Transaction } from '../models/index.js';

const APPLY = process.argv.includes('--apply');
const KEEP_TX = process.argv.includes('--keep-transactions');

const emailIdx = process.argv.indexOf('--email');
const userIdx = process.argv.indexOf('--user');
const email = emailIdx > -1 ? process.argv[emailIdx + 1] : null;
const userIdArg = userIdx > -1 ? process.argv[userIdx + 1] : null;

const main = async () => {
  if (!email && !userIdArg) {
    console.error('Usage: --email <addr> | --user <objectId> [--apply] [--keep-transactions]');
    process.exit(1);
  }

  await mongoose.connect(config.mongoose.url, config.mongoose.options);

  let user = null;
  if (userIdArg) {
    user = await User.findById(userIdArg);
  } else {
    user = await User.findOne({ email: email.toLowerCase().trim() });
  }

  if (!user) {
    console.error('User not found.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const uid = user._id;
  console.log(`User: ${user.email} (${uid})`);
  console.log(`Mode: ${APPLY ? 'APPLY (deleting)' : 'DRY-RUN'}`);

  const memCount = await Membership.countDocuments({ userId: uid });
  const txCount = await Transaction.countDocuments({ userId: uid });

  console.log(`Memberships to remove: ${memCount}`);
  console.log(`Transactions to remove: ${KEEP_TX ? 0 : txCount} (keep-transactions=${KEEP_TX})`);

  if (!APPLY) {
    console.log('\nRe-run with --apply to execute.');
    await mongoose.disconnect();
    return;
  }

  const memRes = await Membership.deleteMany({ userId: uid });
  console.log(`Deleted memberships: ${memRes.deletedCount}`);

  if (!KEEP_TX) {
    const txRes = await Transaction.deleteMany({ userId: uid });
    console.log(`Deleted transactions: ${txRes.deletedCount}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
