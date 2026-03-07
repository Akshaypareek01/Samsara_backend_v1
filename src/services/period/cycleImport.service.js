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

const _getSettings = async (userId) => {
  let settings = await PeriodSettings.findOne({ userId });
  if (!settings) settings = await PeriodSettings.create({ userId });
  return settings;
};

/**
 * Auto-complete cycles that have exceeded the maximum cycle length.
 * Prevents cycles from running indefinitely if user forgets to start next period.
 */
export const autoCompleteOldCycles = async (userId) => {
  const settings = await _getSettings(userId);
  const maxCycleDays = settings.maxCycleDays || 60;
  const today = toDateOnly(new Date());

  const oldActiveCycles = await PeriodCycle.find({
    userId,
    cycleStatus: 'Active',
    $or: [{ cycleEndDate: { $exists: false } }, { cycleEndDate: null }],
  });

  const completedCycles = [];

  for (const cycle of oldActiveCycles) {
    const daysSinceStart = diffDays(today, cycle.cycleStartDate);

    if (daysSinceStart >= maxCycleDays && daysSinceStart > 0) {
      cycle.cycleEndDate = today;
      cycle.cycleStatus = 'Completed';

      if (!cycle.periodEndDate) {
        const periodEnd = cycle.periodDurationDays
          ? addDays(cycle.cycleStartDate, cycle.periodDurationDays - 1)
          : addDays(cycle.cycleStartDate, 4);
        cycle.periodEndDate = periodEnd;
        cycle.periodDurationDays = cycle.periodDurationDays || 5;
      }

      // cycleLengthDays = distance from this cycle's start to when it auto-completed (today)
      cycle.cycleLengthDays = diffDays(today, cycle.cycleStartDate);

      const completeCycles = await PeriodCycle.find({
        userId,
        cycleEndDate: { $exists: true },
        _id: { $ne: cycle._id },
      })
        .sort({ cycleStartDate: -1 })
        .limit(6);

      const avg = averageCycleLength(completeCycles, settings.defaultCycleLengthDays);
      const preds = predictFromLastEnhanced(cycle.cycleStartDate, avg, settings.lutealPhaseDays, {
        pmsDaysBefore: settings.pmsDaysBeforePeriod || 5,
        pregnancyMode: settings.pregnancyModeEnabled || false,
      });
      const { pmsWindow, ...purePreds } = preds;
      Object.assign(cycle, purePreds);
      if (pmsWindow) {
        cycle.pmsStartDate = pmsWindow.pmsStartDate;
        cycle.pmsEndDate = pmsWindow.pmsEndDate;
      }

      await cycle.save();
      completedCycles.push(cycle);
    }
  }

  return completedCycles;
};

/**
 * Bulk import historical cycles (up to 50 per request).
 */
export const bulkImportHistoricalCycles = async (userId, cyclesData) => {
  if (!Array.isArray(cyclesData) || cyclesData.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cycles data must be a non-empty array');
  }

  if (cyclesData.length > 50) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Maximum 50 cycles per request');
  }

  const results = [];
  const settings = await _getSettings(userId);

  const sortedCycles = [...cyclesData].sort(
    (a, b) => new Date(a.cycleStartDate) - new Date(b.cycleStartDate)
  );

  for (const cycleData of sortedCycles) {
    const { cycleStartDate, cycleEndDate, periodDurationDays, dailyLogs = [], cycleNotes } = cycleData;

    if (!cycleStartDate) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'cycleStartDate is required for each cycle');
    }

    const start = toDateOnly(cycleStartDate);
    const end = cycleEndDate ? toDateOnly(cycleEndDate) : null;
    const isCompleted = !!end;

    if (end && end < start) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'cycleEndDate cannot be before cycleStartDate');
    }

    let cycle = await PeriodCycle.findOne({ userId, cycleStartDate: start });

    if (cycle) {
      if (end) {
        cycle.cycleEndDate = end;
        cycle.periodEndDate = end;
        cycle.periodDurationDays = periodDurationDays || Math.max(1, diffDays(end, start) + 1);
        cycle.cycleStatus = 'Completed';
      }
      if (cycleNotes) cycle.cycleNotes = cycleNotes;
      if (dailyLogs.length > 0) {
        for (const logData of dailyLogs) {
          const logDate = toDateOnly(logData.date);
          const existingIdx = cycle.dailyLogs.findIndex(
            (l) => toDateOnly(l.date).getTime() === logDate.getTime()
          );
          if (existingIdx >= 0) {
            cycle.dailyLogs[existingIdx] = { ...cycle.dailyLogs[existingIdx].toObject(), ...logData, date: logDate };
          } else {
            cycle.dailyLogs.push({ date: logDate, ...logData });
          }
        }
        cycle.dailyLogs.sort((a, b) => toDateOnly(a.date) - toDateOnly(b.date));
      }
      await cycle.save();
      results.push(cycle);
      continue;
    }

    const allCycles = await PeriodCycle.find({ userId }).sort({ cycleStartDate: 1 });
    const cyclesBefore = allCycles.filter((c) => toDateOnly(c.cycleStartDate) < start);
    const nextCycleNumber = cyclesBefore.length + 1;

    // Update the PREVIOUS cycle's cycleLengthDays now that we know when it ended
    // (a cycle's length = distance from its start to the next period's start)
    const prevCycleToUpdate = await PeriodCycle.findOne({
      userId,
      cycleStartDate: { $lt: start },
    }).sort({ cycleStartDate: -1 });
    if (prevCycleToUpdate && !prevCycleToUpdate.cycleLengthDays) {
      prevCycleToUpdate.cycleLengthDays = diffDays(start, prevCycleToUpdate.cycleStartDate);
      await prevCycleToUpdate.save();
    }

    const completeCycles = await PeriodCycle.find({ userId, cycleEndDate: { $exists: true } })
      .sort({ cycleStartDate: -1 })
      .limit(6);
    const avg = averageCycleLength(completeCycles, settings.defaultCycleLengthDays);
    const preds = predictFromLastEnhanced(start, avg, settings.lutealPhaseDays, {
      pmsDaysBefore: settings.pmsDaysBeforePeriod || 5,
      pregnancyMode: settings.pregnancyModeEnabled || false,
    });
    const { pmsWindow, ...purePreds } = preds;

    const processedLogs = dailyLogs
      .map((log) => ({ ...log, date: toDateOnly(log.date) }))
      .sort((a, b) => toDateOnly(a.date) - toDateOnly(b.date));

    cycle = await PeriodCycle.create({
      userId,
      cycleNumber: nextCycleNumber,
      cycleStartDate: start,
      cycleEndDate: end,
      periodEndDate: end,
      periodDurationDays: periodDurationDays || (end ? Math.max(1, diffDays(end, start) + 1) : undefined),
      cycleStatus: isCompleted ? 'Completed' : 'Active',
      currentPhase: 'Menstruation',
      cycleLengthDays: null,
      dailyLogs: processedLogs,
      cycleNotes,
      pmsStartDate: pmsWindow?.pmsStartDate,
      pmsEndDate: pmsWindow?.pmsEndDate,
      ...purePreds,
    });

    results.push(cycle);
  }

  // Re-number all cycles sequentially
  const allCycles = await PeriodCycle.find({ userId }).sort({ cycleStartDate: 1 });
  for (let i = 0; i < allCycles.length; i++) {
    if (allCycles[i].cycleNumber !== i + 1) {
      allCycles[i].cycleNumber = i + 1;
      await allCycles[i].save();
    }
  }

  return results;
};
