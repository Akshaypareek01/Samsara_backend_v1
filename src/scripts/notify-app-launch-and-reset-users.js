/**
 * Notify app users about the public launch, then remove app user accounts and membership data.
 *
 * Step 1 — preview test email:
 *   node src/scripts/notify-app-launch-and-reset-users.js --test-email akshay96102@gmail.com
 *
 * Step 2 — dry-run counts:
 *   node src/scripts/notify-app-launch-and-reset-users.js
 *
 * Step 3 — send emails to all role=user accounts, then delete users + memberships + transactions:
 *   node src/scripts/notify-app-launch-and-reset-users.js --apply
 *
 * Delete only (no emails):
 *   node src/scripts/notify-app-launch-and-reset-users.js --apply --delete-only
 */

import mongoose from 'mongoose';
import config from '../config/config.js';
import { sendEmail } from '../services/email.service.js';
import { buildAppLaunchResetEmailContent } from '../utils/emailTemplates.js';
import { User, Membership, Transaction, Token, NotificationPreferences } from '../models/index.js';

const APPLY = process.argv.includes('--apply');
const DELETE_ONLY = process.argv.includes('--delete-only');
const testEmailIdx = process.argv.indexOf('--test-email');
const testEmail = testEmailIdx > -1 ? process.argv[testEmailIdx + 1] : null;

const USER_FILTER = { role: 'user' };
const EMAIL_DELAY_MS = 350;

/**
 * Pause between outbound emails to reduce SMTP throttling.
 * @param {number} ms - Delay in milliseconds.
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Send the app launch email to one recipient.
 * @param {string} email - Recipient email address.
 * @param {string} [name] - Recipient name for greeting.
 * @returns {Promise<void>}
 */
async function sendLaunchEmail(email, name) {
  const { subject, text, html } = buildAppLaunchResetEmailContent({
    recipientName: name || 'there',
  });
  await sendEmail(email, subject, text, html);
}

/**
 * Load all app users (role=user) with email and name.
 * @returns {Promise<Array<{ _id: import('mongoose').Types.ObjectId, email: string, name: string }>>}
 */
async function loadAppUsers() {
  return User.find(USER_FILTER).select('_id email name').lean();
}

/**
 * Delete membership, transaction, token, and preference records for user ids.
 * @param {import('mongoose').Types.ObjectId[]} userIds - Target user ids.
 * @returns {Promise<{ memberships: number, transactions: number, tokens: number, preferences: number }>}
 */
async function deleteUserRelatedData(userIds) {
  const [memberships, transactions, tokens, preferences] = await Promise.all([
    Membership.deleteMany({ userId: { $in: userIds } }),
    Transaction.deleteMany({ userId: { $in: userIds } }),
    Token.deleteMany({ user: { $in: userIds } }),
    NotificationPreferences.deleteMany({ userId: { $in: userIds } }),
  ]);

  return {
    memberships: memberships.deletedCount,
    transactions: transactions.deletedCount,
    tokens: tokens.deletedCount,
    preferences: preferences.deletedCount,
  };
}

/**
 * Send launch emails to all app users, then delete their accounts and related billing data.
 * @returns {Promise<void>}
 */
async function notifyAndResetUsers() {
  const users = await loadAppUsers();

  console.log(`App users found (role=user): ${users.length}`);
  console.log(`Memberships linked to these users: ${await Membership.countDocuments({ userId: { $in: users.map((u) => u._id) } })}`);
  console.log(`Transactions linked to these users: ${await Transaction.countDocuments({ userId: { $in: users.map((u) => u._id) } })}`);

  if (users.length === 0) {
    console.log('Nothing to notify or delete.');
    return;
  }

  if (!APPLY) {
    console.log('\nDry-run only. Re-run with --apply to delete their records.');
    if (!DELETE_ONLY) {
      console.log('Add --delete-only to skip emails when applying.');
    }
    console.log('Sample users:');
    users.slice(0, 5).forEach((user) => console.log(`  - ${user.email} (${user.name})`));
    if (users.length > 5) console.log(`  ... and ${users.length - 5} more`);
    return;
  }

  if (!DELETE_ONLY) {
    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await sendLaunchEmail(user.email, user.name);
        sent += 1;
        console.log(`Sent: ${user.email}`);
        await sleep(EMAIL_DELAY_MS);
      } catch (error) {
        failed += 1;
        console.error(`Failed email for ${user.email}: ${error.message}`);
      }
    }

    console.log(`\nEmail summary: sent=${sent}, failed=${failed}`);
  } else {
    console.log('Skipping emails (--delete-only).');
  }

  const userIds = users.map((user) => user._id);
  const related = await deleteUserRelatedData(userIds);
  const userResult = await User.deleteMany({ _id: { $in: userIds } });

  console.log(`Deleted memberships: ${related.memberships}`);
  console.log(`Deleted transactions: ${related.transactions}`);
  console.log(`Deleted tokens: ${related.tokens}`);
  console.log(`Deleted notification preferences: ${related.preferences}`);
  console.log(`Deleted users: ${userResult.deletedCount}`);
}

/**
 * Send a single preview email before running the full reset.
 * @returns {Promise<void>}
 */
async function sendTestEmail() {
  if (!testEmail) {
    console.error('Usage: --test-email <address>');
    process.exit(1);
  }

  await sendLaunchEmail(testEmail, 'Akshay');
  console.log(`Test email sent to ${testEmail}`);
}

const main = async () => {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);

  if (testEmail) {
    await sendTestEmail();
  } else {
    await notifyAndResetUsers();
  }

  await mongoose.disconnect();
  console.log('Done.');
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
