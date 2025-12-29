import httpStatus from 'http-status';
import ApiError from '../../utils/ApiError.js';
import {
  PeriodCycle,
  PeriodSettings
} from '../../models/index.js';
import { 
  predictFromLastEnhanced,
  averageCycleLength
} from './prediction.service.js';


/**
 * Get admin overview of a user's period data
 * READ ONLY
 */
const getUserPeriodOverview = async (userId) => {
  const settings = await PeriodSettings.findOne({ userId });
  const cycles = await PeriodCycle.find({ userId }).sort({ startDate: -1 });

  if (!settings || cycles.length === 0) {
    return { hasData: false };
  }

  const latestCycle = cycles[0];

  const avgCycleLength =
  settings.averageCycleLength ||
  averageCycleLength(cycles);

const prediction = predictFromLastEnhanced(
  latestCycle.startDate,
  avgCycleLength
);

const nextPredictedPeriod = prediction?.predictedNextPeriodDate ?? null;


  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cycleDay =
    Math.floor(
      (today.getTime() - new Date(latestCycle.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  const avgCycleDays = averageCycleLength(
    cycles.map(c => ({ cycleLengthDays: c.cycleLength })),
    settings.averageCycleLength || 28
  );

  const predictions = predictFromLastEnhanced(
    latestCycle.startDate,
    avgCycleDays,
    14,
    { pregnancyMode: settings.pregnancyMode }
  );

return {
  hasData: true,
  totalCycles: cycles.length,

  // regularity comes directly from cycle
  isIrregular: latestCycle.regularity === 'Irregular',

  pregnancyMode: settings?.pregnancyMode ?? false,

  lastPeriodStart: latestCycle.cycleStartDate ?? null,

  nextPredictedPeriod: latestCycle.predictedNextPeriodDate ?? null,

  currentPhase: latestCycle.currentPhase ?? null,

  cycles: cycles.map(cycle => ({
    _id: cycle._id,
    startDate: cycle.cycleStartDate ?? null,
    endDate: cycle.periodEndDate ?? null,
    cycleLengthDays: cycle.cycleLengthDays ?? null,
    periodDurationDays: cycle.periodDurationDays ?? null
  }))
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
