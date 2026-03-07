import { PeriodCycle, PeriodSettings } from '../../models/index.js';
import {
  averageCycleLength,
  predictFromLast,
  predictFromLastEnhanced,
  determinePhase,
  calculateIrregularity,
  toDateOnly,
  addDays,
  diffDays,
} from './prediction.service.js';
import { autoCompleteOldCycles } from './cycleImport.service.js';

const _getSettings = async (userId) => {
  let settings = await PeriodSettings.findOne({ userId });
  if (!settings) settings = await PeriodSettings.create({ userId });
  return settings;
};

/**
 * Get current cycle state + live predictions (basic).
 */
export const getCurrent = async (userId) => {
  const settings = await _getSettings(userId);

  await autoCompleteOldCycles(userId);

  const latest = await PeriodCycle.findOne({ userId }).sort({ cycleStartDate: -1 });
  if (!latest) return { settings };

  const completeCycles = await PeriodCycle.find({ userId, cycleEndDate: { $exists: true } })
    .sort({ cycleStartDate: -1 })
    .limit(6);
  const avg = averageCycleLength(completeCycles, settings.defaultCycleLengthDays);
  const clampedAvg = Math.max(21, Math.min(45, avg));

  const { predictedNextPeriodDate, predictedOvulationDate, predictedFertileWindowStart, predictedFertileWindowEnd } =
    predictFromLast(latest.cycleStartDate, clampedAvg, settings.lutealPhaseDays);

  const today = toDateOnly(new Date());
  const periodEnd = latest.periodEndDate || (latest.periodDurationDays
    ? addDays(latest.cycleStartDate, latest.periodDurationDays - 1)
    : addDays(latest.cycleStartDate, 4));
  const periodDuration = latest.periodDurationDays || (latest.periodEndDate
    ? diffDays(latest.periodEndDate, latest.cycleStartDate) + 1
    : 5);
  const currentPhase = determinePhase(today, latest.cycleStartDate, periodDuration, predictedOvulationDate);

  return {
    cycle: latest,
    predictions: {
      nextPeriod: predictedNextPeriodDate,
      ovulation: predictedOvulationDate,
      fertileWindow: { start: predictedFertileWindowStart, end: predictedFertileWindowEnd },
      averageCycleDays: clampedAvg,
      currentPhase,
      currentCycleDay: diffDays(today, latest.cycleStartDate) + 1,
    },
    settings,
  };
};

/**
 * Enhanced current status — includes PMS window, irregularity, pregnancy mode.
 */
export const getCurrentEnhanced = async (userId) => {
  const settings = await _getSettings(userId);

  await autoCompleteOldCycles(userId);

  const latest = await PeriodCycle.findOne({ userId }).sort({ cycleStartDate: -1 });

  if (!latest) {
    return {
      settings,
      predictions: null,
      pmsWindow: null,
      pregnancyMode: settings.pregnancyModeEnabled || false,
    };
  }

  if (settings.pregnancyModeEnabled) {
    return {
      cycle: latest,
      settings,
      pregnancyMode: true,
      pregnancyStartDate: settings.pregnancyStartDate,
      pregnancyDueDate: settings.pregnancyDueDate,
      pregnancyWeek: settings.pregnancyWeek,
      predictions: null,
    };
  }

  const completeCycles = await PeriodCycle.find({ userId, cycleEndDate: { $exists: true } })
    .sort({ cycleStartDate: -1 })
    .limit(6);
  const avg = averageCycleLength(completeCycles, settings.defaultCycleLengthDays);
  const clampedAvg = Math.max(21, Math.min(45, avg));

  const preds = predictFromLastEnhanced(latest.cycleStartDate, clampedAvg, settings.lutealPhaseDays, {
    pmsDaysBefore: settings.pmsDaysBeforePeriod || 5,
    pregnancyMode: false,
  });

  const today = toDateOnly(new Date());
  const periodDuration = latest.periodDurationDays || (latest.periodEndDate
    ? diffDays(latest.periodEndDate, latest.cycleStartDate) + 1
    : 5);
  const currentPhase = determinePhase(today, latest.cycleStartDate, periodDuration, preds.predictedOvulationDate);
  const irregularity = calculateIrregularity(completeCycles);

  return {
    cycle: latest,
    predictions: {
      nextPeriod: preds.predictedNextPeriodDate,
      ovulation: preds.predictedOvulationDate,
      fertileWindow: {
        start: preds.predictedFertileWindowStart,
        end: preds.predictedFertileWindowEnd,
      },
      averageCycleDays: clampedAvg,
      currentPhase,
      currentCycleDay: diffDays(today, latest.cycleStartDate) + 1,
      daysUntilNextPeriod: preds.predictedNextPeriodDate
        ? diffDays(preds.predictedNextPeriodDate, today)
        : null,
    },
    pmsWindow: preds.pmsWindow || null,
    regularity: irregularity.regularity,
    isIrregular: irregularity.isIrregular,
    settings,
    pregnancyMode: false,
  };
};

/**
 * Calendar data for a given month (YYYY-MM).
 * Returns period ranges, fertile window, ovulation, PMS window, and dates with logs.
 */
export const getCalendar = async (userId, month) => {
  const ref = month ? new Date(`${month}-01T00:00:00Z`) : new Date();
  const year = ref.getUTCFullYear();
  const m = ref.getUTCMonth();

  const cycles = await PeriodCycle.find({ userId }).sort({ cycleStartDate: 1 });
  const settings = await _getSettings(userId);

  const completeCycles = cycles.filter((c) => c.cycleEndDate);
  const avg = averageCycleLength(completeCycles, settings.defaultCycleLengthDays);
  const last = cycles[cycles.length - 1];
  const preds = last ? predictFromLastEnhanced(last.cycleStartDate, avg, settings.lutealPhaseDays, {
    pmsDaysBefore: settings.pmsDaysBeforePeriod || 5,
    pregnancyMode: settings.pregnancyModeEnabled || false,
  }) : {};

  // Period ranges (actual bleeding days only — start → periodEndDate or cycleEndDate)
  const periodRanges = cycles
    .filter((c) => c.cycleStartDate && (c.periodEndDate || c.cycleEndDate))
    .map((c) => ({ start: c.cycleStartDate, end: c.periodEndDate || c.cycleEndDate }));

  // Include predicted range for active cycle if period hasn't ended
  if (last && !last.periodEndDate && !last.cycleEndDate) {
    const start = last.cycleStartDate;
    const end = addDays(start, (last.periodDurationDays || 5) - 1);
    periodRanges.push({ start, end });
  }

  // Dates in this month that have at least one daily log
  const monthStart = new Date(Date.UTC(year, m, 1));
  const monthEnd = new Date(Date.UTC(year, m + 1, 0));
  const logDates = cycles
    .flatMap((c) => c.dailyLogs || [])
    .filter((l) => {
      const d = toDateOnly(l.date);
      return d >= monthStart && d <= monthEnd;
    })
    .map((l) => toDateOnly(l.date).toISOString().split('T')[0]);

  // Deduplicate
  const uniqueLogDates = [...new Set(logDates)];

  return {
    year,
    month: m + 1,
    firstDayOfWeek: settings.firstDayOfWeek || 'Sunday',
    periodRanges,
    fertileWindow:
      preds.predictedFertileWindowStart && preds.predictedFertileWindowEnd
        ? { start: preds.predictedFertileWindowStart, end: preds.predictedFertileWindowEnd }
        : undefined,
    ovulationDate: preds.predictedOvulationDate,
    nextPeriodDate: preds.predictedNextPeriodDate,
    pmsWindow: preds.pmsWindow || null,
    logDates: uniqueLogDates,
  };
};
