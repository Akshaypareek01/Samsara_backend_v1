/**
 * One-off migration: wrap legacy trainer `category` string into `category` array.
 *
 * Run:
 *   npm run migrate:trainer-categories
 *   npm run migrate:trainer-categories:dry-run
 *
 * Requires MONGODB_URL in .env (same as other backend scripts).
 */
import mongoose from 'mongoose';
import config from '../config/config.js';
import Trainer from '../models/trainer.model.js';
import { normalizeTrainerCategories } from '../utils/trainerCategoryUtils.js';

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Resolve the target category array from legacy string or existing array.
 *
 * @param {Record<string, unknown>} trainer - Raw trainer document.
 * @returns {string[]} Deduplicated category values.
 */
function resolveCategories(trainer) {
  return normalizeTrainerCategories(trainer.category);
}

/**
 * Migrate trainer category string -> array for all records that need it.
 *
 * @returns {Promise<{ scanned: number, updated: number, skipped: number }>} Migration stats.
 */
async function migrateTrainerCategories() {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  console.log(`Connected — migrate-trainer-categories${DRY_RUN ? ' (dry run)' : ''}`);

  const stats = { scanned: 0, updated: 0, skipped: 0 };

  try {
    const trainers = await Trainer.collection.find({}).toArray();
    stats.scanned = trainers.length;

    for (const trainer of trainers) {
      const nextCategories = resolveCategories(trainer);
      const currentIsArray = Array.isArray(trainer.category);
      const needsUpdate =
        nextCategories.length > 0 &&
        (!currentIsArray ||
          JSON.stringify([...new Set(trainer.category)]) !== JSON.stringify(nextCategories));

      if (!needsUpdate) {
        stats.skipped += 1;
        continue;
      }

      const label = trainer.name || trainer.email || String(trainer._id);
      console.log(`\n[${label}]`);
      console.log(
        `  category: ${JSON.stringify(trainer.category ?? null)} -> ${JSON.stringify(nextCategories)}`
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
    console.log(`Scanned:  ${stats.scanned}`);
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

migrateTrainerCategories().catch((err) => {
  console.error(err);
  process.exit(1);
});

export default migrateTrainerCategories;
