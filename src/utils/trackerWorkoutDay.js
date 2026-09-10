import { CaloriesTarget, StepTracker, WorkoutTracker } from '../models/index.js';
import { dateKeyFromStored, dayRange } from './trackerDayRange.js';
import {
  canonicalDailyCalories,
  clampDeviceKcal,
  pickBestActivityDoc,
} from './trackerActivityDay.js';

/**
 * Session duration in hours. Missing unit + value > 24 is treated as minutes.
 * @param {{ value?: number, unit?: string }|null|undefined} duration
 * @returns {number}
 */
export function durationToHours(duration) {
  const value = Number(duration?.value);
  if (!Number.isFinite(value) || value <= 0) return 0;
  const unit = String(duration?.unit || '').toLowerCase();
  if (unit === 'min' || unit === 'm' || unit === 'minutes') return value / 60;
  if (unit === 's' || unit === 'sec' || unit === 'seconds') return value / 3600;
  if (!unit && value > 24) return value / 60;
  return value;
}

/**
 * Recalculate daily totals and per-type summary from workoutEntries.
 * @param {import('mongoose').Document} doc
 * @returns {void}
 */
export function recalcWorkoutDayTotals(doc) {
  const entries = doc.workoutEntries || [];
  let totalTime = 0;
  let totalCalories = 0;
  const byType = {};

  entries.forEach((entry) => {
    const time = durationToHours(entry.duration);
    const calories = Number(entry.calories) || 0;
    totalTime += time;
    totalCalories += calories;
    const type = entry.workoutType;
    if (!type) return;
    if (!byType[type]) {
      byType[type] = {
        workoutType: type,
        totalTime: 0,
        totalCalories: 0,
        workoutCount: 0,
      };
    }
    byType[type].totalTime += time;
    byType[type].totalCalories += calories;
    byType[type].workoutCount += 1;
  });

  doc.totalWorkoutTime = totalTime;
  doc.totalCaloriesBurned = totalCalories;
  doc.workoutTypeSummary = Object.values(byType).map((summary) => ({
    ...summary,
    averageTime: summary.workoutCount ? summary.totalTime / summary.workoutCount : 0,
    averageCalories: summary.workoutCount ? summary.totalCalories / summary.workoutCount : 0,
  }));
}

/**
 * Find or create the canonical UTC-day workout doc, folding any timezone-split extras.
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @param {string|Date} [dateInput]
 * @returns {Promise<import('mongoose').Document>}
 */
export async function getOrMergeWorkoutDay(userId, dateInput) {
  const { start, end, lookupStart } = dayRange(dateInput);
  const docs = await WorkoutTracker.find({
    userId,
    date: { $gte: lookupStart, $lt: end },
  }).sort({ date: 1 });

  const startMs = start.getTime();
  let canonical = docs.find((doc) => new Date(doc.date).getTime() === startMs) || docs[0];

  if (!canonical) {
    return WorkoutTracker.create({
      userId,
      date: start,
      workoutEntries: [],
      totalWorkoutTime: 0,
      totalCaloriesBurned: 0,
      weeklySummary: [],
      workoutTypeSummary: [],
      totalWeeklyTime: 0,
      totalWeeklyCalories: 0,
    });
  }

  canonical.date = start;
  const extras = docs.filter((doc) => doc._id.toString() !== canonical._id.toString());
  extras.forEach((extra) => {
    (extra.workoutEntries || []).forEach((entry) => {
      canonical.workoutEntries.push(entry);
    });
  });
  if (extras.length) {
    canonical.markModified('workoutEntries');
    await canonical.save();
    await WorkoutTracker.deleteMany({
      _id: { $in: extras.map((doc) => doc._id) },
    });
  }
  return canonical;
}

/**
 * Sum workout day-docs in a window into dashboard-shaped totals.
 * When `dateKey` is set, skip entries whose own `date` is a different calendar day
 * (getOrMergeWorkoutDay can fold yesterday into today's doc).
 * @param {Array<{ workoutEntries?: Array }>} docs
 * @param {string} [dateKey] YYYY-MM-DD
 * @returns {{
 *   totalCaloriesBurned: number,
 *   totalWorkoutTime: number,
 *   workoutTypeBreakdown: Record<string, { totalTime: number, totalCalories: number, workoutCount: number }>
 * }}
 */
export function aggregateWorkoutDocs(docs, dateKey) {
  const workoutTypeBreakdown = {};
  let totalCaloriesBurned = 0;
  let totalWorkoutTime = 0;

  (docs || []).forEach((day) => {
    (day.workoutEntries || []).forEach((entry) => {
      if (dateKey && entry?.date && dateKeyFromStored(entry.date) !== dateKey) {
        return;
      }
      const time = durationToHours(entry.duration);
      const calories = Number(entry.calories) || 0;
      totalWorkoutTime += time;
      totalCaloriesBurned += calories;
      const type = entry.workoutType;
      if (!type) return;
      if (!workoutTypeBreakdown[type]) {
        workoutTypeBreakdown[type] = {
          totalTime: 0,
          totalCalories: 0,
          workoutCount: 0,
        };
      }
      workoutTypeBreakdown[type].totalTime += time;
      workoutTypeBreakdown[type].totalCalories += calories;
      workoutTypeBreakdown[type].workoutCount += 1;
    });
  });

  return { totalCaloriesBurned, totalWorkoutTime, workoutTypeBreakdown };
}

/**
 * Persist one daily burn: max(device active kcal, today's workout logs).
 * Breakdown buckets stay for journal/debug; the ring uses currentCalories only.
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @param {string|Date} [dateInput]
 * @returns {Promise<void>}
 */
export async function syncWorkoutCaloriesForDate(userId, dateInput) {
  const { start, end, lookupStart } = dayRange(dateInput);
  const dateKey = dateKeyFromStored(start);
  const [workoutDocs, stepDocs] = await Promise.all([
    WorkoutTracker.find({
      userId,
      date: { $gte: lookupStart, $lt: end },
    }),
    StepTracker.find({
      userId,
      isActive: true,
      measurementDate: { $gte: lookupStart, $lt: end },
    }),
  ]);
  const { totalCaloriesBurned } = aggregateWorkoutDocs(workoutDocs, dateKey);
  const bestActivity = pickBestActivityDoc(
    (stepDocs || []).filter((doc) => dateKeyFromStored(doc.measurementDate) === dateKey),
  );
  const deviceKcal = clampDeviceKcal(bestActivity?.calories);
  const workoutKcal = clampDeviceKcal(totalCaloriesBurned);
  const current = canonicalDailyCalories(deviceKcal, workoutKcal);

  let caloriesTarget = await CaloriesTarget.getTodayByUserId(userId, dateInput);
  if (!caloriesTarget) {
    caloriesTarget = await CaloriesTarget.create({
      userId,
      date: start,
      dailyTarget: 2000,
      currentCalories: current,
      caloriesBreakdown: { workout: workoutKcal, steps: deviceKcal, other: 0 },
      weeklySummary: [],
    });
    return;
  }
  caloriesTarget.caloriesBreakdown.workout = workoutKcal;
  caloriesTarget.caloriesBreakdown.steps = deviceKcal;
  caloriesTarget.markModified('caloriesBreakdown');
  caloriesTarget.currentCalories = current;
  await caloriesTarget.save();
}
