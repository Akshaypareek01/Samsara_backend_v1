/**
 * ensure-apple-product-mapping.js
 *
 * Non-destructive, idempotent script that guarantees the Basic Monthly
 * MembershipPlan in Mongo has `appleProductId = "basic_monthly_plan"` and
 * `metadata.revenuecatProductId = "basic_monthly_plan"`. Without this mapping
 * the RevenueCat webhook handler (see src/services/revenuecat.service.js
 * resolvePlan) silently drops purchases because it cannot find a plan.
 *
 * Run on production safely — does NOT touch any other plan, does NOT delete.
 *
 *   node src/scripts/ensure-apple-product-mapping.js
 *
 * Match order (first hit wins):
 *   1. planType=basic + validityDays=30 + isActive=true
 *   2. name regex "Basic" + "Monthly"
 *
 * If no candidate is found, the script logs and exits non-zero so CI can fail.
 */

import mongoose from 'mongoose';
import config from '../config/config.js';
import { MembershipPlan } from '../models/index.js';

const APPLE_PRODUCT_ID = 'basic_monthly_plan';

/**
 * Find the Basic Monthly plan by multiple strategies.
 * @returns {Promise<import('mongoose').Document|null>}
 */
async function findBasicMonthlyPlan() {
  let plan = await MembershipPlan.findOne({
    planType: 'basic',
    validityDays: 30,
    isActive: true,
  });
  if (plan) return plan;

  plan = await MembershipPlan.findOne({
    name: { $regex: /basic/i },
    validityDays: 30,
    isActive: true,
  });
  if (plan) return plan;

  plan = await MembershipPlan.findOne({
    name: { $regex: /basic.*monthly|monthly.*basic/i },
    isActive: true,
  });
  return plan;
}

async function run() {
  let exitCode = 0;
  try {
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log('[ensureAppleProductMapping] connected to MongoDB');

    const plan = await findBasicMonthlyPlan();

    if (!plan) {
      console.error(
        '[ensureAppleProductMapping] No Basic Monthly plan found. Create one (see seed-membership-data.js) before running this script.'
      );
      exitCode = 1;
      return;
    }

    const needsUpdate =
      plan.appleProductId !== APPLE_PRODUCT_ID ||
      plan?.metadata?.revenuecatProductId !== APPLE_PRODUCT_ID;

    if (!needsUpdate) {
      console.log(
        `[ensureAppleProductMapping] OK: plan "${plan.name}" (_id=${plan._id}) already mapped to "${APPLE_PRODUCT_ID}"`
      );
      return;
    }

    plan.appleProductId = APPLE_PRODUCT_ID;
    plan.metadata = {
      ...(plan.metadata || {}),
      revenuecatProductId: APPLE_PRODUCT_ID,
    };
    await plan.save();

    console.log(
      `[ensureAppleProductMapping] Updated plan "${plan.name}" (_id=${plan._id}) with appleProductId=${APPLE_PRODUCT_ID}`
    );
  } catch (err) {
    console.error('[ensureAppleProductMapping] FAILED:', err);
    exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
    process.exit(exitCode);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

export default run;
