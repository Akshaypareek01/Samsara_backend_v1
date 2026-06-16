/**
 * One-off migration: copy legacy trainer `city` string into `cities` array.
 *
 * Run:
 *   npm run migrate:trainer-cities
 *   npm run migrate:trainer-cities:dry-run
 *
 * Requires MONGODB_URL in .env (same as other backend scripts).
 */
import mongoose from 'mongoose';
import config from '../config/config.js';
import Trainer from '../models/trainer.model.js';

const DRY_RUN = process.argv.includes('--dry-run');
const UNSET_LEGACY = process.argv.includes('--unset-legacy');

/**
 * Build the target cities array from legacy and current fields.
 *
 * @param {Record<string, unknown>} trainer - Raw trainer document.
 * @returns {string[]} Deduplicated city names.
 */
function resolveCities(trainer) {
  const fromArray = Array.isArray(trainer.cities)
    ? trainer.cities.map((c) => String(c).trim()).filter(Boolean)
    : [];

  if (fromArray.length > 0) {
    return [...new Set(fromArray)];
  }

  const legacy = trainer.city != null ? String(trainer.city).trim() : '';
  return legacy ? [legacy] : [];
}

/**
 * Migrate trainer city -> cities for all records that need it.
 *
 * @returns {Promise<{ scanned: number, updated: number, skipped: number }>} Migration stats.
 */
async function migrateTrainerCities() {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  console.log(`Connected — migrate-trainer-cities${DRY_RUN ? ' (dry run)' : ''}`);

  const stats = { scanned: 0, updated: 0, skipped: 0 };

  try {
    const trainers = await Trainer.collection.find({}).toArray();
    stats.scanned = trainers.length;

    for (const trainer of trainers) {
      const nextCities = resolveCities(trainer);
      const hasLegacyCity =
        trainer.city != null && String(trainer.city).trim() !== '';
      const currentCities = Array.isArray(trainer.cities) ? trainer.cities : [];
      const needsCities =
        nextCities.length > 0 &&
        JSON.stringify([...new Set(currentCities)]) !== JSON.stringify(nextCities);
      const needsUnset = UNSET_LEGACY && hasLegacyCity;

      if (!needsCities && !needsUnset) {
        stats.skipped += 1;
        continue;
      }

      const label = trainer.name || trainer.email || String(trainer._id);
      console.log(`\n[${label}]`);
      if (needsCities) {
        console.log(
          `  cities: ${JSON.stringify(trainer.cities ?? null)} -> ${JSON.stringify(nextCities)}`
        );
      }
      if (needsUnset) {
        console.log(`  unset legacy city: ${JSON.stringify(trainer.city)}`);
      }

      if (!DRY_RUN) {
        const update = {};
        if (needsCities) {
          update.$set = { ...(update.$set || {}), cities: nextCities };
        }
        if (needsUnset) {
          update.$unset = { city: '' };
        }
        await Trainer.collection.updateOne({ _id: trainer._id }, update);
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

migrateTrainerCities().catch((err) => {
  console.error(err);
  process.exit(1);
});

export default migrateTrainerCities;
