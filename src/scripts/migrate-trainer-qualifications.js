/**
 * One-off migration: convert legacy single-object education/certification fields
 * on existing trainers into arrays (max 5 entries each).
 *
 * Run:
 *   npm run migrate:trainer-qualifications
 *   npm run migrate:trainer-qualifications:dry-run
 *
 * Requires MONGODB_URL in .env (same as other backend scripts).
 */
import mongoose from 'mongoose';
import config from '../config/config.js';
import Trainer from '../models/trainer.model.js';
import {
  filterFilledCertificationEntries,
  filterFilledEducationEntries,
  normalizeCertificationList,
  normalizeEducationList,
} from '../utils/trainerQualificationUtils.js';

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Build the migrated array value for a qualification field.
 *
 * @param {unknown} raw - Current DB value.
 * @param {(value: unknown) => unknown[]} normalize - Normalizer fn.
 * @param {(entries: unknown[]) => unknown[]} filter - Filter fn.
 * @returns {unknown[]} Clean array for persistence.
 */
function migrateFieldValue(raw, normalize, filter) {
  return filter(normalize(raw));
}

/**
 * Whether the stored value differs from the migrated array shape.
 *
 * @param {unknown} current - Current DB value.
 * @param {unknown[]} migrated - Target array value.
 * @returns {boolean} True when an update is required.
 */
function fieldNeedsMigration(current, migrated) {
  if (current == null) {
    return migrated.length > 0;
  }
  if (!Array.isArray(current)) {
    return true;
  }
  return JSON.stringify(current) !== JSON.stringify(migrated);
}

/**
 * Migrate all trainer education/certification records to array format.
 *
 * @returns {Promise<{ scanned: number, updated: number, skipped: number }>} Migration stats.
 */
async function migrateTrainerQualifications() {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  console.log(`Connected — migrate-trainer-qualifications${DRY_RUN ? ' (dry run)' : ''}`);

  const stats = { scanned: 0, updated: 0, skipped: 0 };

  try {
    const trainers = await Trainer.collection.find({}).toArray();
    stats.scanned = trainers.length;

    for (const trainer of trainers) {
      const nextEducation = migrateFieldValue(
        trainer.education,
        normalizeEducationList,
        filterFilledEducationEntries
      );
      const nextCertification = migrateFieldValue(
        trainer.certification,
        normalizeCertificationList,
        filterFilledCertificationEntries
      );

      const educationChanged = fieldNeedsMigration(trainer.education, nextEducation);
      const certificationChanged = fieldNeedsMigration(trainer.certification, nextCertification);

      if (!educationChanged && !certificationChanged) {
        stats.skipped += 1;
        continue;
      }

      const label = trainer.name || trainer.email || String(trainer._id);
      const changes = [];

      if (educationChanged) {
        changes.push(
          `education: ${JSON.stringify(trainer.education ?? null)} -> ${JSON.stringify(nextEducation)}`
        );
      }
      if (certificationChanged) {
        changes.push(
          `certification: ${JSON.stringify(trainer.certification ?? null)} -> ${JSON.stringify(nextCertification)}`
        );
      }

      console.log(`\n[${label}]`);
      changes.forEach((line) => console.log(`  ${line}`));

      if (!DRY_RUN) {
        const $set = {};
        if (educationChanged) $set.education = nextEducation;
        if (certificationChanged) $set.certification = nextCertification;

        await Trainer.collection.updateOne({ _id: trainer._id }, { $set });
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

migrateTrainerQualifications().catch((err) => {
  console.error(err);
  process.exit(1);
});

export default migrateTrainerQualifications;
