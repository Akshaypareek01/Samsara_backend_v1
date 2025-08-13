import httpStatus from 'http-status';
import ApiError from '../../utils/ApiError.js';
import { PeriodCycle, PeriodSettings } from '../../models/index.js';
import { averageCycleLength, predictFromLast, determinePhase, toDateOnly, addDays, diffDays } from './prediction.service.js';

export const getSettings = async (userId) => {
  let settings = await PeriodSettings.findOne({ userId });
  if (!settings) settings = await PeriodSettings.create({ userId });
  return settings;
};

export const updateSettings = async (userId, payload) => {
  const settings = await PeriodSettings.findOneAndUpdate({ userId }, payload, { upsert: true, new: true });
  return settings;
};

export const startPeriod = async (userId, date) => {
  const start = toDateOnly(date || new Date());
  // close previous open cycle if exists
  const lastOpen = await PeriodCycle.findOne({ userId, cycleEndDate: { $exists: false } }).sort({ cycleStartDate: -1 });
  if (lastOpen) {
    lastOpen.cycleEndDate = start; // auto-close at new start
    lastOpen.periodDurationDays = Math.max(1, diffDays(lastOpen.cycleEndDate, lastOpen.cycleStartDate) + 1);
    await lastOpen.save();
  }
  const cycle = await PeriodCycle.create({ userId, cycleStartDate: start, currentPhase: 'Menstruation' });
  return cycle;
};

export const stopPeriod = async (userId, date) => {
  const end = toDateOnly(date || new Date());
  const current = await PeriodCycle.findOne({ userId }).sort({ cycleStartDate: -1 });
  if (!current) throw new ApiError(httpStatus.NOT_FOUND, 'No cycle found');
  if (current.cycleEndDate) return current; // already closed
  current.cycleEndDate = end;
  current.periodDurationDays = Math.max(1, diffDays(end, current.cycleStartDate) + 1);
  // compute cycle length based on previous cycle
  const prev = await PeriodCycle.find({ userId, cycleEndDate: { $exists: true } })
    .sort({ cycleStartDate: -1 })
    .limit(6);
  const avg = averageCycleLength(prev, 28);
  const settings = await getSettings(userId);
  const preds = predictFromLast(current.cycleStartDate, avg, settings.lutealPhaseDays);
  Object.assign(current, preds);
  await current.save();
  return current;
};

export const upsertDailyLog = async (userId, date, data) => {
  const day = toDateOnly(date);
  let cycle = await PeriodCycle.findOne({ userId, cycleStartDate: { $lte: day } }).sort({ cycleStartDate: -1 });
  if (!cycle) throw new ApiError(httpStatus.NOT_FOUND, 'No cycle found for date');
  const idx = cycle.dailyLogs.findIndex((l) => toDateOnly(l.date).getTime() === day.getTime());
  if (idx >= 0) {
    cycle.dailyLogs[idx] = { ...cycle.dailyLogs[idx].toObject(), ...data, date: day };
  } else {
    cycle.dailyLogs.push({ date: day, ...data });
  }
  await cycle.save();
  return cycle.dailyLogs.find((l) => toDateOnly(l.date).getTime() === day.getTime());
};

export const getCurrent = async (userId) => {
  const settings = await getSettings(userId);
  const latest = await PeriodCycle.findOne({ userId }).sort({ cycleStartDate: -1 });
  if (!latest) return { settings };
  const completeCycles = await PeriodCycle.find({ userId, cycleEndDate: { $exists: true } }).sort({ cycleStartDate: -1 }).limit(6);
  const avg = averageCycleLength(completeCycles, settings.defaultCycleLengthDays);
  const { predictedNextPeriodDate, predictedOvulationDate, predictedFertileWindowStart, predictedFertileWindowEnd } =
    predictFromLast(latest.cycleStartDate, avg, settings.lutealPhaseDays);
  const today = toDateOnly(new Date());
  const currentPhase = determinePhase(today, latest.cycleStartDate, latest.periodDurationDays || 5, predictedOvulationDate);
  return {
    cycle: latest,
    predictions: {
      nextPeriod: predictedNextPeriodDate,
      ovulation: predictedOvulationDate,
      fertileWindow: { start: predictedFertileWindowStart, end: predictedFertileWindowEnd },
      averageCycleDays: avg,
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
  const periodRanges = cycles
    .filter((c) => c.cycleStartDate && c.cycleEndDate)
    .map((c) => ({ start: c.cycleStartDate, end: c.cycleEndDate }));
  // include a predicted range for current cycle if open
  if (last && !last.cycleEndDate) {
    const start = last.cycleStartDate;
    const end = addDays(start, (last.periodDurationDays || 5) - 1);
    periodRanges.push({ start, end });
  }
  return {
    year,
    month: m + 1,
    days: [], // frontend builds markers by using below fields
    periodRanges,
    fertileWindow: preds.predictedFertileWindowStart && preds.predictedFertileWindowEnd
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


