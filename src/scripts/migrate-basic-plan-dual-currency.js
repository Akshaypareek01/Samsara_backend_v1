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
          basePrice: 7197.6,
          usdBasePrice: 156,
          isPublic: true,
          description: 'Basic Access Plan billed every 3 months (INR ₹7197.60 / USD $156).',
          'metadata.billingCycle': 'quarterly',
          'metadata.accessTier': 'Basic Access',
          'metadata.effectiveMonthlyInr': 2399.2,
          'metadata.effectiveMonthlyUsd': 52,
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
          basePrice: 12595.8,
          usdBasePrice: 273,
          isPublic: true,
          description: 'Basic Access Plan billed every 6 months (INR ₹12595.80 / USD $273).',
          'metadata.billingCycle': 'half-yearly',
          'metadata.accessTier': 'Basic Access',
          'metadata.effectiveMonthlyInr': 2099.3,
          'metadata.effectiveMonthlyUsd': 45.5,
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
          basePrice: 19793.4,
          usdBasePrice: 429,
          isPublic: true,
          description: 'Basic Access Plan billed annually (INR ₹19793.40 / USD $429). Best value.',
          'metadata.billingCycle': 'yearly',
          'metadata.bestValue': true,
          'metadata.accessTier': 'Basic Access',
          'metadata.effectiveMonthlyInr': 1649.45,
          'metadata.effectiveMonthlyUsd': 35.75,
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
