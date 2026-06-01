/**
 * Delete all booking records (for local/testing reset).
 *
 * Usage:
 *   node src/scripts/clear-all-bookings.js          # dry-run: count only
 *   node src/scripts/clear-all-bookings.js --apply  # delete all bookings
 */

import mongoose from 'mongoose';
import config from '../config/config.js';
import { Booking } from '../models/index.js';

const APPLY = process.argv.includes('--apply');

const main = async () => {
    await mongoose.connect(config.mongoose.url, config.mongoose.options);

    const total = await Booking.countDocuments({});
    console.log(`Bookings in database: ${total}`);

    if (total === 0) {
        console.log('Nothing to delete.');
        await mongoose.disconnect();
        return;
    }

    if (!APPLY) {
        console.log('Dry-run only. Re-run with --apply to delete all bookings.');
        await mongoose.disconnect();
        return;
    }

    const result = await Booking.deleteMany({});
    console.log(`Deleted ${result.deletedCount} booking(s).`);
    await mongoose.disconnect();
};

main().catch(async (err) => {
    console.error(err);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
});
