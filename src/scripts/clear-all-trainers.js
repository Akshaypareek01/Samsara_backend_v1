/**
 * Delete all trainer records and related booking/EAP training data (for local/testing reset).
 *
 * Usage:
 *   node src/scripts/clear-all-trainers.js          # dry-run: counts only
 *   node src/scripts/clear-all-trainers.js --apply  # delete all trainer data
 */

import mongoose from 'mongoose';
import config from '../config/config.js';
import { Trainer, Booking, EapTraining } from '../models/index.js';

const APPLY = process.argv.includes('--apply');

/**
 * Log collection counts and optionally delete all trainer-related records.
 */
const main = async () => {
    await mongoose.connect(config.mongoose.url, config.mongoose.options);

    const trainerCount = await Trainer.countDocuments({});
    const bookingCount = await Booking.countDocuments({ trainer: { $exists: true, $ne: null } });
    const eapTrainingCount = await EapTraining.countDocuments({});

    console.log('Trainer-related records in database:');
    console.log(`  Trainers:       ${trainerCount}`);
    console.log(`  Bookings:       ${bookingCount}`);
    console.log(`  EAP trainings:  ${eapTrainingCount}`);

    if (trainerCount === 0 && bookingCount === 0 && eapTrainingCount === 0) {
        console.log('Nothing to delete.');
        await mongoose.disconnect();
        return;
    }

    if (!APPLY) {
        console.log('Dry-run only. Re-run with --apply to delete all trainer data.');
        await mongoose.disconnect();
        return;
    }

    const bookingResult = await Booking.deleteMany({ trainer: { $exists: true, $ne: null } });
    const eapResult = await EapTraining.deleteMany({});
    const trainerResult = await Trainer.deleteMany({});

    console.log(`Deleted ${bookingResult.deletedCount} booking(s).`);
    console.log(`Deleted ${eapResult.deletedCount} EAP training(s).`);
    console.log(`Deleted ${trainerResult.deletedCount} trainer(s).`);
    await mongoose.disconnect();
};

main().catch(async (err) => {
    console.error(err);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
});
