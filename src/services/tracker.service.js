import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { 
  WeightTracker, 
  WaterTracker, 
  Mood, 
  TemperatureTracker, 
  FatTracker, 
  BmiTracker, 
  BodyStatus, 
  StepTracker,
  HeartRateTracker,
  SleepTracker,
  WorkoutTracker,
  CaloriesTarget
} from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { normalizeSleepEntry } from '../utils/sleepTracker.js';
import { dayRange, todayRange, lastNDaysRange, dateKeyFromStored, shiftDateKey, todayDateKey } from '../utils/trackerDayRange.js';
import {
  aggregateWorkoutDocs,
  getOrMergeWorkoutDay,
  recalcWorkoutDayTotals,
  syncWorkoutCaloriesForDate,
} from '../utils/trackerWorkoutDay.js';
import {
  assertManualAllowed,
  buildActivitySet,
  canonicalDailyCalories,
  clampDeviceKcal,
  pickBestActivityDoc,
} from '../utils/trackerActivityDay.js';
import { bodyFatValue } from '../utils/fatTracker.js';
import { canonicalizeBodyStatus, serializeBodyStatus } from '../utils/bodyStatus.js';
import {
  getFatHistory,
  getFatSummary,
  addFatEntry,
  updateFatGoal,
  syncFatFromBodyStatus,
} from './fatTracker.service.js';

const TRACKER_MODELS = {
  weight: WeightTracker,
  water: WaterTracker,
  mood: Mood,
  temperature: TemperatureTracker,
  fat: FatTracker,
  bmi: BmiTracker,
  bodyStatus: BodyStatus,
  step: StepTracker,
  sleep: SleepTracker,
  'heart-rate': HeartRateTracker,
};

const MEASUREMENT_DATE_TYPES = [
  'step',
  'heart-rate',
  'temperature',
  'weight',
  'fat',
  'bmi',
  'bodyStatus',
];

/**
 * Map client `date: YYYY-MM-DD` onto the stored date field and strip `date`.
 * @param {Object} data
 * @param {'measurementDate'|'date'} fieldName
 * @returns {Object}
 */
const applyClientDate = (data, fieldName = 'measurementDate') => {
  if (!data?.date) return { ...data };
  const { start } = dayRange(data.date);
  const next = { ...data, [fieldName]: start };
  delete next.date;
  return next;
};

/**
 * Persist ObjectIds on workout subdocs that were saved without `_id`.
 * Mongoose hydrates missing subdoc ids in memory, so we inspect the raw BSON.
 * @param {import('mongoose').Document[]} docs
 * @returns {Promise<import('mongoose').Document[]>}
 */
const ensureWorkoutEntryIds = async (docs) => {
  await Promise.all(
    (docs || []).map(async (doc) => {
      const raw = await WorkoutTracker.collection.findOne(
        { _id: doc._id },
        { projection: { workoutEntries: 1 } }
      );
      const stored = raw?.workoutEntries || [];
      const needsIds = stored.some((entry) => !entry?._id);
      if (!needsIds) return;
      doc.workoutEntries.forEach((entry, index) => {
        if (!stored[index]?._id && !entry._id) {
          entry._id = new mongoose.Types.ObjectId();
        }
      });
      doc.markModified('workoutEntries');
      await doc.save();
    })
  );
  return docs;
};

/**
 * Map client payloads onto the stored tracker document shape.
 * @param {string} trackerType
 * @param {Object} updateData
 * @returns {Object}
 */
const normalizeTrackerUpdate = (trackerType, updateData) => {
  const data = { ...updateData };
  if (trackerType === 'step') {
    if (data.steps && typeof data.steps === 'object' && data.steps.value != null) {
      data.steps = data.steps.value;
    }
    if (data.activeCalories?.value != null) {
      data.calories = data.activeCalories.value;
      delete data.activeCalories;
    }
    if (data.date) {
      const { start } = dayRange(data.date);
      data.measurementDate = start;
      delete data.date;
    }
  }
  if (MEASUREMENT_DATE_TYPES.includes(trackerType) && data.date) {
    const { start } = dayRange(data.date);
    data.measurementDate = start;
    delete data.date;
  }
  if (trackerType === 'sleep' || trackerType === 'water') {
    const next = data.date ? applyClientDate(data, 'date') : data;
    if (trackerType === 'sleep') {
      return { ...next, ...normalizeSleepEntry(next) };
    }
    return next;
  }
  return data;
};

/**
 * Create initial trackers for a new user
 * @param {ObjectId} userId
 * @returns {Promise<Object>}
 */
const createInitialTrackers = async (userId) => {
  try {
    // Only create trackers that can be initialized without data
    // Trackers requiring measurements (weight, height, etc.) will be created when user provides data
    const trackers = await Promise.all([
      WaterTracker.create({ userId }),
      SleepTracker.create({ userId })
    ]);

    return {
      waterTracker: trackers[0],
      sleepTracker: trackers[1]
    };
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to create initial trackers');
  }
};

/**
 * Update tracker fields when user profile is updated
 * @param {ObjectId} userId
 * @param {Object} profileData - Updated profile data
 * @returns {Promise<Object>}
 */
const updateTrackersFromProfile = async (userId, profileData) => {
  try {
    const updates = [];

    // Helper function to normalize gender to enum values
    const normalizeGender = (gender) => {
      if (!gender) return null;
      const genderValue = gender.toString().trim();
      const genderLower = genderValue.toLowerCase();
      if (genderLower === 'male') return 'Male';
      if (genderLower === 'female') return 'Female';
      if (genderLower === 'other') return 'Other';
      if (['Male', 'Female', 'Other'].includes(genderValue)) return genderValue;
      return null; // Invalid gender value
    };

    // Height/weight are My Body measurements. Do not spawn BMI/BodyStatus rows
    // from profile PATCH age/gender — that overwrote the latest My Body entry
    // with a sparse document (no age/height/weight).
    if (profileData.height || profileData.weight) {
      const bmiData = {};
      if (profileData.height) bmiData.height = { value: parseFloat(profileData.height), unit: 'cm' };
      if (profileData.weight) bmiData.weight = { value: parseFloat(profileData.weight), unit: 'kg' };
      if (profileData.age) bmiData.age = parseInt(profileData.age);
      const normalizedGender = normalizeGender(profileData.gender);
      if (normalizedGender) bmiData.gender = normalizedGender;
      
      updates.push(
        BmiTracker.create({ userId, ...bmiData })
      );
    }

    if (profileData.height || profileData.weight) {
      const bodyStatusData = {};
      if (profileData.height) bodyStatusData.height = { value: parseFloat(profileData.height), unit: 'cm' };
      if (profileData.weight) bodyStatusData.weight = { value: parseFloat(profileData.weight), unit: 'kg' };
      if (profileData.age) bodyStatusData.age = parseInt(profileData.age);
      const normalizedGender = normalizeGender(profileData.gender);
      if (normalizedGender) bodyStatusData.gender = normalizedGender;
      
      updates.push(
        BodyStatus.create({ userId, ...bodyStatusData })
      );
    }

    // Create new Weight Tracker entry if weight is provided
    if (profileData.weight) {
      const weightValue = parseFloat(profileData.weight);
      const weightData = {
        currentWeight: { value: weightValue, unit: 'kg' },
        startingWeight: { value: weightValue, unit: 'kg' }
      };
      
      // If target weight is also provided, add it
      if (profileData.targetWeight) {
        const targetWeightValue = parseFloat(profileData.targetWeight);
        weightData.goalWeight = { value: targetWeightValue, unit: 'kg' };
      }
      
      updates.push(
        WeightTracker.create({ userId, ...weightData })
      );
    }

    if (updates.length > 0) {
      await Promise.all(updates);
      console.log(`Created new tracker entries for user: ${userId}`);
    }

    return { success: true, createdEntries: updates.length };
  } catch (error) {
    console.error(`Failed to create tracker entries for user ${userId}:`, error);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to create tracker entries');
  }
};

/**
 * Get weight tracker history
 * @param {ObjectId} userId
 * @param {number} days
 * @returns {Promise<Array>}
 */
const getWeightHistory = async (userId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return WeightTracker.find({
    userId,
    measurementDate: { $gte: startDate },
    isActive: true
  }).sort({ measurementDate: -1 });
};

/**
 * Get weight tracker entry by ID
 * @param {ObjectId} userId
 * @param {ObjectId} entryId
 * @returns {Promise<Object>}
 */
const getWeightById = async (userId, entryId) => {
  const entry = await WeightTracker.findOne({ _id: entryId, userId });
  if (!entry) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Weight tracker entry not found');
  }
  return entry;
};

/**
 * Get water tracker history
 * @param {ObjectId} userId
 * @param {number} days
 * @returns {Promise<Array>}
 */
const getWaterHistory = async (userId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return WaterTracker.find({
    userId,
    date: { $gte: startDate }
  }).sort({ date: -1 });
};

/**
 * Get water tracker entry by ID
 * @param {ObjectId} userId
 * @param {ObjectId} entryId
 * @returns {Promise<Object>}
 */
const getWaterById = async (userId, entryId) => {
  const entry = await WaterTracker.findOne({ _id: entryId, userId });
  if (!entry) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Water tracker entry not found');
  }
  return entry;
};

/**
 * Get mood history
 * @param {ObjectId} userId
 * @param {number} days
 * @returns {Promise<Array>}
 */
const getMoodHistory = async (userId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return Mood.find({
    userId,
    createdAt: { $gte: startDate }
  }).sort({ createdAt: -1 });
};

/**
 * Get temperature tracker history
 * @param {ObjectId} userId
 * @param {number} days
 * @returns {Promise<Array>}
 */
const getTemperatureHistory = async (userId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return TemperatureTracker.find({
    userId,
    measurementDate: { $gte: startDate },
    isActive: true
  }).sort({ measurementDate: -1 });
};

/**
 * Get BMI tracker history
 * @param {ObjectId} userId
 * @param {number} days
 * @returns {Promise<Array>}
 */
const getBmiHistory = async (userId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return BmiTracker.find({
    userId,
    measurementDate: { $gte: startDate },
    isActive: true
  }).sort({ measurementDate: -1 });
};

/**
 * Get body status history (lean, optional cap). Dashboard should pass limit=2.
 * @param {ObjectId} userId
 * @param {number} days
 * @param {number} [limit]
 * @returns {Promise<Array>}
 */
const getBodyStatusHistory = async (userId, days = 30, limit) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const query = BodyStatus.find({
    userId,
    measurementDate: { $gte: startDate },
    isActive: true,
  })
    .sort({ measurementDate: -1 })
    .select('-__v -createdAt -updatedAt')
    .lean();

  const cap = Number(limit);
  if (Number.isFinite(cap) && cap > 0) {
    query.limit(Math.min(cap, 100));
  }

  const docs = await query;
  return docs.map(serializeBodyStatus);
};

/**
 * Get body status entry by ID
 * @param {ObjectId} userId
 * @param {ObjectId} entryId
 * @returns {Promise<Object>}
 */
const getBodyStatusById = async (userId, entryId) => {
  const entry = await BodyStatus.findOne({ _id: entryId, userId })
    .select('-__v -createdAt -updatedAt')
    .lean();
  if (!entry) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Body status entry not found');
  }
  return serializeBodyStatus(entry);
};

/**
 * Get step tracker history
 * @param {ObjectId} userId
 * @param {number} days
 * @returns {Promise<Array>}
 */
const getStepHistory = async (userId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return StepTracker.find({
    userId,
    measurementDate: { $gte: startDate },
    isActive: true
  }).sort({ measurementDate: -1 });
};

/**
 * Get sleep tracker history
 * @param {ObjectId} userId
 * @param {number} days
 * @returns {Promise<Array>}
 */
const getSleepHistory = async (userId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return SleepTracker.find({
    userId,
    date: { $gte: startDate }
  }).sort({ date: -1 });
};









/**
 * Get sleep tracker entry by ID
 * @param {ObjectId} userId
 * @param {ObjectId} entryId
 * @returns {Promise<Object>}
 */
const getSleepById = async (userId, entryId) => {
  const entry = await SleepTracker.findOne({ _id: entryId, userId });
  if (!entry) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Sleep tracker entry not found');
  }
  return entry;
};

/**
 * Get all tracker data for dashboard.
 * Workout / step / heart / sleep / water / temp are today's rows only.
 * @param {ObjectId} userId
 * @returns {Promise<Object>}
 */
const getDashboardData = async (userId) => {
  const { end: todayEnd, lookupStart: todayLookupStart } = todayRange();
  const todayKey = todayDateKey();
  const todayQuery = { $gte: todayLookupStart, $lt: todayEnd };
  const [
    latestWeight,
    todayWater,
    latestMood,
    todayTemperature,
    latestFat,
    latestBmi,
    latestBodyStatus,
    todaySteps,
    todaySleep,
    todayWorkouts,
    todayHeartRate,
    caloriesTarget,
  ] = await Promise.all([
    WeightTracker.getLatestByUserId(userId),
    WaterTracker.findOne({ userId, date: todayQuery }).sort({ date: -1 }),
    Mood.findOne({ userId }).sort({ createdAt: -1 }),
    TemperatureTracker.findOne({
      userId,
      isActive: true,
      measurementDate: todayQuery,
    }).sort({ measurementDate: -1 }),
    FatTracker.findOne({
      userId,
      isActive: true,
      'bodyFat.value': { $gt: 0 },
    }).sort({ measurementDate: -1 }),
    BmiTracker.getLatestByUserId(userId),
    BodyStatus.getLatestByUserId(userId),
    StepTracker.find({
      userId,
      isActive: true,
      measurementDate: todayQuery,
    }).sort({ measurementDate: -1 }),
    SleepTracker.findOne({ userId, date: todayQuery }).sort({ date: -1 }),
    WorkoutTracker.find({ userId, date: todayQuery }),
    HeartRateTracker.findOne({
      userId,
      isActive: true,
      measurementDate: todayQuery,
    }).sort({ measurementDate: -1 }),
    getCaloriesTarget(userId),
  ]);

  const latestStep = pickBestActivityDoc(
    (todaySteps || []).filter((doc) => dateKeyFromStored(doc.measurementDate) === todayKey),
  );

  const workout = aggregateWorkoutDocs(
    (todayWorkouts || []).filter((doc) => dateKeyFromStored(doc.date) === todayKey),
    todayKey,
  );
  const deviceKcal = clampDeviceKcal(latestStep?.calories);
  const dailyCalories = canonicalDailyCalories(deviceKcal, workout.totalCaloriesBurned);
  const caloriesTargetJson =
    typeof caloriesTarget?.toJSON === 'function' ? caloriesTarget.toJSON() : caloriesTarget;
  const dailyTarget = Number(caloriesTargetJson?.dailyTarget) || 2000;
  const calories = { current: dailyCalories, dailyTarget };

  let fat = latestFat;
  if (!bodyFatValue(latestFat?.bodyFat) && bodyFatValue(latestBodyStatus?.bodyFat)) {
    fat = {
      ...(latestFat?.toJSON?.() || latestFat || {}),
      bodyFat: latestBodyStatus.bodyFat,
      age: latestBodyStatus.age,
      gender: latestBodyStatus.gender,
      height: latestBodyStatus.height,
      weight: latestBodyStatus.weight,
    };
  }

  return {
    weight: latestWeight,
    water: todayWater,
    mood: latestMood,
    temperature: todayTemperature,
    fat,
    bmi: latestBmi,
    bodyStatus: latestBodyStatus,
    step: latestStep,
    sleep: todaySleep,
    workout,
    heartRate: todayHeartRate,
    calories,
    caloriesTarget: {
      ...(caloriesTargetJson || {}),
      currentCalories: dailyCalories,
      dailyTarget,
      remainingCalories: Math.max(0, dailyTarget - dailyCalories),
      progressDisplay: `${dailyCalories}/${dailyTarget}`,
    },
  };
};

/**
 * Add weight entry
 * @param {ObjectId} userId
 * @param {Object} weightData
 * @returns {Promise<Object>}
 */
const addWeightEntry = async (userId, weightData) => {
  return WeightTracker.create({ userId, ...applyClientDate(weightData) });
};

/**
 * Add water entry with enhanced functionality
 * @param {ObjectId} userId
 * @param {Object} waterData
 * @returns {Promise<Object>}
 */
const addWaterEntry = async (userId, waterData) => {
  const { start: dayStart, end: dayEnd, lookupStart } = dayRange(waterData.date);
  
  // Find or create this day's water tracker
  let waterTracker = await WaterTracker.findOne({ 
    userId, 
    date: { 
      $gte: lookupStart, 
      $lt: dayEnd 
    } 
  });

  if (!waterTracker) {
    waterTracker = await WaterTracker.create({
      userId,
      date: dayStart,
      targetMl: 2000, // default target
      targetGlasses: 8,
      intakeTimeline: [],
      totalIntake: 0,
      status: 'Dehydrated',
      weeklySummary: []
    });
  }

  // Add new intake event
  const currentTime = new Date();
  const timeString = currentTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  const intakeEvent = {
    amountMl: waterData.amountMl,
    time: timeString
  };

  waterTracker.intakeTimeline.push(intakeEvent);
  waterTracker.totalIntake += waterData.amountMl;

  // Update hydration status based on target
  const percentage = (waterTracker.totalIntake / waterTracker.targetMl) * 100;
  if (percentage >= 100) {
    waterTracker.status = 'Hydrated';
  } else if (percentage >= 75) {
    waterTracker.status = 'Mildly dehydrated';
  } else {
    waterTracker.status = 'Dehydrated';
  }

  // Update weekly summary
  const weekStart = new Date(dayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
  
  const existingWeekEntry = waterTracker.weeklySummary.find(
    entry => entry.date.getTime() === dayStart.getTime()
  );

  if (existingWeekEntry) {
    existingWeekEntry.totalMl = waterTracker.totalIntake;
  } else {
    waterTracker.weeklySummary.push({
      date: dayStart,
      totalMl: waterTracker.totalIntake
    });
  }

  // Calculate weekly statistics
  if (waterTracker.weeklySummary.length > 0) {
    const totalWeeklyIntake = waterTracker.weeklySummary.reduce((sum, entry) => sum + entry.totalMl, 0);
    const daysWithData = waterTracker.weeklySummary.length;
    waterTracker.dailyAverage = Math.round(totalWeeklyIntake / daysWithData);
    waterTracker.bestDay = Math.max(...waterTracker.weeklySummary.map(entry => entry.totalMl));
    
    // Calculate streak (consecutive days with water intake)
    let streak = 0;
    const sortedEntries = waterTracker.weeklySummary
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    for (const entry of sortedEntries) {
      if (entry.totalMl > 0) {
        streak++;
      } else {
        break;
      }
    }
    waterTracker.streak = streak;
  }

  await waterTracker.save();
  return waterTracker;
};

/**
 * Update water target/goal
 * @param {ObjectId} userId
 * @param {Object} targetData
 * @returns {Promise<Object>}
 */
const updateWaterTarget = async (userId, targetData) => {
  const { start, end, lookupStart } = todayRange();
  
  let waterTracker = await WaterTracker.findOne({ 
    userId, 
    date: { 
      $gte: lookupStart, 
      $lt: end,
    } 
  }).sort({ date: -1 });

  if (!waterTracker) {
    // Create new water tracker for today
    waterTracker = await WaterTracker.create({
      userId,
      date: start,
      targetMl: targetData.targetMl || 2000,
      targetGlasses: targetData.targetGlasses || 8,
      intakeTimeline: [],
      totalIntake: 0,
      status: 'Dehydrated',
      weeklySummary: []
    });
  } else {
    // Update existing tracker
    if (targetData.targetMl) waterTracker.targetMl = targetData.targetMl;
    if (targetData.targetGlasses) waterTracker.targetGlasses = targetData.targetGlasses;
    
    // Recalculate status
    const percentage = (waterTracker.totalIntake / waterTracker.targetMl) * 100;
    if (percentage >= 100) {
      waterTracker.status = 'Hydrated';
    } else if (percentage >= 75) {
      waterTracker.status = 'Mildly dehydrated';
    } else {
      waterTracker.status = 'Dehydrated';
    }
    
    await waterTracker.save();
  }

  return waterTracker;
};

/**
 * Get today's water data
 * @param {ObjectId} userId
 * @returns {Promise<Object>}
 */
const getTodayWaterData = async (userId) => {
  const { start, end, lookupStart } = todayRange();
  
  let waterTracker = await WaterTracker.findOne({ 
    userId, 
    date: { 
      $gte: lookupStart, 
      $lt: end,
    } 
  }).sort({ date: -1 });

  if (!waterTracker) {
    waterTracker = await WaterTracker.create({
      userId,
      date: start,
      targetMl: 2000,
      targetGlasses: 8,
      intakeTimeline: [],
      totalIntake: 0,
      status: 'Dehydrated',
      weeklySummary: []
    });
  }

  return waterTracker;
};

/**
 * Get weekly water summary
 * @param {ObjectId} userId
 * @param {number} days - number of days to look back (default 7)
 * @returns {Promise<Object>}
 */
const getWeeklyWaterSummary = async (userId, days = 7) => {
  const { startKey, endKey, lookupStart, end } = lastNDaysRange(days);

  const weeklyData = await WaterTracker.find({
    userId,
    date: { $gte: lookupStart, $lt: end },
  }).sort({ date: 1 });

  const totalDays = weeklyData.length;
  const totalIntake = weeklyData.reduce((sum, day) => sum + day.totalIntake, 0);
  const dailyAverage = totalDays > 0 ? Math.round(totalIntake / totalDays) : 0;
  const bestDay = Math.max(...weeklyData.map((day) => day.totalIntake), 0);

  const byKey = {};
  weeklyData.forEach((day) => {
    byKey[dateKeyFromStored(day.date)] = day;
  });

  let streak = 0;
  for (let i = 0; i < days; i += 1) {
    const key = shiftDateKey(endKey, -i);
    const dayData = byKey[key];
    if (dayData && dayData.totalIntake > 0) {
      streak += 1;
    } else {
      break;
    }
  }

  const chartData = weeklyData.map((day) => ({
    date: dateKeyFromStored(day.date),
    totalMl: day.totalIntake,
    targetMl: day.targetMl,
    status: day.status,
  }));

  return {
    period: `${startKey} - ${endKey}`,
    totalDays,
    dailyAverage,
    bestDay,
    streak,
    chartData,
    summary: {
      totalIntake,
      averagePerDay: dailyAverage,
      bestDay,
      currentStreak: streak,
    },
  };
};

/**
 * Delete one water intake event from today's timeline.
 * Prefers amountMl + time when time is sent so duplicate 250ml sips delete the right row.
 *
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @param {import('mongoose').Types.ObjectId|string} trackerId - water tracker ID
 * @param {number} amountMl - amount to remove
 * @param {string} [time] - optional clock string from the timeline row
 * @returns {Promise<Object>}
 */
const deleteWaterIntake = async (userId, trackerId, amountMl, time) => {
  const waterTracker = await WaterTracker.findOne({
    _id: trackerId,
    userId,
  });

  if (!waterTracker) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Water tracker not found');
  }

  let eventIndex = -1;
  if (time) {
    eventIndex = waterTracker.intakeTimeline.findIndex(
      (event) => event.amountMl === amountMl && event.time === time
    );
  }
  if (eventIndex === -1) {
    eventIndex = waterTracker.intakeTimeline.findIndex(
      (event) => event.amountMl === amountMl
    );
  }

  if (eventIndex === -1) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Water intake event not found');
  }

  const removedEvent = waterTracker.intakeTimeline.splice(eventIndex, 1)[0];
  waterTracker.totalIntake = Math.max(0, waterTracker.totalIntake - removedEvent.amountMl);

  const percentage = waterTracker.targetMl
    ? (waterTracker.totalIntake / waterTracker.targetMl) * 100
    : 0;
  if (percentage >= 100) {
    waterTracker.status = 'Hydrated';
  } else if (percentage >= 75) {
    waterTracker.status = 'Mildly dehydrated';
  } else {
    waterTracker.status = 'Dehydrated';
  }

  await waterTracker.save();
  return waterTracker;
};

/**
 * Add mood entry
 * @param {ObjectId} userId
 * @param {Object} moodData
 * @returns {Promise<Object>}
 */
const addMoodEntry = async (userId, moodData) => {
  const processedMoodData = { ...moodData };
  if (moodData.note && !moodData.comments) {
    processedMoodData.comments = moodData.note;
    delete processedMoodData.note;
  }
  if (processedMoodData.date) {
    const { start } = dayRange(processedMoodData.date);
    const now = new Date();
    start.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    processedMoodData.createdAt = start;
    processedMoodData.updatedAt = start;
    delete processedMoodData.date;
  }
  return Mood.create({ userId, ...processedMoodData });
};

/**
 * Add temperature entry
 * @param {ObjectId} userId
 * @param {Object} temperatureData
 * @returns {Promise<Object>}
 */
const addTemperatureEntry = async (userId, temperatureData) => {
  return TemperatureTracker.create({ userId, ...applyClientDate(temperatureData) });
};

/**
 * Add BMI entry
 * @param {ObjectId} userId
 * @param {Object} bmiData
 * @returns {Promise<Object>}
 */
const addBmiEntry = async (userId, bmiData) => {
  return BmiTracker.create({ userId, ...applyClientDate(bmiData) });
};

/**
 * Add body status entry
 * @param {ObjectId} userId
 * @param {Object} bodyStatusData
 * @returns {Promise<Object>}
 */
const addBodyStatusEntry = async (userId, bodyStatusData) => {
  const entry = await BodyStatus.create({
    userId,
    ...canonicalizeBodyStatus(bodyStatusData),
  });
  await syncFatFromBodyStatus(userId, entry);
  return entry;
};

/**
 * Add step entry
 * @param {ObjectId} userId
 * @param {Object} stepData
 * @returns {Promise<Object>}
 */
const addStepEntry = async (userId, stepData) => {
  return StepTracker.create({ userId, ...stepData });
};

/**
 * Add sleep entry
 * @param {ObjectId} userId
 * @param {Object} sleepData
 * @returns {Promise<Object>}
 */
const addSleepEntry = async (userId, sleepData) => {
  const dated = applyClientDate(sleepData, 'date');
  return SleepTracker.create({ userId, ...normalizeSleepEntry(dated) });
};

/**
 * Add workout entry
 * @param {ObjectId} userId
 * @param {Object} workoutData
 * @returns {Promise<Object>}
 */
const addWorkoutEntry = async (userId, workoutData) => {
  const { start: dayStart } = dayRange(workoutData.date);
  const workoutTracker = await getOrMergeWorkoutDay(userId, workoutData.date);

  workoutTracker.workoutEntries.push({
    workoutType: workoutData.workoutType,
    intensity: workoutData.intensity,
    distance: workoutData.distance,
    duration: workoutData.duration,
    calories: workoutData.calories,
    date: dayStart,
    notes: workoutData.notes,
  });
  workoutTracker.markModified('workoutEntries');
  recalcWorkoutDayTotals(workoutTracker);

  const existingWeekEntry = (workoutTracker.weeklySummary || []).find(
    (entry) => new Date(entry.date).getTime() === dayStart.getTime()
  );
  if (existingWeekEntry) {
    existingWeekEntry.totalTime = workoutTracker.totalWorkoutTime;
    existingWeekEntry.totalCalories = workoutTracker.totalCaloriesBurned;
    existingWeekEntry.workoutCount = workoutTracker.workoutEntries.length;
  } else {
    workoutTracker.weeklySummary.push({
      date: dayStart,
      totalTime: workoutTracker.totalWorkoutTime,
      totalCalories: workoutTracker.totalCaloriesBurned,
      workoutCount: workoutTracker.workoutEntries.length,
    });
  }

  await workoutTracker.save();
  await syncWorkoutCaloriesForDate(userId, workoutData.date);
  return workoutTracker;
};

/**
 * Get workout history
 * @param {ObjectId} userId
 * @param {number} days
 * @returns {Promise<Array>}
 */
const getWorkoutHistory = async (userId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const docs = await WorkoutTracker.find({
    userId,
    date: { $gte: startDate }
  }).sort({ date: -1 });
  return ensureWorkoutEntryIds(docs);
};

/**
 * Get workout by type
 * @param {ObjectId} userId
 * @param {string} workoutType
 * @param {number} days
 * @returns {Promise<Array>}
 */
const getWorkoutByType = async (userId, workoutType, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const query = {
    userId,
    date: { $gte: startDate }
  };

  if (workoutType) {
    query['workoutEntries.workoutType'] = workoutType;
  }

  const docs = await WorkoutTracker.find(query).sort({ date: -1 });
  return ensureWorkoutEntryIds(docs);
};

/**
 * Get workout summary
 * @param {ObjectId} userId
 * @param {string} period
 * @param {number} days
 * @returns {Promise<Object>}
 */
const getWorkoutSummary = async (userId, period = 'weekly', days = 7) => {
  const { startKey, endKey, lookupStart, end } = lastNDaysRange(days);

  const workoutData = await WorkoutTracker.find({
    userId,
    date: { $gte: lookupStart, $lt: end },
  }).sort({ date: 1 });

  // Calculate summary statistics
  const totalWorkoutTime = workoutData.reduce((sum, day) => sum + day.totalWorkoutTime, 0);
  const totalCaloriesBurned = workoutData.reduce((sum, day) => sum + day.totalCaloriesBurned, 0);
  const totalWorkouts = workoutData.reduce((sum, day) => sum + day.workoutEntries.length, 0);

  // Calculate workout type breakdown
  const workoutTypeBreakdown = {};
  workoutData.forEach(day => {
    day.workoutEntries.forEach(entry => {
      if (!workoutTypeBreakdown[entry.workoutType]) {
        workoutTypeBreakdown[entry.workoutType] = {
          totalTime: 0,
          totalCalories: 0,
          workoutCount: 0
        };
      }
      workoutTypeBreakdown[entry.workoutType].totalTime += (entry.duration?.value || 0);
      workoutTypeBreakdown[entry.workoutType].totalCalories += entry.calories;
      workoutTypeBreakdown[entry.workoutType].workoutCount += 1;
    });
  });

  // Format data for charts
  const chartData = workoutData.map((day) => ({
    date: dateKeyFromStored(day.date),
    totalTime: day.totalWorkoutTime,
    totalCalories: day.totalCaloriesBurned,
    workoutCount: day.workoutEntries.length,
  }));

  return {
    period: `${startKey} - ${endKey}`,
    totalWorkoutTime: Math.round(totalWorkoutTime * 100) / 100,
    totalCaloriesBurned,
    totalWorkouts,
    dailyAverage: workoutData.length > 0 ? Math.round((totalWorkoutTime / workoutData.length) * 100) / 100 : 0,
    workoutTypeBreakdown,
    chartData,
    summary: {
      totalTime: Math.round(totalWorkoutTime * 100) / 100,
      totalCalories: totalCaloriesBurned,
      averagePerDay: workoutData.length > 0 ? Math.round((totalWorkoutTime / workoutData.length) * 100) / 100 : 0
    }
  };
};

/**
 * Update workout entry
 * @param {ObjectId} userId
 * @param {ObjectId} entryId
 * @param {Object} updateData
 * @returns {Promise<Object>}
 */
const updateWorkoutEntry = async (userId, entryId, updateData) => {
  const workoutTracker = await WorkoutTracker.findOne({
    userId,
    'workoutEntries._id': entryId
  });

  if (!workoutTracker) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Workout entry not found');
  }

  // Find the specific entry
  const entryIndex = workoutTracker.workoutEntries.findIndex(
    (entry) => entry._id && entry._id.toString() === entryId
  );

  if (entryIndex === -1) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Workout entry not found');
  }

  Object.assign(workoutTracker.workoutEntries[entryIndex], updateData);
  workoutTracker.markModified('workoutEntries');
  recalcWorkoutDayTotals(workoutTracker);

  await workoutTracker.save();
  await syncWorkoutCaloriesForDate(userId, workoutTracker.date);
  return workoutTracker;
};

/**
 * Delete workout entry
 * @param {ObjectId} userId
 * @param {ObjectId} entryId
 * @returns {Promise<Object>}
 */
const deleteWorkoutEntry = async (userId, entryId) => {
  const workoutTracker = await WorkoutTracker.findOne({
    userId,
    'workoutEntries._id': entryId
  });

  if (!workoutTracker) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Workout entry not found');
  }

  // Find and remove the specific entry
  const entryIndex = workoutTracker.workoutEntries.findIndex(
    (entry) => entry._id && entry._id.toString() === entryId
  );

  if (entryIndex === -1) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Workout entry not found');
  }

  const removedEntry = workoutTracker.workoutEntries.splice(entryIndex, 1)[0];
  workoutTracker.markModified('workoutEntries');
  recalcWorkoutDayTotals(workoutTracker);

  await workoutTracker.save();
  await syncWorkoutCaloriesForDate(userId, workoutTracker.date);
  return workoutTracker;
};

/**
 * Update tracker entry
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @param {string} trackerType
 * @param {import('mongoose').Types.ObjectId|string} entryId
 * @param {Object} updateData
 * @returns {Promise<Object>}
 */
const updateTrackerEntry = async (userId, trackerType, entryId, updateData) => {
  const model = TRACKER_MODELS[trackerType];
  if (!model) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid tracker type');
  }

  const entry = await model.findOne({ _id: entryId, userId });
  if (!entry) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Entry not found');
  }

  if (trackerType === 'step') {
    assertManualAllowed(entry);
  }

  entry.set(normalizeTrackerUpdate(trackerType, updateData));
  await entry.save();
  return entry;
};

/**
 * Delete an entire tracker document (not a nested water sip).
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @param {string} trackerType
 * @param {import('mongoose').Types.ObjectId|string} entryId
 * @returns {Promise<void>}
 */
const deleteTrackerEntry = async (userId, trackerType, entryId) => {
  const model = TRACKER_MODELS[trackerType];
  if (!model) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid tracker type');
  }

  const entry = await model.findOneAndDelete({ _id: entryId, userId });
  if (!entry) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Entry not found');
  }
};

/**
 * Get hydration status based on current intake and target
 * @param {ObjectId} userId
 * @returns {Promise<Object>}
 */
const getHydrationStatus = async (userId) => {
  const { start, end, lookupStart } = todayRange();
  
  let waterTracker = await WaterTracker.findOne({ 
    userId, 
    date: { 
      $gte: lookupStart, 
      $lt: end,
    } 
  }).sort({ date: -1 });

  if (!waterTracker) {
    waterTracker = await WaterTracker.create({
      userId,
      date: start,
      targetMl: 2000,
      targetGlasses: 8,
      intakeTimeline: [],
      totalIntake: 0,
      status: 'Dehydrated',
      weeklySummary: []
    });
  }

  // Calculate hydration percentage
  const percentage = (waterTracker.totalIntake / waterTracker.targetMl) * 100;
  
  // Determine status based on percentage ranges
  let status;
  if (percentage >= 100) {
    status = 'Hydrated';
  } else if (percentage >= 75) {
    status = 'Mildly dehydrated';
  } else {
    status = 'Dehydrated';
  }

  // Update status if it has changed
  if (waterTracker.status !== status) {
    waterTracker.status = status;
    await waterTracker.save();
  }

  return {
    currentIntake: waterTracker.totalIntake,
    targetMl: waterTracker.targetMl,
    targetGlasses: waterTracker.targetGlasses,
    percentage: Math.round(percentage * 100) / 100,
    status: status,
    remainingMl: Math.max(0, waterTracker.targetMl - waterTracker.totalIntake),
    remainingGlasses: Math.max(0, Math.ceil((waterTracker.targetMl - waterTracker.totalIntake) / 250)), // Assuming 250ml per glass
    intakeTimeline: waterTracker.intakeTimeline,
    date: waterTracker.date
  };
};

/**
 * Create or get today's calories target
 * @param {ObjectId} userId
 * @param {Object} targetData
 * @returns {Promise<Object>}
 */
const createCaloriesTarget = async (userId, targetData) => {
  const { start } = todayRange();
  let caloriesTarget = await CaloriesTarget.getTodayByUserId(userId);

  if (!caloriesTarget) {
    caloriesTarget = await CaloriesTarget.create({
      userId,
      date: start,
      dailyTarget: targetData.dailyTarget || 2000,
      currentCalories: 0,
      caloriesBreakdown: {
        workout: 0,
        steps: 0,
        other: 0,
      },
      weeklySummary: [],
    });
  } else if (targetData.dailyTarget) {
    caloriesTarget.dailyTarget = targetData.dailyTarget;
    await caloriesTarget.save();
  }

  return caloriesTarget;
};

/**
 * Update calories target
 * @param {ObjectId} userId
 * @param {Object} targetData
 * @returns {Promise<Object>}
 */
const updateCaloriesTarget = async (userId, targetData) => {
  const { start } = todayRange();
  let caloriesTarget = await CaloriesTarget.getTodayByUserId(userId);

  if (!caloriesTarget) {
    caloriesTarget = await CaloriesTarget.create({
      userId,
      date: start,
      dailyTarget: targetData.dailyTarget,
      currentCalories: 0,
      caloriesBreakdown: {
        workout: 0,
        steps: 0,
        other: 0,
      },
      weeklySummary: [],
    });
  } else {
    caloriesTarget.dailyTarget = targetData.dailyTarget;
    await caloriesTarget.save();
  }

  return caloriesTarget;
};

/**
 * Get calories target and progress
 * @param {ObjectId} userId
 * @returns {Promise<Object>}
 */
const getCaloriesTarget = async (userId) => {
  await syncWorkoutCaloriesForDate(userId);
  let caloriesTarget = await CaloriesTarget.getTodayByUserId(userId);
  if (!caloriesTarget) {
    const { start } = todayRange();
    caloriesTarget = await CaloriesTarget.create({
      userId,
      date: start,
      dailyTarget: 2000,
      currentCalories: 0,
      caloriesBreakdown: {
        workout: 0,
        steps: 0,
        other: 0,
      },
      weeklySummary: [],
    });
  }

  const remainingCalories = Math.max(
    0,
    caloriesTarget.dailyTarget - caloriesTarget.currentCalories
  );

  return {
    ...caloriesTarget.toJSON(),
    remainingCalories,
    progressDisplay: `${caloriesTarget.currentCalories}/${caloriesTarget.dailyTarget}`,
  };
};

/**
 * Update calories from different sources (called by other services)
 * @param {ObjectId} userId
 * @param {string} source - 'workout', 'steps', or 'other'
 * @param {number} calories
 * @returns {Promise<Object>}
 */
const updateCaloriesFromSource = async (userId, source, calories) => {
  const { start } = todayRange();
  let caloriesTarget = await CaloriesTarget.getTodayByUserId(userId);

  if (!caloriesTarget) {
    caloriesTarget = await CaloriesTarget.create({
      userId,
      date: start,
      dailyTarget: 2000,
      currentCalories: 0,
      caloriesBreakdown: {
        workout: 0,
        steps: 0,
        other: 0,
      },
      weeklySummary: [],
    });
  }

  await caloriesTarget.updateCalories(source, calories);
  return caloriesTarget;
};

/**
 * Upsert today's activity (steps + active calories) into the StepTracker
 * collection, keyed by (userId, day). Repeated syncs on the same day update
 * the same record instead of creating duplicates.
 *
 * @param {string} userId
 * @param {{ date?: string, steps?: {value:number}, activeCalories?: {value:number, unit?:string}, distance?: object, activeTime?: number, source?: string, notes?: string }} data
 */
const upsertActivityEntry = async (userId, data) => {
  const { start, end, lookupStart } = dayRange(data.date);
  const existing = await StepTracker.findOne({
    userId,
    isActive: true,
    measurementDate: { $gte: lookupStart, $lt: end },
  }).sort({ measurementDate: -1 });

  const set = buildActivitySet(existing, data, { userId, start });

  if (data.goal != null) {
    set.goal = data.goal;
  } else if (!existing?.goal) {
    const previous = await StepTracker.findOne({ userId, isActive: true }).sort({
      measurementDate: -1,
    });
    if (previous?.goal) set.goal = previous.goal;
  }

  const doc = await StepTracker.findOneAndUpdate(
    { userId, measurementDate: { $gte: lookupStart, $lt: end } },
    { $set: set },
    { new: true, upsert: true, setDefaultsOnInsert: true, sort: { measurementDate: -1 } }
  );
  try {
    await syncWorkoutCaloriesForDate(userId, data.date);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      err?.message || 'Failed to recompute daily calories after activity save',
    );
  }
  return doc;
};

/**
 * Upsert today's daily step goal. Creates today's row if none exists yet
 * so a goal-only update does not require a prior step log.
 *
 * @param {string} userId
 * @param {number} goal
 * @returns {Promise<import('mongoose').Document>}
 */
const updateStepGoal = async (userId, goal) => {
  const { start, end, lookupStart } = dayRange();
  return StepTracker.findOneAndUpdate(
    { userId, measurementDate: { $gte: lookupStart, $lt: end } },
    {
      $set: { userId, measurementDate: start, isActive: true, goal },
      $setOnInsert: { steps: 0, source: 'manual' },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true, sort: { measurementDate: -1 } }
  );
};

/**
 * Get daily activity history (steps + active calories) for the last N days.
 */
const getActivityHistory = async (userId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return StepTracker.find({
    userId,
    measurementDate: { $gte: startDate },
    isActive: true,
  }).sort({ measurementDate: -1 });
};

/**
 * Upsert today's heart-rate summary, keyed by (userId, day).
 *
 * @param {string} userId
 * @param {{ date?: string, summary: {avg?:number,min?:number,max?:number,latest?:number,unit?:string}, measuredAt?: string, source?: string, notes?: string }} data
 */
const upsertHeartRateEntry = async (userId, data) => {
  const { start, end, lookupStart } = dayRange(data.date);
  const incomingSource = data.source || 'manual';
  const existing = await HeartRateTracker.findOne({
    userId,
    measurementDate: { $gte: lookupStart, $lt: end },
  }).sort({ measurementDate: -1 });

  // Device sync must not replace a same-day manual reading.
  if (existing && existing.source === 'manual' && incomingSource !== 'manual') {
    return existing;
  }

  const set = { userId, measurementDate: start, isActive: true };

  if (data.summary) set.summary = data.summary;
  if (data.measuredAt) set.measuredAt = new Date(data.measuredAt);
  if (data.source) set.source = data.source;
  if (data.notes) set.notes = data.notes;

  return HeartRateTracker.findOneAndUpdate(
    { userId, measurementDate: { $gte: lookupStart, $lt: end } },
    { $set: set },
    { new: true, upsert: true, setDefaultsOnInsert: true, sort: { measurementDate: -1 } }
  );
};

/**
 * Get daily heart-rate history for the last N days.
 */
const getHeartRateHistory = async (userId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return HeartRateTracker.find({
    userId,
    measurementDate: { $gte: startDate },
    isActive: true,
  }).sort({ measurementDate: -1 });
};

export {
  createInitialTrackers,
  updateTrackersFromProfile,
  upsertActivityEntry,
  getActivityHistory,
  upsertHeartRateEntry,
  getHeartRateHistory,
  getWeightHistory,
  getWeightById,
  getWaterHistory,
  getWaterById,
  getMoodHistory,
  getTemperatureHistory,
  getFatHistory,
  getFatSummary,
  getBmiHistory,
  getBodyStatusHistory,
  getBodyStatusById,
  getStepHistory,
  getSleepHistory,
  getSleepById,
  getDashboardData,
  addWeightEntry,
  addWaterEntry,
  updateWaterTarget,
  updateStepGoal,
  getTodayWaterData,
  getWeeklyWaterSummary,
  deleteWaterIntake,
  addMoodEntry,
  addTemperatureEntry,
  addFatEntry,
  updateFatGoal,
  addBmiEntry,
  addBodyStatusEntry,
  addStepEntry,
  addSleepEntry,
  addWorkoutEntry,
  getWorkoutHistory,
  getWorkoutByType,
  getWorkoutSummary,
  updateWorkoutEntry,
  deleteWorkoutEntry,
  updateTrackerEntry,
  deleteTrackerEntry,
  getHydrationStatus,
  createCaloriesTarget,
  updateCaloriesTarget,
  getCaloriesTarget,
  updateCaloriesFromSource
}; 