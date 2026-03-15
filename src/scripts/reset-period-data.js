import mongoose from 'mongoose';
import config from '../config/config.js';
import { PeriodCycle } from '../models/period-cycle.model.js';
import { PeriodSettings } from '../models/period-settings.model.js';
import { BirthControl } from '../models/birth-control.model.js';

/**
 * Resets ALL period tracker data for ALL users.
 * Deletes: PeriodCycle, PeriodSettings, BirthControl collections.
 *
 * Usage:  node --experimental-vm-modules src/scripts/reset-period-data.js
 * Or:     node -r dotenv/config src/scripts/reset-period-data.js
 */
const resetPeriodData = async () => {
  try {
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log('Connected to MongoDB');

    const cycleResult = await PeriodCycle.deleteMany({});
    console.log(`Deleted ${cycleResult.deletedCount} period cycles`);

    const settingsResult = await PeriodSettings.deleteMany({});
    console.log(`Deleted ${settingsResult.deletedCount} period settings`);

    const bcResult = await BirthControl.deleteMany({});
    console.log(`Deleted ${bcResult.deletedCount} birth control records`);

    console.log('\nAll period data wiped. Every user will see onboarding again.');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error resetting period data:', error);
    process.exit(1);
  }
};

resetPeriodData();
