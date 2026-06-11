/**
 * Backfill weeklyAvailability for existing trainers.
 *
 * Default (no flag): sets `weeklyAvailability: []` so bookings stay unrestricted
 * until each trainer saves their own schedule in the profile.
 *
 * Optional `--apply-defaults`: sets Mon–Fri 09:00–18:00 for trainers with no schedule.
 *
 * Run:
 *   npm run migrate:trainer-weekly-availability
 *   npm run migrate:trainer-weekly-availability:dry-run
 *   npm run migrate:trainer-weekly-availability -- --apply-defaults
 *
 * Requires MONGODB_URL in .env.
 */
import mongoose from 'mongoose';
import config from '../config/config.js';
import Trainer from '../models/trainer.model.js';
import { DEFAULT_WEEKLY_AVAILABILITY } from '../utils/trainerAvailabilityUtils.js';

const DRY_RUN = process.argv.includes('--dry-run');
const APPLY_DEFAULTS = process.argv.includes('--apply-defaults');

/**
 * Whether a trainer document needs a weeklyAvailability backfill.
 *
 * @param {object} trainer - Lean trainer document.
 * @returns {boolean}
 */
function needsMigration(trainer) {
  if (trainer.weeklyAvailability == null) {
    return true;
  }
  if (!Array.isArray(trainer.weeklyAvailability)) {
    return true;
  }
  return false;
}

/**
 * Target value to persist for a trainer missing weeklyAvailability.
 *
 * @returns {Array}
 */
function targetAvailability() {
  return APPLY_DEFAULTS ? DEFAULT_WEEKLY_AVAILABILITY : [];
}

/**
 * Migrate all trainers missing weeklyAvailability.
 *
 * @returns {Promise<{ scanned: number, updated: number, skipped: number }>}
 */
async function migrateTrainerWeeklyAvailability() {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  const mode = APPLY_DEFAULTS ? 'apply-defaults' : 'empty-array';
  console.log(
    `Connected — migrate-trainer-weekly-availability (${mode})${DRY_RUN ? ' [dry run]' : ''}`
  );

  const trainers = await Trainer.find({}).select('name email weeklyAvailability').lean();
  let updated = 0;
  let skipped = 0;

  for (const trainer of trainers) {
    if (!needsMigration(trainer)) {
      skipped += 1;
      continue;
    }

    const nextValue = targetAvailability();
    console.log(
      `${DRY_RUN ? '[dry-run] ' : ''}Update ${trainer.name || trainer.email || trainer._id}: weeklyAvailability → ${nextValue.length} day(s)`
    );

    if (!DRY_RUN) {
      await Trainer.updateOne({ _id: trainer._id }, { $set: { weeklyAvailability: nextValue } });
    }
    updated += 1;
  }

  await mongoose.disconnect();
  return { scanned: trainers.length, updated, skipped };
}

migrateTrainerWeeklyAvailability()
  .then(({ scanned, updated, skipped }) => {
    console.log(`Done. scanned=${scanned} updated=${updated} skipped=${skipped}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
