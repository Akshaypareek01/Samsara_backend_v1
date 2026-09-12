import mongoose from 'mongoose';
import path from 'path';
import { pathToFileURL } from 'url';
import config from '../config/config.js';
import { MembershipPlan } from '../models/index.js';
import {
  LAUNCH_PLAN_NAME,
  buildLaunchPlanDocument,
} from '../constants/launch-plan.js';

const FALLBACK_ACCESS_FEATURES = [
  'One Yoga Class per day',
  'One Meditation Class per day',
  'Weekend Online Wellness Events',
  'Pre-Recorded Guided Meditation',
  'Meditation Music Library',
  'Personal Dosha Analysis',
  'PCOS/PCOD Assessment',
  'Thyroid Assessment',
  'Menopause Assessment',
  'Health Tracker',
  'Body Tracker',
  'Period Tracker',
  'Mood Tracker',
  'PCOS/PCOD Diet & Nutrition Plan',
  'Thyroid Diet & Nutrition Plan',
  'Menopause Diet & Nutrition Plan',
];

/**
 * Resolve Basic Access features from the live monthly plan, else the fallback list.
 * @returns {Promise<string[]>}
 */
async function resolveAccessFeatures() {
  const monthly = await MembershipPlan.findOne({
    name: 'Basic Access – Monthly Plan',
    isActive: true,
  })
    .select('features')
    .lean();

  if (Array.isArray(monthly?.features) && monthly.features.length > 0) {
    return monthly.features;
  }
  return FALLBACK_ACCESS_FEATURES;
}

/**
 * Idempotent upsert of Launch Plan. Safe to re-run against prod — does not wipe other plans.
 */
async function upsertLaunchPlan() {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  console.log('Connected — upserting Launch Plan');

  try {
    const accessFeatures = await resolveAccessFeatures();
    const payload = buildLaunchPlanDocument(accessFeatures);
    const { availableFrom, ...updatable } = payload;

    const plan = await MembershipPlan.findOneAndUpdate(
      { name: LAUNCH_PLAN_NAME },
      { $set: updatable, $setOnInsert: { availableFrom } },
      { upsert: true, new: true, runValidators: true }
    );

    const gst = plan.taxConfig?.gst?.rate ?? 0;
    const total = plan.calculateTotalPrice('INR');
    console.log(
      `Launch Plan id=${plan.id || plan._id} | ₹${plan.basePrice} + ${gst}% GST = ₹${total} | ${plan.validityDays}d | until ${plan.availableUntil?.toISOString()} | appleProductId=${plan.appleProductId} | displayMemberCap=${plan.metadata?.displayMemberCap} (enforced=${plan.metadata?.enforceMemberCap})`
    );
  } catch (err) {
    console.error('upsert-launch-plan failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

const invokedDirect =
  typeof process.argv[1] === 'string' &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (invokedDirect) {
  upsertLaunchPlan().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export default upsertLaunchPlan;
