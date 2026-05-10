import mongoose from 'mongoose';
import config from '../config/config.js';
import { MembershipPlan, CouponCode } from '../models/index.js';

/**
 * One-off migration: dual-currency Basic plans, delete Trial Plan, hide Lifetime from public catalog.
 * Run after deploying the schema with `usdBasePrice` and `isPublic`.
 */
async function migrateBasicPlanDualCurrency() {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  console.log('Connected — running migrate-basic-plan-dual-currency');

  try {
    const trialPlan = await MembershipPlan.findOne({ name: 'Trial Plan' }).select('_id').lean();
    if (trialPlan) {
      const pullResult = await CouponCode.updateMany(
        { applicablePlans: trialPlan._id },
        { $pull: { applicablePlans: trialPlan._id } }
      );
      console.log(`Stripped Trial Plan id from coupons: modified ${pullResult.modifiedCount}`);
      await MembershipPlan.deleteMany({ _id: trialPlan._id });
      console.log('Deleted Trial Plan documents.');
    } else {
      console.log('No Trial Plan document found — skip delete.');
    }

    const monthly = await MembershipPlan.updateOne(
      { name: 'Basic Access – Monthly Plan' },
      {
        $set: {
          basePrice: 2999,
          usdBasePrice: 65,
          isPublic: true,
          description: 'Basic Access Plan billed monthly (INR ₹2999 / USD $65). Cancel anytime.',
          'metadata.billingCycle': 'monthly',
          'metadata.cancelAnytime': true,
          'metadata.accessTier': 'Basic Access',
        },
      }
    );

    const quarterly = await MembershipPlan.updateOne(
      { name: 'Basic Access – Quarterly Plan' },
      {
        $set: {
          basePrice: 8997,
          usdBasePrice: 195,
          isPublic: true,
          description: 'Basic Access Plan billed every 3 months (INR ₹8997 / USD $195).',
          'metadata.billingCycle': 'quarterly',
          'metadata.accessTier': 'Basic Access',
          'metadata.effectiveMonthlyInr': 2999,
          'metadata.effectiveMonthlyUsd': 65,
        },
        $unset: {
          'metadata.discountPercentage': '',
          'metadata.originalPrice': '',
          'metadata.effectiveMonthlyPrice': '',
          'metadata.savingsOverPeriod': '',
          'metadata.savingsPeriodLabel': '',
        },
      }
    );

    const halfYearly = await MembershipPlan.updateOne(
      { name: 'Basic Access – Half-Yearly Plan' },
      {
        $set: {
          basePrice: 17994,
          usdBasePrice: 390,
          isPublic: true,
          description: 'Basic Access Plan billed every 6 months (INR ₹17994 / USD $390).',
          'metadata.billingCycle': 'half-yearly',
          'metadata.accessTier': 'Basic Access',
          'metadata.effectiveMonthlyInr': 2999,
          'metadata.effectiveMonthlyUsd': 65,
        },
        $unset: {
          'metadata.discountPercentage': '',
          'metadata.originalPrice': '',
          'metadata.effectiveMonthlyPrice': '',
          'metadata.savingsOverPeriod': '',
          'metadata.savingsPeriodLabel': '',
        },
      }
    );

    const yearly = await MembershipPlan.updateOne(
      { name: 'Basic Access – Yearly Plan' },
      {
        $set: {
          basePrice: 35988,
          usdBasePrice: 780,
          isPublic: true,
          description: 'Basic Access Plan billed annually (INR ₹35988 / USD $780). Best value.',
          'metadata.billingCycle': 'yearly',
          'metadata.bestValue': true,
          'metadata.accessTier': 'Basic Access',
          'metadata.effectiveMonthlyInr': 2999,
          'metadata.effectiveMonthlyUsd': 65,
        },
        $unset: {
          'metadata.discountPercentage': '',
          'metadata.originalPrice': '',
          'metadata.effectiveMonthlyPrice': '',
          'metadata.savingsOverPeriod': '',
          'metadata.savingsPeriodLabel': '',
        },
      }
    );

    console.log('Basic Access updates:', { monthly, quarterly, halfYearly, yearly });

    const lifetime = await MembershipPlan.updateOne(
      { name: 'Lifetime Plan' },
      {
        $set: {
          isPublic: false,
          planType: 'enterprise',
          description: 'Internal teacher complimentary access — not available for purchase.',
        },
      }
    );
    console.log('Lifetime Plan (internal):', lifetime);
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrateBasicPlanDualCurrency().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export default migrateBasicPlanDualCurrency;
