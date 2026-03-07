import httpStatus from 'http-status';
import ApiError from '../../utils/ApiError.js';
import { PeriodCycle, PeriodSettings } from '../../models/index.js';
import {
  averageCycleLength,
  predictFromLastEnhanced,
  toDateOnly,
  addDays,
  diffDays,
} from './prediction.service.js';
import { getCycleAnalytics, getCycleInsights, getCycleStats } from './analytics.service.js';
import { autoCompleteOldCycles, bulkImportHistoricalCycles } from './cycleImport.service.js';
import { getCurrent, getCurrentEnhanced, getCalendar } from './cycleDashboard.service.js';

// Re-export extracted modules so the controller's `import *` still works
export { autoCompleteOldCycles, bulkImportHistoricalCycles };
export { getCurrent, getCurrentEnhanced, getCalendar };

export const getSettings = async (userId) => {
  let settings = await PeriodSettings.findOne({ userId });
  if (!settings) settings = await PeriodSettings.create({ userId });
  return settings;
};

export const updateSettings = async (userId, payload) => {
  const settings = await PeriodSettings.findOneAndUpdate({ userId }, payload, { upsert: true, new: true });
  return settings;
};

/**
 * Recalculate spottingDays and heavyFlowDays from the current dailyLogs array.
 */
const _recalcFlowSummary = (cycle) => {
  const logsWithFlow = cycle.dailyLogs.filter((l) => l.flowIntensity > 0);
  cycle.spottingDays = logsWithFlow.filter((l) => l.flowIntensity === 1).length;
  cycle.heavyFlowDays = logsWithFlow.filter((l) => l.flowIntensity >= 4).length;
};

/**
 * Start a new period (creates a new cycle or updates an existing one for a historical date).
 */
export const startPeriod = async (userId, date, options = {}) => {
  const start = toDateOnly(date || new Date());
  const { cycleEndDate, periodDurationDays, cycleStatus = 'Active', dailyLogs = [] } = options;
  const isHistorical = cycleEndDate || cycleStatus === 'Completed';

  // Idempotent: update existing cycle for same start date
  const existingCycle = await PeriodCycle.findOne({ userId, cycleStartDate: start });
  if (existingCycle) {
    if (isHistorical && cycleEndDate) {
      existingCycle.cycleEndDate = toDateOnly(cycleEndDate);
      existingCycle.periodEndDate = toDateOnly(cycleEndDate);
      existingCycle.periodDurationDays = periodDurationDays || Math.max(1, diffDays(existingCycle.cycleEndDate, start) + 1);
      existingCycle.cycleStatus = cycleStatus;
      if (dailyLogs.length > 0) {
        existingCycle.dailyLogs = dailyLogs.map((log) => ({ ...log, date: toDateOnly(log.date) }));
      }
      await existingCycle.save();
      return existingCycle;
    }
    return existingCycle;
  }

  // For current (non-historical) periods, close any open cycle
  if (!isHistorical) {
    const lastOpen = await PeriodCycle.findOne({
      userId,
      cycleStatus: 'Active',
      $or: [{ cycleEndDate: { $exists: false } }, { cycleEndDate: null }],
    }).sort({ cycleStartDate: -1 });

    if (lastOpen && start >= lastOpen.cycleStartDate) {
      lastOpen.cycleEndDate = start;
      lastOpen.cycleStatus = 'Completed';
      // cycleLengthDays = distance from THIS cycle's start to the NEW period's start
      lastOpen.cycleLengthDays = diffDays(start, lastOpen.cycleStartDate);
      if (!lastOpen.periodEndDate) {
        // User never called stopPeriod — default to 5-day period or use any existing estimate
        const periodDays = lastOpen.periodDurationDays || 5;
        lastOpen.periodEndDate = addDays(lastOpen.cycleStartDate, periodDays - 1);
        lastOpen.periodDurationDays = periodDays;
      }
      await lastOpen.save();
    }
  }

  // Assign cycle number (position-based to support historical inserts)
  const allCycles = await PeriodCycle.find({ userId }).sort({ cycleStartDate: 1 });
  const cyclesBefore = allCycles.filter((c) => toDateOnly(c.cycleStartDate) < start);
  const nextCycleNumber = cyclesBefore.length + 1;

  // Re-number cycles that now come after this inserted one
  const cyclesAfter = allCycles.filter((c) => toDateOnly(c.cycleStartDate) > start);
  for (let i = 0; i < cyclesAfter.length; i++) {
    const newNumber = nextCycleNumber + 1 + i;
    if (cyclesAfter[i].cycleNumber !== newNumber) {
      cyclesAfter[i].cycleNumber = newNumber;
      await cyclesAfter[i].save();
    }
  }

  const settings = await getSettings(userId);
  const completeCycles = await PeriodCycle.find({ userId, cycleEndDate: { $exists: true } })
    .sort({ cycleStartDate: -1 })
    .limit(6);
  const avg = averageCycleLength(completeCycles, settings.defaultCycleLengthDays);
  const preds = predictFromLastEnhanced(start, avg, settings.lutealPhaseDays, {
    pmsDaysBefore: settings.pmsDaysBeforePeriod || 5,
    pregnancyMode: settings.pregnancyModeEnabled || false,
  });

  // Extract pmsWindow so it maps to schema fields instead of an ignored nested object
  const { pmsWindow, ...purePreds } = preds;

  let cycleLengthDays = null;
  if (isHistorical && cycleEndDate) {
    const prevCycle = await PeriodCycle.findOne({
      userId,
      cycleEndDate: { $exists: true },
      cycleStartDate: { $lt: start },
    }).sort({ cycleStartDate: -1 });
    if (prevCycle) {
      cycleLengthDays = diffDays(start, prevCycle.cycleStartDate);
    }
  }

  const processedLogs = (dailyLogs || [])
    .map((log) => ({ ...log, date: toDateOnly(log.date) }))
    .sort((a, b) => toDateOnly(a.date) - toDateOnly(b.date));

  const resolvedEnd = cycleEndDate ? toDateOnly(cycleEndDate) : undefined;
  const resolvedPeriodDuration = periodDurationDays || (resolvedEnd ? Math.max(1, diffDays(resolvedEnd, start) + 1) : undefined);

  const cycle = await PeriodCycle.create({
    userId,
    cycleNumber: nextCycleNumber,
    cycleStartDate: start,
    cycleEndDate: resolvedEnd,
    periodEndDate: resolvedEnd,
    periodDurationDays: resolvedPeriodDuration,
    cycleStatus,
    currentPhase: 'Menstruation',
    cycleLengthDays,
    dailyLogs: processedLogs,
    pmsStartDate: pmsWindow?.pmsStartDate,
    pmsEndDate: pmsWindow?.pmsEndDate,
    ...purePreds,
  });

  return cycle;
};

/**
 * Mark the bleeding phase as over (cycle continues until next period starts).
 */
export const stopPeriod = async (userId, date) => {
  const end = toDateOnly(date || new Date());

  const latestCycle = await PeriodCycle.findOne({ userId }).sort({ cycleStartDate: -1 });

  if (!latestCycle) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No cycle found. Please start a period first.');
  }

  if (latestCycle.cycleEndDate && latestCycle.periodEndDate) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot stop period: cycle has already ended. Please start a new period.');
  }

  if (latestCycle.cycleEndDate && !latestCycle.periodEndDate) {
    // Cycle was auto-completed but period end was never recorded — use stored duration or 5-day default
    const periodDays = latestCycle.periodDurationDays || 5;
    latestCycle.periodEndDate = addDays(latestCycle.cycleStartDate, periodDays - 1);
    latestCycle.periodDurationDays = periodDays;
    await latestCycle.save();
    return latestCycle;
  }

  if (latestCycle.periodEndDate && toDateOnly(latestCycle.periodEndDate).getTime() === end.getTime()) {
    return latestCycle;
  }

  if (latestCycle.cycleStatus !== 'Active') {
    latestCycle.cycleStatus = 'Active';
  }

  if (end < latestCycle.cycleStartDate) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Period end date cannot be before cycle start date.');
  }

  latestCycle.periodEndDate = end;
  latestCycle.periodDurationDays = Math.max(1, diffDays(end, latestCycle.cycleStartDate) + 1);

  if (latestCycle.currentPhase === 'Menstruation') {
    latestCycle.currentPhase = 'Follicular';
  }

  await latestCycle.save();
  return latestCycle;
};

/**
 * Upsert a daily log for the given date. Auto-creates a cycle if none exists.
 */
export const upsertDailyLog = async (userId, date, data) => {
  const day = toDateOnly(date);

  await autoCompleteOldCycles(userId);

  let cycle = await PeriodCycle.findOne({
    userId,
    cycleStartDate: { $lte: day },
    $or: [
      { cycleStatus: 'Active' },
      { cycleEndDate: { $exists: false } },
      { cycleEndDate: { $gte: day } },
    ],
  }).sort({ cycleStartDate: -1 });

  if (!cycle) {
    cycle = await PeriodCycle.findOne({ userId, cycleStartDate: { $lte: day } }).sort({ cycleStartDate: -1 });
  }

  if (!cycle) {
    cycle = await startPeriod(userId, day, { cycleStatus: 'Completed', cycleEndDate: day, periodDurationDays: 1 });
  }

  const idx = cycle.dailyLogs.findIndex((l) => toDateOnly(l.date).getTime() === day.getTime());
  if (idx >= 0) {
    cycle.dailyLogs[idx] = { ...cycle.dailyLogs[idx].toObject(), ...data, date: day };
  } else {
    cycle.dailyLogs.push({ date: day, ...data });
  }
  cycle.dailyLogs.sort((a, b) => toDateOnly(a.date) - toDateOnly(b.date));

  // Auto-update flow summary whenever a log is saved
  _recalcFlowSummary(cycle);

  await cycle.save();
  return cycle.dailyLogs.find((l) => toDateOnly(l.date).getTime() === day.getTime());
};

export const getHistory = async (userId, limit = 6) => {
  const cycles = await PeriodCycle.find({ userId, cycleEndDate: { $exists: true } })
    .sort({ cycleStartDate: -1 })
    .limit(limit);
  return cycles.map((c, idx, arr) => {
    const prev = arr[idx + 1];
    const delay = prev ? (c.cycleLengthDays || 0) - (prev.cycleLengthDays || 0) : 0;
    return {
      id: c.id,
      month: c.cycleStartDate,
      periodDurationDays: c.periodDurationDays,
      cycleLengthDays: c.cycleLengthDays,
      delayDays: delay,
      fertileWindow: { start: c.predictedFertileWindowStart, end: c.predictedFertileWindowEnd },
      ovulationDate: c.predictedOvulationDate,
    };
  });
};

export const getDay = async (userId, date) => {
  const day = toDateOnly(date);
  const cycle = await PeriodCycle.findOne({ userId, cycleStartDate: { $lte: day } }).sort({ cycleStartDate: -1 });
  if (!cycle) throw new ApiError(httpStatus.NOT_FOUND, 'No cycle found');
  const log = (cycle.dailyLogs || []).find((l) => toDateOnly(l.date).getTime() === day.getTime());
  return { cycleId: cycle.id, log, cycle };
};

export const deleteCycle = async (userId, cycleId) => {
  const cycle = await PeriodCycle.findOne({ _id: cycleId, userId });
  if (!cycle) throw new ApiError(httpStatus.NOT_FOUND, 'Cycle not found');

  await PeriodCycle.findByIdAndDelete(cycleId);

  const remainingCycles = await PeriodCycle.find({ userId }).sort({ cycleStartDate: 1 });
  for (let i = 0; i < remainingCycles.length; i++) {
    if (remainingCycles[i].cycleNumber !== i + 1) {
      remainingCycles[i].cycleNumber = i + 1;
      await remainingCycles[i].save();
    }
  }

  return { success: true };
};

export const updateCycle = async (userId, cycleId, updateData) => {
  const cycle = await PeriodCycle.findOne({ _id: cycleId, userId });
  if (!cycle) throw new ApiError(httpStatus.NOT_FOUND, 'Cycle not found');

  if (updateData.cycleStartDate) updateData.cycleStartDate = toDateOnly(updateData.cycleStartDate);
  if (updateData.cycleEndDate) {
    updateData.cycleEndDate = toDateOnly(updateData.cycleEndDate);
    if (updateData.cycleEndDate < cycle.cycleStartDate) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'cycleEndDate cannot be before cycleStartDate');
    }
  }

  Object.assign(cycle, updateData);

  // Recalculate cycleLengthDays (start→end) if either date changed
  if ((updateData.cycleStartDate || updateData.cycleEndDate) && cycle.cycleEndDate) {
    cycle.cycleLengthDays = diffDays(cycle.cycleEndDate, cycle.cycleStartDate);
  }
  // Recalculate periodDurationDays only when periodEndDate is also set
  if ((updateData.cycleStartDate || updateData.periodEndDate) && cycle.periodEndDate) {
    cycle.periodDurationDays = Math.max(1, diffDays(cycle.periodEndDate, cycle.cycleStartDate) + 1);
  }

  await cycle.save();
  return cycle;
};

export const deleteDailyLog = async (userId, date) => {
  const day = toDateOnly(date);
  const cycle = await PeriodCycle.findOne({ userId, cycleStartDate: { $lte: day } }).sort({ cycleStartDate: -1 });
  if (!cycle) throw new ApiError(httpStatus.NOT_FOUND, 'No cycle found for date');

  const logIndex = cycle.dailyLogs.findIndex((l) => toDateOnly(l.date).getTime() === day.getTime());
  if (logIndex === -1) throw new ApiError(httpStatus.NOT_FOUND, 'Log not found for date');

  cycle.dailyLogs.splice(logIndex, 1);
  _recalcFlowSummary(cycle);
  await cycle.save();

  return { success: true, message: 'Log deleted successfully' };
};

export const getAnalytics = async (userId) => getCycleAnalytics(userId);
export const getInsights = async (userId) => getCycleInsights(userId);
export const getStats = async (userId) => getCycleStats(userId);
