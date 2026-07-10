/**
 * One-off migration: reclassify trainers from Women Health Trainer → Ayurveda Doctor.
 *
 * Replaces "Women Health Trainer" with "Ayurveda Doctor" in each trainer's `category` array.
 *
 * Run:
 *   npm run migrate:women-health-to-ayurveda-doctor
 *   npm run migrate:women-health-to-ayurveda-doctor:dry-run
 *
 * Requires MONGODB_URL in .env (same as other backend scripts).
 */
import mongoose from 'mongoose';
import config from '../config/config.js';
import Trainer from '../models/trainer.model.js';
import { normalizeTrainerCategories } from '../utils/trainerCategoryUtils.js';

const DRY_RUN = process.argv.includes('--dry-run');

const FROM_CATEGORY = 'Women Health Trainer';
const TO_CATEGORY = 'Ayurveda Doctor';

/**
 * Replace Women Health Trainer with Ayurveda Doctor in a normalized category list.
 *
 * @param {string[]} categories - Current trainer categories.
 * @returns {string[]|null} Updated categories, or null when no change is needed.
 */
function migrateCategories(categories) {
  if (!categories.includes(FROM_CATEGORY)) {
    return null;
  }

  const withoutLegacy = categories.filter((cat) => cat !== FROM_CATEGORY);
  if (!withoutLegacy.includes(TO_CATEGORY)) {
    withoutLegacy.push(TO_CATEGORY);
  }

  return [...new Set(withoutLegacy)];
}

/**
 * Migrate all trainers whose profile includes the Women Health Trainer category.
 *
 * @returns {Promise<{ scanned: number, matched: number, updated: number, skipped: number }>}
 */
async function migrateWomenHealthToAyurvedaDoctor() {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  console.log(`Connected — migrate-women-health-to-ayurveda-doctor${DRY_RUN ? ' (dry run)' : ''}`);

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

migrateWomenHealthToAyurvedaDoctor().catch((err) => {
  console.error(err);
  process.exit(1);
});

export default migrateWomenHealthToAyurvedaDoctor;
