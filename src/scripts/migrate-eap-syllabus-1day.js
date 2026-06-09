/**
 * One-off migration: EAP trainings — replace 6h with 24h (1 day) and convert
 * syllabus bullet points to a single description paragraph per duration.
 *
 * Run:
 *   npm run migrate:eap-syllabus-1day
 *   npm run migrate:eap-syllabus-1day:dry-run
 *
 * Requires MONGODB_URL in .env (same as other backend scripts).
 */
import mongoose from 'mongoose';
import config from '../config/config.js';
import EapTraining from '../models/eap-training.model.js';

const DRY_RUN = process.argv.includes('--dry-run');
const LEGACY_ONE_DAY_HOURS = 6;
const ONE_DAY_HOURS = 24;

/**
 * Normalize duration options, mapping legacy 6 → 24 and deduplicating.
 *
 * @param {number[]} options - Raw durationOptions array.
 * @returns {number[]} Normalized sorted unique durations.
 */
function normalizeDurationOptions(options) {
  if (!Array.isArray(options)) return [];
  const mapped = options.map((h) => (h === LEGACY_ONE_DAY_HOURS ? ONE_DAY_HOURS : h));
  return [...new Set(mapped)].sort((a, b) => a - b);
}

/**
 * Build migrated syllabus entries with description and normalized durations.
 *
 * @param {Array<{ durationHours?: number, description?: string, points?: string[] }>} syllabus
 * @returns {Array<{ durationHours: number, description: string }>}
 */
function migrateSyllabus(syllabus) {
  if (!Array.isArray(syllabus)) return [];

  const byDuration = new Map();

  for (const entry of syllabus) {
    const durationHours =
      entry?.durationHours === LEGACY_ONE_DAY_HOURS ? ONE_DAY_HOURS : Number(entry?.durationHours);
    if (!durationHours) continue;

    const fromDescription = String(entry.description ?? '').trim();
    const fromPoints = Array.isArray(entry.points)
      ? entry.points.map((p) => String(p).trim()).filter(Boolean).join('\n')
      : '';
    const description = fromDescription || fromPoints;

    const existing = byDuration.get(durationHours);
    if (!existing) {
      byDuration.set(durationHours, { durationHours, description });
      continue;
    }
    if (!existing.description && description) {
      existing.description = description;
    }
  }

  return [...byDuration.values()].sort((a, b) => a.durationHours - b.durationHours);
}

/**
 * Whether a document needs migration.
 *
 * @param {object} doc - Raw EapTraining document.
 * @param {number[]} nextDurations
 * @param {Array<{ durationHours: number, description: string }>} nextSyllabus
 * @returns {boolean}
 */
function docNeedsMigration(doc, nextDurations, nextSyllabus) {
  const durationsChanged =
    JSON.stringify(normalizeDurationOptions(doc.durationOptions)) !== JSON.stringify(nextDurations);

  const currentSyllabus = migrateSyllabus(doc.syllabus);
  const syllabusChanged = JSON.stringify(currentSyllabus) !== JSON.stringify(nextSyllabus);

  const hasLegacyPoints = Array.isArray(doc.syllabus) && doc.syllabus.some((e) => Array.isArray(e?.points));
  const hasLegacySix =
    (Array.isArray(doc.durationOptions) && doc.durationOptions.includes(LEGACY_ONE_DAY_HOURS)) ||
    (Array.isArray(doc.syllabus) &&
      doc.syllabus.some((e) => e?.durationHours === LEGACY_ONE_DAY_HOURS));

  return durationsChanged || syllabusChanged || hasLegacyPoints || hasLegacySix;
}

/**
 * Migrate all EAP training documents.
 *
 * @returns {Promise<{ scanned: number, updated: number, skipped: number }>}
 */
async function migrateEapSyllabusOneDay() {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  console.log(`Connected — migrate-eap-syllabus-1day${DRY_RUN ? ' (dry run)' : ''}`);

  const stats = { scanned: 0, updated: 0, skipped: 0 };

  try {
    const docs = await EapTraining.collection.find({}).toArray();
    stats.scanned = docs.length;

    for (const doc of docs) {
      const nextDurations = normalizeDurationOptions(doc.durationOptions);
      const nextSyllabus = migrateSyllabus(doc.syllabus);

      if (!docNeedsMigration(doc, nextDurations, nextSyllabus)) {
        stats.skipped += 1;
        continue;
      }

      const label = doc.title || String(doc._id);
      console.log(`\n[${label}]`);
      console.log(`  durationOptions: ${JSON.stringify(doc.durationOptions)} -> ${JSON.stringify(nextDurations)}`);
      console.log(`  syllabus entries: ${Array.isArray(doc.syllabus) ? doc.syllabus.length : 0} -> ${nextSyllabus.length}`);

      if (!DRY_RUN) {
        await EapTraining.collection.updateOne(
          { _id: doc._id },
          {
            $set: {
              durationOptions: nextDurations,
              syllabus: nextSyllabus,
            },
          }
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

migrateEapSyllabusOneDay().catch((err) => {
  console.error(err);
  process.exit(1);
});

export default migrateEapSyllabusOneDay;
