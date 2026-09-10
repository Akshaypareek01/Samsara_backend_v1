import httpStatus from 'http-status';
import { FatTracker, BodyStatus, User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { dayRange, lastNDaysRange, dateKeyFromStored, todayDateKey } from '../utils/trackerDayRange.js';
import {
  bodyFatValue,
  fatProfileFrom,
  healthRangeCategory,
  healthRanges,
  mergeFatHistory,
} from '../utils/fatTracker.js';

/**
 * Map client `date: YYYY-MM-DD` onto measurementDate.
 * @param {object} data
 * @returns {object}
 */
function applyClientDate(data) {
  if (!data?.date) return { ...data };
  const { start } = dayRange(data.date);
  const next = { ...data, measurementDate: start };
  delete next.date;
  return next;
}

/**
 * Latest body-status + user used to fill age/height/weight/gender.
 * @param {import('mongoose').Types.ObjectId} userId
 * @returns {Promise<{ bodyStatus: object|null, user: object|null }>}
 */
async function loadProfileSources(userId) {
  const [bodyStatus, user] = await Promise.all([
    BodyStatus.getLatestByUserId(userId),
    User.findById(userId).select('age gender height weight').lean(),
  ]);
  return { bodyStatus, user };
}

/**
 * Fat measurements with a real % — merged with body-status bodyFat.
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {number} [days]
 * @returns {Promise<object[]>}
 */
export const getFatHistory = async (userId, days = 30) => {
  const { lookupStart, end } = lastNDaysRange(days);
  const query = {
    userId,
    isActive: true,
    measurementDate: { $gte: lookupStart, $lt: end },
  };
  const [fatDocs, bodyStatusDocs] = await Promise.all([
    FatTracker.find({
      ...query,
      'bodyFat.value': { $gt: 0 },
    }).sort({ measurementDate: -1 }),
    BodyStatus.find({
      ...query,
      'bodyFat.value': { $gt: 0 },
    }).sort({ measurementDate: -1 }),
  ]);
  return mergeFatHistory(fatDocs, bodyStatusDocs, dateKeyFromStored);
};

/**
 * Screen payload: profile from My Body + history + health bands from the API.
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {number} [days]
 * @returns {Promise<object>}
 */
export const getFatSummary = async (userId, days = 730) => {
  const { bodyStatus, user } = await loadProfileSources(userId);
  const history = await getFatHistory(userId, days);
  const latestFatDoc = await FatTracker.getLatestByUserId(userId);
  const profile = fatProfileFrom(bodyStatus, user, latestFatDoc);
  const latest = history[0] || null;
  const previous = history[1]?.bodyFat?.value ?? null;
  const current = latest?.bodyFat?.value ?? null;
  const gender = profile.gender || latest?.gender;
  const storedGoal = await FatTracker.findOne({
    userId,
    isActive: true,
    goal: { $gt: 0 },
  }).sort({ updatedAt: -1 });
  return {
    hasProfile: profile.hasProfile,
    profile,
    latest,
    previous,
    change: latest?.change ?? null,
    current,
    goal: latest?.goal ?? storedGoal?.goal ?? latestFatDoc?.goal ?? null,
    healthRangeCategory:
      current != null ? healthRangeCategory(current, gender) : null,
    healthRanges: healthRanges(gender),
    lastUpdated: latest?.measurementDate || bodyStatus?.measurementDate || null,
    history,
  };
};

/**
 * Create or update today's fat row. Hydrates profile from My Body.
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {object} fatData
 * @returns {Promise<object>}
 */
export const addFatEntry = async (userId, fatData) => {
  const percent = bodyFatValue(fatData?.bodyFat);
  if (percent == null) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Body fat percent is required');
  }

  const { bodyStatus, user } = await loadProfileSources(userId);
  const profile = fatProfileFrom(bodyStatus, user, fatData);
  if (!profile.hasProfile || !profile.age || !profile.gender || !profile.height || !profile.weight) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Complete My Body (age, gender, height, weight) before logging body fat'
    );
  }

  const dated = applyClientDate(fatData);
  const dateKey = dated.measurementDate
    ? dateKeyFromStored(dated.measurementDate)
    : todayDateKey();
  const { start, end, lookupStart } = dayRange(dateKey);

  const previous = await FatTracker.findOne({
    userId,
    isActive: true,
    'bodyFat.value': { $gt: 0 },
    measurementDate: { $lt: start },
  }).sort({ measurementDate: -1 });
  const prevPercent = bodyFatValue(previous?.bodyFat);
  const change =
    prevPercent != null ? Math.round((percent - prevPercent) * 10) / 10 : null;

  const existing = await FatTracker.findOne({
    userId,
    isActive: true,
    measurementDate: { $gte: lookupStart, $lt: end },
  }).sort({ measurementDate: -1 });

  const storedGoalDoc = await FatTracker.findOne({
    userId,
    isActive: true,
    goal: { $gt: 0 },
  }).sort({ updatedAt: -1 });

  const payload = {
    age: profile.age,
    gender: profile.gender,
    height: profile.height,
    weight: profile.weight,
    bodyFat: { value: percent, unit: '%' },
    goal: existing?.goal || storedGoalDoc?.goal || previous?.goal || null,
    change,
    healthRangeCategory: healthRangeCategory(percent, profile.gender),
    notes: fatData.notes,
    measurementDate: start,
    isActive: true,
  };

  if (existing) {
    Object.assign(existing, payload);
    return existing.save();
  }
  return FatTracker.create({ userId, ...payload });
};

/**
 * Set body-fat goal without logging a new measurement.
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {number} goal
 * @returns {Promise<object>}
 */
export const updateFatGoal = async (userId, goal) => {
  const next = Number(goal);
  if (!Number.isFinite(next) || next <= 0 || next > 100) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Goal must be between 0 and 100');
  }

  const withReading = await FatTracker.findOne({
    userId,
    isActive: true,
    'bodyFat.value': { $gt: 0 },
  }).sort({ measurementDate: -1 });
  if (withReading) {
    withReading.goal = next;
    return withReading.save();
  }

  const latest = await FatTracker.getLatestByUserId(userId);
  if (latest) {
    latest.goal = next;
    return latest.save();
  }

  const { start } = dayRange(todayDateKey());
  return FatTracker.create({
    userId,
    goal: next,
    measurementDate: start,
    isActive: true,
  });
};

/**
 * When My Body includes body fat, keep the fat tracker in sync for that day.
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {object} bodyStatus
 * @returns {Promise<object|null>}
 */
export const syncFatFromBodyStatus = async (userId, bodyStatus) => {
  const percent = bodyFatValue(bodyStatus?.bodyFat);
  if (percent == null) return null;
  try {
    return await addFatEntry(userId, {
      date: dateKeyFromStored(bodyStatus.measurementDate || new Date()),
      bodyFat: { value: percent, unit: '%' },
      notes: 'Synced from My Body',
    });
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === httpStatus.BAD_REQUEST) {
      return null;
    }
    throw err;
  }
};
