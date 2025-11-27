import httpStatus from 'http-status';
import ApiError from '../../utils/ApiError.js';
import { PeriodCycle, PeriodSettings } from '../../models/index.js';
import { averageCycleLength, predictFromLast, determinePhase, toDateOnly, addDays, diffDays, predictFromLastEnhanced, calculateIrregularity, predictPMSWindow } from './prediction.service.js';
import { getCycleAnalytics, getCycleInsights, getCycleStats } from './analytics.service.js';

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
 * Auto-complete cycles that have exceeded the maximum cycle length
 * This prevents cycles from running indefinitely if user forgets to start next period
 */
export const autoCompleteOldCycles = async (userId) => {
  const settings = await getSettings(userId);
  const maxCycleDays = settings.maxCycleDays || 60; // Default 60 days
  const today = toDateOnly(new Date());
  
  // Find active cycles that exceed maxCycleDays
  const oldActiveCycles = await PeriodCycle.find({
    userId,
    cycleStatus: 'Active',
    $or: [
      { cycleEndDate: { $exists: false } },
      { cycleEndDate: null }
    ]
  });
  
  const completedCycles = [];
  
  for (const cycle of oldActiveCycles) {
    const daysSinceStart = diffDays(today, cycle.cycleStartDate);
    
    // Only auto-complete if cycle is actually old enough (safety check)
    if (daysSinceStart >= maxCycleDays && daysSinceStart > 0) {
      // Auto-complete this cycle
      cycle.cycleEndDate = today;
      cycle.cycleStatus = 'Completed';
      
      // If periodEndDate wasn't set, set it to today (or use a reasonable default)
      if (!cycle.periodEndDate) {
        // Use periodDurationDays if available, otherwise default to 5 days from start
        const periodEnd = cycle.periodDurationDays 
          ? addDays(cycle.cycleStartDate, cycle.periodDurationDays - 1)
          : addDays(cycle.cycleStartDate, 4); // Default 5 days
        cycle.periodEndDate = periodEnd;
        cycle.periodDurationDays = cycle.periodDurationDays || 5;
      }
      
      // Calculate cycle length (days from previous cycle start to this cycle start)
      const prevCycle = await PeriodCycle.findOne({ 
        userId, 
        cycleEndDate: { $exists: true },
        cycleStartDate: { $lt: cycle.cycleStartDate }
      }).sort({ cycleStartDate: -1 });
      
      if (prevCycle) {
        cycle.cycleLengthDays = diffDays(cycle.cycleStartDate, prevCycle.cycleStartDate);
      }
      
      // Update predictions for reference (exclude current cycle from average calculation)
      const completeCycles = await PeriodCycle.find({ 
        userId, 
        cycleEndDate: { $exists: true },
        _id: { $ne: cycle._id } // Exclude current cycle
      })
        .sort({ cycleStartDate: -1 })
        .limit(6);
      const avg = averageCycleLength(completeCycles, settings.defaultCycleLengthDays);
      const preds = predictFromLastEnhanced(
        cycle.cycleStartDate, 
        avg, 
        settings.lutealPhaseDays,
        {
          pmsDaysBefore: settings.pmsDaysBeforePeriod || 5,
          pregnancyMode: settings.pregnancyModeEnabled || false,
        }
      );
      Object.assign(cycle, preds);
      
      await cycle.save();
      completedCycles.push(cycle);
    }
  }
  
  return completedCycles;
};

export const startPeriod = async (userId, date, options = {}) => {
  const start = toDateOnly(date || new Date());
  const { cycleEndDate, periodDurationDays, cycleStatus = 'Active', dailyLogs = [] } = options;
  const isHistorical = cycleEndDate || cycleStatus === 'Completed';
  
  // Check if cycle already exists for this date
  const existingCycle = await PeriodCycle.findOne({ 
    userId, 
    cycleStartDate: start 
  });
  if (existingCycle) {
    if (isHistorical && cycleEndDate) {
      existingCycle.cycleEndDate = toDateOnly(cycleEndDate);
      existingCycle.periodDurationDays = periodDurationDays || Math.max(1, diffDays(existingCycle.cycleEndDate, start) + 1);
      existingCycle.cycleStatus = cycleStatus;
      if (dailyLogs.length > 0) {
        existingCycle.dailyLogs = dailyLogs.map(log => ({ ...log, date: toDateOnly(log.date) }));
      }
      await existingCycle.save();
      return existingCycle;
    }
    return existingCycle;
  }
  
  // For current dates, close previous open cycle if exists (cycle ends when next period starts)
  if (!isHistorical) {
    const lastOpen = await PeriodCycle.findOne({ 
      userId, 
      cycleStatus: 'Active',
      $or: [
        { cycleEndDate: { $exists: false } },
        { cycleEndDate: null }
      ]
    }).sort({ cycleStartDate: -1 });
    
    if (lastOpen && start >= lastOpen.cycleStartDate) {
      // Close the previous cycle - cycle ends when next period starts
      lastOpen.cycleEndDate = start;
      lastOpen.cycleStatus = 'Completed';
      
      // If periodEndDate wasn't set (user never called stopPeriod), set it to cycleEndDate
      if (!lastOpen.periodEndDate) {
        lastOpen.periodEndDate = start;
        lastOpen.periodDurationDays = Math.max(1, diffDays(start, lastOpen.cycleStartDate) + 1);
      }
      
      // Calculate cycle length (days from previous cycle start to this cycle start)
      const prevCycle = await PeriodCycle.findOne({ 
        userId, 
        cycleEndDate: { $exists: true },
        cycleStartDate: { $lt: lastOpen.cycleStartDate }
      })
        .sort({ cycleStartDate: -1 });
      if (prevCycle) {
        lastOpen.cycleLengthDays = diffDays(lastOpen.cycleStartDate, prevCycle.cycleStartDate);
      }
      
      await lastOpen.save();
    }
  }
  
  // Calculate cycle number
  const allCycles = await PeriodCycle.find({ userId }).sort({ cycleStartDate: 1 });
  const cyclesBefore = allCycles.filter(c => toDateOnly(c.cycleStartDate) < start);
  const nextCycleNumber = cyclesBefore.length + 1;
  
  // Re-number cycles that come after this one
  const cyclesAfter = allCycles.filter(c => toDateOnly(c.cycleStartDate) > start);
  if (cyclesAfter.length > 0) {
    for (let i = 0; i < cyclesAfter.length; i++) {
      const newNumber = nextCycleNumber + 1 + i;
      if (cyclesAfter[i].cycleNumber !== newNumber) {
        cyclesAfter[i].cycleNumber = newNumber;
        await cyclesAfter[i].save();
      }
    }
  }
  
  // Get settings and calculate predictions
  const settings = await getSettings(userId);
  const completeCycles = await PeriodCycle.find({ userId, cycleEndDate: { $exists: true } })
    .sort({ cycleStartDate: -1 })
    .limit(6);
  const avg = averageCycleLength(completeCycles, settings.defaultCycleLengthDays);
  const preds = predictFromLastEnhanced(
    start, 
    avg, 
    settings.lutealPhaseDays,
    {
      pmsDaysBefore: settings.pmsDaysBeforePeriod || 5,
      pregnancyMode: settings.pregnancyModeEnabled || false,
    }
  );
  
  // Calculate cycle length if completed
  let cycleLengthDays = null;
  if (isHistorical && cycleEndDate) {
    const prevCycle = await PeriodCycle.findOne({ 
      userId, 
      cycleEndDate: { $exists: true },
      cycleStartDate: { $lt: start }
    }).sort({ cycleStartDate: -1 });
    if (prevCycle) {
      cycleLengthDays = diffDays(start, prevCycle.cycleStartDate);
    }
  }
  
  // Process daily logs
  const processedLogs = (dailyLogs || []).map(log => ({
    ...log,
    date: toDateOnly(log.date)
  })).sort((a, b) => toDateOnly(a.date) - toDateOnly(b.date));
  
  const cycle = await PeriodCycle.create({ 
    userId, 
    cycleNumber: nextCycleNumber,
    cycleStartDate: start, 
    cycleEndDate: cycleEndDate ? toDateOnly(cycleEndDate) : undefined,
    periodDurationDays: periodDurationDays || (cycleEndDate ? Math.max(1, diffDays(toDateOnly(cycleEndDate), start) + 1) : undefined),
    cycleStatus,
    currentPhase: 'Menstruation',
    cycleLengthDays,
    dailyLogs: processedLogs,
    ...preds
  });
  return cycle;
};

export const stopPeriod = async (userId, date) => {
  const end = toDateOnly(date || new Date());
  
  // Get the most recent cycle (regardless of status)
  const latestCycle = await PeriodCycle.findOne({ userId })
    .sort({ cycleStartDate: -1 });
  
  if (!latestCycle) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No cycle found. Please start a period first.');
  }
  
  // Check if cycle has already ended (cycleEndDate is set)
  // If cycle has ended, we cannot stop the period (cycle is already completed)
  // However, if periodEndDate is not set, we can still set it (edge case: cycle ended but period end wasn't recorded)
  if (latestCycle.cycleEndDate && latestCycle.periodEndDate) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot stop period: cycle has already ended. Please start a new period.');
  }
  
  // If cycle ended but periodEndDate wasn't set, allow setting it
  if (latestCycle.cycleEndDate && !latestCycle.periodEndDate) {
    // Set periodEndDate to cycleEndDate (period ended when cycle ended)
    latestCycle.periodEndDate = latestCycle.cycleEndDate;
    latestCycle.periodDurationDays = Math.max(1, diffDays(latestCycle.cycleEndDate, latestCycle.cycleStartDate) + 1);
    await latestCycle.save();
    return latestCycle;
  }
  
  // If period already ended and user is trying to set same date, just return
  if (latestCycle.periodEndDate && toDateOnly(latestCycle.periodEndDate).getTime() === end.getTime()) {
    return latestCycle;
  }
  
  // Ensure cycle status is Active (cycle continues after period ends)
  if (latestCycle.cycleStatus !== 'Active') {
    latestCycle.cycleStatus = 'Active';
  }
  
  // Validate that end date is not before cycle start date
  if (end < latestCycle.cycleStartDate) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Period end date cannot be before cycle start date.');
  }
  
  // Set period end date (bleeding stopped, but cycle continues)
  latestCycle.periodEndDate = end;
  latestCycle.periodDurationDays = Math.max(1, diffDays(end, latestCycle.cycleStartDate) + 1);
  
  // Update current phase from Menstruation to Follicular
  if (latestCycle.currentPhase === 'Menstruation') {
    latestCycle.currentPhase = 'Follicular';
  }
  
  // Cycle remains Active - it only ends when next period starts
  // Don't set cycleEndDate or change cycleStatus to Completed
  
  await latestCycle.save();
  return latestCycle;
};

export const upsertDailyLog = async (userId, date, data) => {
  const day = toDateOnly(date);
  
  // Auto-complete old cycles before adding log
  await autoCompleteOldCycles(userId);
  
  // Find cycle where the date falls within the cycle's date range
  // For active cycles (no cycleEndDate), any date >= cycleStartDate is valid
  // For completed cycles, date must be between cycleStartDate and cycleEndDate
  let cycle = await PeriodCycle.findOne({
    userId,
    cycleStartDate: { $lte: day },
    $or: [
      { cycleStatus: 'Active' }, // Active cycle (period may have ended, but cycle continues)
      { cycleEndDate: { $exists: false } }, // Legacy: cycle without end date
      { cycleEndDate: { $gte: day } } // Completed cycle, but date is within range
    ]
  }).sort({ cycleStartDate: -1 });
  
  // If no cycle found, try to find any cycle that started before this date
  // (for historical data entry on completed cycles)
  if (!cycle) {
    cycle = await PeriodCycle.findOne({ userId, cycleStartDate: { $lte: day } }).sort({ cycleStartDate: -1 });
  }
  
  if (!cycle) {
    // If still no cycle found, create a historical cycle for this date
    cycle = await startPeriod(userId, day, { cycleStatus: 'Completed', cycleEndDate: day, periodDurationDays: 1 });
  }
  
  const idx = cycle.dailyLogs.findIndex((l) => toDateOnly(l.date).getTime() === day.getTime());
  if (idx >= 0) {
    cycle.dailyLogs[idx] = { ...cycle.dailyLogs[idx].toObject(), ...data, date: day };
  } else {
    cycle.dailyLogs.push({ date: day, ...data });
  }
  cycle.dailyLogs.sort((a, b) => toDateOnly(a.date) - toDateOnly(b.date)); // Keep logs sorted
  await cycle.save();
  return cycle.dailyLogs.find((l) => toDateOnly(l.date).getTime() === day.getTime());
};

export const getCurrent = async (userId) => {
  const settings = await getSettings(userId);
  
  // Auto-complete old cycles before getting current
  await autoCompleteOldCycles(userId);
  
  const latest = await PeriodCycle.findOne({ userId }).sort({ cycleStartDate: -1 });
  if (!latest) return { settings };
  const completeCycles = await PeriodCycle.find({ userId, cycleEndDate: { $exists: true } })
    .sort({ cycleStartDate: -1 })
    .limit(6);
  const avg = averageCycleLength(completeCycles, settings.defaultCycleLengthDays);
  // Clamp average cycle length to reasonable range (21-45 days) for display
  const clampedAvg = Math.max(21, Math.min(45, avg));
  const { predictedNextPeriodDate, predictedOvulationDate, predictedFertileWindowStart, predictedFertileWindowEnd } =
    predictFromLast(latest.cycleStartDate, clampedAvg, settings.lutealPhaseDays);
  const today = toDateOnly(new Date());
  // Use periodEndDate if available, otherwise calculate from periodDurationDays
  const periodEnd = latest.periodEndDate || (latest.periodDurationDays 
    ? addDays(latest.cycleStartDate, latest.periodDurationDays - 1) 
    : addDays(latest.cycleStartDate, 4)); // Default 5 days
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

export const getCalendar = async (userId, month) => {
  const ref = month ? new Date(`${month}-01T00:00:00Z`) : new Date();
  const year = ref.getUTCFullYear();
  const m = ref.getUTCMonth();
  const cycles = await PeriodCycle.find({ userId }).sort({ cycleStartDate: 1 });
  const settings = await getSettings(userId);
  // Build period day ranges using existing and predicted
  const completeCycles = cycles.filter((c) => c.cycleEndDate);
  const avg = averageCycleLength(completeCycles, settings.defaultCycleLengthDays);
  const last = cycles[cycles.length - 1];
  const preds = last ? predictFromLast(last.cycleStartDate, avg, settings.lutealPhaseDays) : {};
  // Use periodEndDate if available (when bleeding stopped), otherwise use cycleEndDate
  const periodRanges = cycles
    .filter((c) => c.cycleStartDate && (c.periodEndDate || c.cycleEndDate))
    .map((c) => ({ 
      start: c.cycleStartDate, 
      end: c.periodEndDate || c.cycleEndDate 
    }));
  // include a predicted range for current cycle if period hasn't ended
  if (last && !last.periodEndDate && !last.cycleEndDate) {
    const start = last.cycleStartDate;
    const end = addDays(start, (last.periodDurationDays || 5) - 1);
    periodRanges.push({ start, end });
  }
  return {
    year,
    month: m + 1,
    days: [], // frontend builds markers by using below fields
    periodRanges,
    fertileWindow:
      preds.predictedFertileWindowStart && preds.predictedFertileWindowEnd
        ? { start: preds.predictedFertileWindowStart, end: preds.predictedFertileWindowEnd }
        : undefined,
    ovulationDate: preds.predictedOvulationDate,
    nextPeriodDate: preds.predictedNextPeriodDate,
  };
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

/**
 * Delete a cycle
 */
export const deleteCycle = async (userId, cycleId) => {
  const cycle = await PeriodCycle.findOne({ _id: cycleId, userId });
  if (!cycle) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Cycle not found');
  }
  await PeriodCycle.findByIdAndDelete(cycleId);
  
  // Re-number remaining cycles
  const remainingCycles = await PeriodCycle.find({ userId }).sort({ cycleStartDate: 1 });
  for (let i = 0; i < remainingCycles.length; i++) {
    if (remainingCycles[i].cycleNumber !== i + 1) {
      remainingCycles[i].cycleNumber = i + 1;
      await remainingCycles[i].save();
    }
  }
  
  return { success: true };
};

/**
 * Update a cycle
 */
export const updateCycle = async (userId, cycleId, updateData) => {
  const cycle = await PeriodCycle.findOne({ _id: cycleId, userId });
  if (!cycle) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Cycle not found');
  }

  // Validate dates
  if (updateData.cycleStartDate) {
    updateData.cycleStartDate = toDateOnly(updateData.cycleStartDate);
  }
  if (updateData.cycleEndDate) {
    updateData.cycleEndDate = toDateOnly(updateData.cycleEndDate);
    if (updateData.cycleEndDate < cycle.cycleStartDate) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'cycleEndDate cannot be before cycleStartDate');
    }
  }

  // Update fields
  Object.assign(cycle, updateData);
  
  // Recalculate if dates changed
  if (updateData.cycleStartDate || updateData.cycleEndDate) {
    if (cycle.cycleEndDate) {
      cycle.periodDurationDays = Math.max(1, diffDays(cycle.cycleEndDate, cycle.cycleStartDate) + 1);
    }
  }

  await cycle.save();
  return cycle;
};

/**
 * Delete a daily log
 */
export const deleteDailyLog = async (userId, date) => {
  const day = toDateOnly(date);
  const cycle = await PeriodCycle.findOne({ userId, cycleStartDate: { $lte: day } }).sort({ cycleStartDate: -1 });
  if (!cycle) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No cycle found for date');
  }

  const logIndex = cycle.dailyLogs.findIndex((l) => toDateOnly(l.date).getTime() === day.getTime());
  if (logIndex === -1) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Log not found for date');
  }

  cycle.dailyLogs.splice(logIndex, 1);
  await cycle.save();
  
  return { success: true, message: 'Log deleted successfully' };
};

/**
 * Get analytics
 */
export const getAnalytics = async (userId) => {
  return await getCycleAnalytics(userId);
};

/**
 * Get insights
 */
export const getInsights = async (userId) => {
  return await getCycleInsights(userId);
};

/**
 * Get stats
 */
export const getStats = async (userId) => {
  return await getCycleStats(userId);
};

/**
 * Enhanced getCurrent with PMS and pregnancy mode support
 */
export const getCurrentEnhanced = async (userId) => {
  const settings = await getSettings(userId);
  
  // Auto-complete old cycles before getting current (only cycles >= maxCycleDays)
  await autoCompleteOldCycles(userId);
  
  // Get the most recent cycle (active or completed)
  const latest = await PeriodCycle.findOne({ userId }).sort({ cycleStartDate: -1 });
  
  if (!latest) {
    return { 
      settings,
      predictions: null,
      pmsWindow: null,
      pregnancyMode: settings.pregnancyModeEnabled || false,
    };
  }

  // Check pregnancy mode
  if (settings.pregnancyModeEnabled) {
    return {
      cycle: latest,
      settings,
      pregnancyMode: true,
      pregnancyStartDate: settings.pregnancyStartDate,
      pregnancyDueDate: settings.pregnancyDueDate,
      pregnancyWeek: settings.pregnancyWeek,
      predictions: null, // No predictions in pregnancy mode
    };
  }

  const completeCycles = await PeriodCycle.find({ userId, cycleEndDate: { $exists: true } })
    .sort({ cycleStartDate: -1 })
    .limit(6);
  const avg = averageCycleLength(completeCycles, settings.defaultCycleLengthDays);
  // Clamp average cycle length to reasonable range (21-45 days) for display
  const clampedAvg = Math.max(21, Math.min(45, avg));
  
  const preds = predictFromLastEnhanced(
    latest.cycleStartDate, 
    clampedAvg, 
    settings.lutealPhaseDays,
    {
      pmsDaysBefore: settings.pmsDaysBeforePeriod || 5,
      pregnancyMode: false,
    }
  );
  
  const today = toDateOnly(new Date());
  // Use periodEndDate if available, otherwise calculate from periodDurationDays
  const periodDuration = latest.periodDurationDays || (latest.periodEndDate 
    ? diffDays(latest.periodEndDate, latest.cycleStartDate) + 1 
    : 5);
  const currentPhase = determinePhase(today, latest.cycleStartDate, periodDuration, preds.predictedOvulationDate);
  
  // Calculate irregularity
  const irregularity = calculateIrregularity(completeCycles);
  
  return {
    cycle: latest,
    predictions: {
      nextPeriod: preds.predictedNextPeriodDate,
      ovulation: preds.predictedOvulationDate,
      fertileWindow: { 
        start: preds.predictedFertileWindowStart, 
        end: preds.predictedFertileWindowEnd 
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
 * Bulk import historical cycles
 */
export const bulkImportHistoricalCycles = async (userId, cyclesData) => {
  if (!Array.isArray(cyclesData) || cyclesData.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cycles data must be a non-empty array');
  }

  if (cyclesData.length > 50) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Maximum 50 cycles per request');
  }

  const results = [];
  const settings = await getSettings(userId);
  
  // Sort cycles by start date
  const sortedCycles = cyclesData.sort((a, b) => {
    const dateA = new Date(a.cycleStartDate);
    const dateB = new Date(b.cycleStartDate);
    return dateA - dateB;
  });

  for (const cycleData of sortedCycles) {
    const {
      cycleStartDate,
      cycleEndDate,
      periodDurationDays,
      dailyLogs = [],
      cycleNotes,
    } = cycleData;

    if (!cycleStartDate) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'cycleStartDate is required for each cycle');
    }

    const start = toDateOnly(cycleStartDate);
    const end = cycleEndDate ? toDateOnly(cycleEndDate) : null;
    const isCompleted = !!end;

    // Validate date range
    if (end && end < start) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'cycleEndDate cannot be before cycleStartDate');
    }

    // Check if cycle already exists
    let cycle = await PeriodCycle.findOne({ userId, cycleStartDate: start });

    if (cycle) {
      // Update existing
      if (end) {
        cycle.cycleEndDate = end;
        cycle.periodDurationDays = periodDurationDays || Math.max(1, diffDays(end, start) + 1);
        cycle.cycleStatus = 'Completed';
      }
      if (cycleNotes) cycle.cycleNotes = cycleNotes;
      if (dailyLogs.length > 0) {
        for (const logData of dailyLogs) {
          const logDate = toDateOnly(logData.date);
          const existingLogIndex = cycle.dailyLogs.findIndex(
            (l) => toDateOnly(l.date).getTime() === logDate.getTime()
          );
          if (existingLogIndex >= 0) {
            cycle.dailyLogs[existingLogIndex] = { ...cycle.dailyLogs[existingLogIndex].toObject(), ...logData, date: logDate };
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

    // Calculate cycle number
    const allCycles = await PeriodCycle.find({ userId }).sort({ cycleStartDate: 1 });
    const cyclesBefore = allCycles.filter(c => toDateOnly(c.cycleStartDate) < start);
    const nextCycleNumber = cyclesBefore.length + 1;

    // Calculate cycle length if completed
    let cycleLengthDays = null;
    if (isCompleted) {
      const prevCycle = await PeriodCycle.findOne({ 
        userId, 
        cycleEndDate: { $exists: true },
        cycleStartDate: { $lt: start }
      }).sort({ cycleStartDate: -1 });
      if (prevCycle) {
        cycleLengthDays = diffDays(start, prevCycle.cycleStartDate);
      }
    }

    // Calculate predictions
    const completeCycles = await PeriodCycle.find({ userId, cycleEndDate: { $exists: true } })
      .sort({ cycleStartDate: -1 })
      .limit(6);
    const avg = averageCycleLength(completeCycles, settings.defaultCycleLengthDays);
    const preds = predictFromLast(start, avg, settings.lutealPhaseDays);

    // Process daily logs
    const processedLogs = dailyLogs.map(log => ({
      ...log,
      date: toDateOnly(log.date)
    })).sort((a, b) => toDateOnly(a.date) - toDateOnly(b.date));

    // Create new cycle
    cycle = await PeriodCycle.create({
      userId,
      cycleNumber: nextCycleNumber,
      cycleStartDate: start,
      cycleEndDate: end,
      periodDurationDays: periodDurationDays || (end ? Math.max(1, diffDays(end, start) + 1) : undefined),
      cycleStatus: isCompleted ? 'Completed' : 'Active',
      currentPhase: 'Menstruation',
      cycleLengthDays,
      dailyLogs: processedLogs,
      cycleNotes,
      ...preds,
    });

    results.push(cycle);
  }

  // Re-number all cycles
  const allCycles = await PeriodCycle.find({ userId }).sort({ cycleStartDate: 1 });
  for (let i = 0; i < allCycles.length; i++) {
    if (allCycles[i].cycleNumber !== i + 1) {
      allCycles[i].cycleNumber = i + 1;
      await allCycles[i].save();
    }
  }

  return results;
};
