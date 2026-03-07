import {
  PeriodCycle,
  PeriodSettings
} from '../../models/index.js';
import { 
  predictFromLastEnhanced,
  averageCycleLength,
  toDateOnly,
  diffDays,
} from './prediction.service.js';


/**
 * Get admin overview of a user's period data
 * READ ONLY
 */
const getUserPeriodOverview = async (userId) => {
  const settings = await PeriodSettings.findOne({ userId });
  const cycles = await PeriodCycle.find({ userId }).sort({ cycleStartDate: -1 });

  if (!settings || cycles.length === 0) {
    return { hasData: false };
  }

  const latestCycle = cycles[0];

  const avgCycleDays = averageCycleLength(
    cycles.map(c => ({ cycleLengthDays: c.cycleLengthDays })),
    settings.defaultCycleLengthDays || 28
  );

  const predictions = predictFromLastEnhanced(
    latestCycle.cycleStartDate,
    avgCycleDays,
    14,
    {
      pmsDaysBefore: settings.pmsDaysBeforePeriod || 5,
      pregnancyMode: settings.pregnancyModeEnabled || false,
    }
  );

  const today = toDateOnly(new Date());
  const cycleDay = diffDays(today, latestCycle.cycleStartDate) + 1;

return {
  hasData: true,
  totalCycles: cycles.length,
  isIrregular: latestCycle.regularity === 'Irregular',
  pregnancyMode: settings?.pregnancyModeEnabled ?? false,
  lastPeriodStart: latestCycle.cycleStartDate ?? null,
  nextPredictedPeriod: predictions?.predictedNextPeriodDate ?? latestCycle.predictedNextPeriodDate ?? null,
  currentPhase: latestCycle.currentPhase ?? null,
  currentCycleDay: cycleDay,
  cycles: cycles.map(cycle => ({
    _id: cycle._id,
    startDate: cycle.cycleStartDate ?? null,
    endDate: cycle.periodEndDate ?? null,
    cycleLengthDays: cycle.cycleLengthDays ?? null,
    periodDurationDays: cycle.periodDurationDays ?? null,
  })),
};
};

/**
 * Get full cycle history for admin
 */
const getUserPeriodCycles = async (userId) => {
  const cycles = await PeriodCycle.find({ userId }).sort({ cycleStartDate: -1 });

  return cycles.map(cycle => ({
    _id: cycle._id,
    startDate: cycle.cycleStartDate ?? null,
    endDate: cycle.periodEndDate ?? null,
    cycleLengthDays: cycle.cycleLengthDays ?? null,
    periodDurationDays: cycle.periodDurationDays ?? null,
    currentPhase: cycle.currentPhase ?? null
  }));
};

export {
  getUserPeriodOverview,
  getUserPeriodCycles
};
