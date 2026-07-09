/**
 * One-off migration: reclassify trainers mistakenly registered as EAP Trainer → Psychologist.
 *
 * Replaces "EAP Trainer" with "Psychologist" in each trainer's `category` array.
 * Keeps "EAP Trainer" in TRAINER_CATEGORY_ENUM for future registrations; this only
 * updates existing records.
 *
 * Run:
 *   npm run migrate:eap-trainer-to-psychologist
 *   npm run migrate:eap-trainer-to-psychologist:dry-run
 *
 * Requires MONGODB_URL in .env (same as other backend scripts).
 */
import mongoose from 'mongoose';
import config from '../config/config.js';
import Trainer from '../models/trainer.model.js';
import { normalizeTrainerCategories } from '../utils/trainerCategoryUtils.js';

const DRY_RUN = process.argv.includes('--dry-run');

const FROM_CATEGORY = 'EAP Trainer';
const TO_CATEGORY = 'Psychologist';

/**
 * Replace EAP Trainer with Psychologist in a normalized category list.
 *
 * @param {string[]} categories - Current trainer categories.
 * @returns {string[]|null} Updated categories, or null when no change is needed.
 */
function migrateCategories(categories) {
  if (!categories.includes(FROM_CATEGORY)) {
    return null;
  }

  const withoutEap = categories.filter((cat) => cat !== FROM_CATEGORY);
  if (!withoutEap.includes(TO_CATEGORY)) {
    withoutEap.push(TO_CATEGORY);
  }

  return [...new Set(withoutEap)];
}

/**
 * Migrate all trainers whose profile includes the EAP Trainer category.
 *
 * @returns {Promise<{ scanned: number, matched: number, updated: number, skipped: number }>}
 */
async function migrateEapTrainerToPsychologist() {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  console.log(`Connected — migrate-eap-trainer-to-psychologist${DRY_RUN ? ' (dry run)' : ''}`);

  const stats = { scanned: 0, matched: 0, updated: 0, skipped: 0 };

  try {
    const trainers = await Trainer.collection
      .find({
        $or: [{ category: FROM_CATEGORY }, { category: { $in: [FROM_CATEGORY] } }],
      })
      .toArray();

    stats.scanned = trainers.length;
    stats.matched = trainers.length;

    for (const trainer of trainers) {
      const currentCategories = normalizeTrainerCategories(trainer.category);
      const nextCategories = migrateCategories(currentCategories);

      if (!nextCategories) {
        stats.skipped += 1;
        continue;
      }

      const label = trainer.name || trainer.email || String(trainer._id);
      console.log(`\n[${label}]`);
      console.log(
        `  category: ${JSON.stringify(currentCategories)} -> ${JSON.stringify(nextCategories)}`
      );

      if (!DRY_RUN) {
        await Trainer.collection.updateOne(
          { _id: trainer._id },
          { $set: { category: nextCategories } }
        );
      }

      stats.updated += 1;
    }

    console.log('\n--- Summary ---');
    console.log(`Matched:  ${stats.matched}`);
    console.log(`Updated:  ${stats.updated}${DRY_RUN ? ' (would update)' : ''}`);
    console.log(`Skipped:  ${stats.skipped}`);

    return stats;
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateEapTrainerToPsychologist().catch((err) => {
  console.error(err);
  process.exit(1);
});

export default migrateEapTrainerToPsychologist;
