import mongoose from 'mongoose';
import config from '../config/config.js';
import { MembershipPlan } from '../models/index.js';

/**
 * One-off update: revise INR-only pricing for Basic Access Half-Yearly and Yearly plans.
 * Leaves USD pricing, features, validity, taxConfig, etc. untouched.
 *
 * - Half-Yearly: ₹12599 → ₹9999 (effective ₹1667/month)
 * - Yearly:      ₹19799 → ₹11899 (effective ₹992/month)
 *
 * Safe to re-run (idempotent — sets exact values).
 */
async function updateBasicPlanInrPrices() {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  console.log('Connected — running update-basic-plan-inr-prices');

  try {
    const halfYearly = await MembershipPlan.updateOne(
      { name: 'Basic Access – Half-Yearly Plan' },
      {
        $set: {
          basePrice: 9999,
          description: 'Basic Access Plan billed every 6 months (INR ₹9999 / USD $274.99).',
          'metadata.effectiveMonthlyInr': 1667,
        },
      }
    );
    console.log(
      `Half-Yearly: matched=${halfYearly.matchedCount}, modified=${halfYearly.modifiedCount}`
    );

    const yearly = await MembershipPlan.updateOne(
      { name: 'Basic Access – Yearly Plan' },
      {
        $set: {
          basePrice: 11899,
          description: 'Basic Access Plan billed annually (INR ₹11899 / USD $439). Best value.',
          'metadata.effectiveMonthlyInr': 992,
        },
      }
    );
    console.log(
      `Yearly: matched=${yearly.matchedCount}, modified=${yearly.modifiedCount}`
    );

    if (halfYearly.matchedCount === 0 || yearly.matchedCount === 0) {
      console.warn(
        'Warning: one or both plans were not found. Verify plan names in MembershipPlan collection.'
      );
    }

    const refreshed = await MembershipPlan.find({
      name: { $in: ['Basic Access – Half-Yearly Plan', 'Basic Access – Yearly Plan'] },
    })
      .select('name basePrice usdBasePrice validityDays metadata.effectiveMonthlyInr metadata.effectiveMonthlyUsd')
      .lean();

    console.log('\nCurrent prices:');
    refreshed.forEach((p) => {
      console.log(
        `- ${p.name}: ₹${p.basePrice} / $${p.usdBasePrice} | effective ₹${p?.metadata?.effectiveMonthlyInr}/mo · $${p?.metadata?.effectiveMonthlyUsd}/mo (${p.validityDays} d)`
      );
    });
  } catch (err) {
    console.error('update-basic-plan-inr-prices failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  updateBasicPlanInrPrices();
}

export default updateBasicPlanInrPrices;
