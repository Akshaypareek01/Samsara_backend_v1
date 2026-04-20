/**
 * diagnose-iap-purchase.js
 *
 * One-shot diagnostic for verifying a RevenueCat iOS purchase has landed in the backend.
 * Run from S_Backend/Samsara_backend_v1 root:
 *
 *   node src/scripts/diagnose-iap-purchase.js [optional-userId]
 *
 * What it checks:
 *   1. MembershipPlan with appleProductId=basic_monthly_plan exists.
 *   2. Lists all RevenueCat memberships created in the last 24h.
 *   3. Lists all transactions (paymentMethod=apple) created in the last 24h.
 *   4. If a userId is provided, deep-dives that user's RC state.
 *   5. Verifies env vars are set.
 *
 * No writes, fully read-only.
 */

import mongoose from 'mongoose';
import config from '../config/config.js';
import {
  Membership,
  MembershipPlan,
  Transaction,
  User,
} from '../models/index.js';

const log = (...args) => console.log('[diagnose]', ...args);
const ok = (msg) => console.log(`  ✅ ${msg}`);
const warn = (msg) => console.log(`  ⚠️  ${msg}`);
const err = (msg) => console.log(`  ❌ ${msg}`);

const TARGET_USER_ID = process.argv[2];

const HOURS_BACK = 24;
const since = new Date(Date.now() - HOURS_BACK * 60 * 60 * 1000);

const main = async () => {
  log(`Connecting to MongoDB...`);
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  ok(`Connected. Looking back ${HOURS_BACK}h (since ${since.toISOString()})`);

  console.log('\n=== 1. MembershipPlan mapping check ===');
  const plan = await MembershipPlan.findOne({
    appleProductId: 'basic_monthly_plan',
    isActive: true,
  });
  if (plan) {
    ok(`Found plan: ${plan.name} (${plan._id})`);
    console.log(`     appleProductId: ${plan.appleProductId}`);
    console.log(`     basePrice: ${plan.currency} ${plan.basePrice}`);
    console.log(`     validityDays: ${plan.validityDays}`);
  } else {
    err(`No active MembershipPlan with appleProductId=basic_monthly_plan`);
    err(`→ run: node src/scripts/ensure-apple-product-mapping.js`);
  }

  console.log('\n=== 2. RevenueCat memberships in last 24h ===');
  const rcMemberships = await Membership.find({
    paymentProvider: 'revenuecat',
    createdAt: { $gte: since },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (rcMemberships.length === 0) {
    warn(`Zero RevenueCat memberships created in last ${HOURS_BACK}h`);
    warn(`→ Either no purchases happened, or webhook is failing silently`);
  } else {
    ok(`Found ${rcMemberships.length} RC membership(s):`);
    rcMemberships.forEach((m, i) => {
      console.log(`\n  [${i + 1}] _id=${m._id}`);
      console.log(`       userId=${m.userId}`);
      console.log(`       status=${m.status}  autoRenewal=${m.autoRenewal}`);
      console.log(`       productId=${m.revenuecatProductId}`);
      console.log(`       entitlement=${m.revenuecatEntitlementId}`);
      console.log(`       startDate=${m.startDate?.toISOString()}`);
      console.log(`       endDate=${m.endDate?.toISOString()}`);
      console.log(`       sandbox=${m.metadata?.revenuecatIsSandbox}`);
      console.log(`       source=${m.metadata?.source || 'unknown'}`);
      console.log(`       createdAt=${m.createdAt?.toISOString()}`);
    });
  }

  console.log('\n=== 3. Apple transactions in last 24h ===');
  const txns = await Transaction.find({
    paymentMethod: 'apple',
    createdAt: { $gte: since },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (txns.length === 0) {
    warn(`Zero Apple transactions in last ${HOURS_BACK}h`);
  } else {
    ok(`Found ${txns.length} Apple transaction(s):`);
    txns.forEach((t, i) => {
      console.log(`\n  [${i + 1}] _id=${t._id}`);
      console.log(`       userId=${t.userId}`);
      console.log(`       transactionId=${t.transactionId}`);
      console.log(`       amount=${t.currency} ${t.amount}`);
      console.log(`       status=${t.status}`);
      console.log(`       platform=${t.platform}`);
      console.log(`       createdAt=${t.createdAt?.toISOString()}`);
    });
  }

  if (TARGET_USER_ID) {
    console.log(`\n=== 4. Deep dive on userId=${TARGET_USER_ID} ===`);

    let user = null;
    try {
      user = await User.findById(TARGET_USER_ID).lean();
    } catch (e) {
      err(`Invalid ObjectId: ${TARGET_USER_ID}`);
    }

    if (user) {
      ok(`User exists: ${user.email || user.phone || user.name}`);
    } else if (TARGET_USER_ID) {
      warn(`User document not found for that id`);
    }

    const userMemberships = await Membership.find({
      userId: TARGET_USER_ID,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (userMemberships.length === 0) {
      err(`No memberships at all for this user`);
    } else {
      ok(`Found ${userMemberships.length} membership(s) for this user:`);
      userMemberships.forEach((m, i) => {
        console.log(`\n  [${i + 1}] _id=${m._id}`);
        console.log(`       provider=${m.paymentProvider}`);
        console.log(`       status=${m.status}`);
        console.log(`       productId=${m.revenuecatProductId || 'n/a'}`);
        console.log(`       endDate=${m.endDate?.toISOString()}`);
        console.log(`       createdAt=${m.createdAt?.toISOString()}`);
      });
    }
  } else {
    console.log(`\n(Tip) Pass a userId to deep-dive: node src/scripts/diagnose-iap-purchase.js <userId>`);
  }

  console.log('\n=== 5. Env vars ===');
  if (config.revenuecat.secretKey) {
    ok(`REVENUECAT_SECRET_KEY set (${config.revenuecat.secretKey.slice(0, 12)}...)`);
  } else {
    err(`REVENUECAT_SECRET_KEY missing`);
  }
  if (config.revenuecat.webhookSecret) {
    ok(`REVENUECAT_WEBHOOK_SECRET set (length=${config.revenuecat.webhookSecret.length})`);
  } else {
    err(`REVENUECAT_WEBHOOK_SECRET missing — webhook auth is open!`);
  }

  console.log('\n=== Summary ===');
  if (!plan) {
    err(`HARD BLOCKER: appleProductId mapping missing — run ensure-apple-product-mapping.js`);
  } else if (rcMemberships.length === 0 && txns.length === 0) {
    err(`No RC activity recorded in last ${HOURS_BACK}h.`);
    err(`Most likely causes:`);
    err(`  a) Webhook not reaching backend (check Render/AWS/etc. logs for POST /v1/webhooks/revenuecat)`);
    err(`  b) Webhook auth failing (401 — check REVENUECAT_WEBHOOK_SECRET matches RC dashboard)`);
    err(`  c) Webhook returning 500 silently (check error logs for 'RevenueCat webhook processing error')`);
  } else if (rcMemberships.length > 0) {
    ok(`Purchase pipeline working — ${rcMemberships.length} membership(s) created.`);
  }

  await mongoose.disconnect();
  log('Done.');
  process.exit(0);
};

main().catch((e) => {
  console.error('Diagnose script crashed:', e);
  process.exit(1);
});
