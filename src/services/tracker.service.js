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

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Pad before UTC midnight so IST local-midnight docs (`T18:30:00.000Z`) still match. */
const LEGACY_LOCAL_MIDNIGHT_PAD_MS = 14 * 60 * 60 * 1000;

/**
 * Resolve a YYYY-MM-DD string to that calendar day's [start, end) in UTC.
 * `new Date("YYYY-MM-DD")` is UTC midnight; `setHours(0,0,0,0)` on an IST
 * server then rolls it back to the previous UTC date — Sep 2 became Sep 1.
 * @param {string|Date} [date]
 * @returns {{ start: Date, end: Date, lookupStart: Date }}
 */
const dayRange = (date) => {
  if (typeof date === 'string') {
    const m = date.trim().match(DATE_ONLY);
    if (m) {
      const y = Number(m[1]);
      const month = Number(m[2]) - 1;
      const d = Number(m[3]);
      const start = new Date(Date.UTC(y, month, d));
      const end = new Date(Date.UTC(y, month, d + 1));
      return {
        start,
        end,
        lookupStart: new Date(start.getTime() - LEGACY_LOCAL_MIDNIGHT_PAD_MS),
      };
    }
  }
  const base = date ? new Date(date) : new Date();
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    start,
    end,
    lookupStart: new Date(start.getTime() - LEGACY_LOCAL_MIDNIGHT_PAD_MS),
  };
};

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

    // Create new BMI Tracker entry if height, weight, age, or gender is provided
    if (profileData.height || profileData.weight || profileData.age || profileData.gender) {
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

    // Create new Fat Tracker entry if height, weight, age, or gender is provided
    if (profileData.height || profileData.weight || profileData.age || profileData.gender) {
      const fatData = {};
      if (profileData.height) fatData.height = { value: parseFloat(profileData.height), unit: 'cm' };
      if (profileData.weight) fatData.weight = { value: parseFloat(profileData.weight), unit: 'kg' };
      if (profileData.age) fatData.age = parseInt(profileData.age);
      const normalizedGender = normalizeGender(profileData.gender);
      if (normalizedGender) fatData.gender = normalizedGender;
      
      updates.push(
        FatTracker.create({ userId, ...fatData })
      );
    }

    // Create new Body Status entry if height, weight, age, or gender is provided
     if (profileData.height || profileData.weight || profileData.age || profileData.gender) {
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
 * Get fat tracker history
 * @param {ObjectId} userId
 * @param {number} days
 * @returns {Promise<Array>}
 */
const getFatHistory = async (userId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return FatTracker.find({
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
 * Get body status history
 * @param {ObjectId} userId
 * @param {number} days
 * @returns {Promise<Array>}
 */
const getBodyStatusHistory = async (userId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return BodyStatus.find({
    userId,
    measurementDate: { $gte: startDate },
    isActive: true
  }).sort({ measurementDate: -1 });
};

/**
 * Get body status entry by ID
 * @param {ObjectId} userId
 * @param {ObjectId} entryId
 * @returns {Promise<Object>}
 */
const getBodyStatusById = async (userId, entryId) => {
  const entry = await BodyStatus.findOne({ _id: entryId, userId });
  if (!entry) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Body status entry not found');
  }
  return entry;
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
 * `step` is today's activity row only (not the latest historical log).
 * @param {ObjectId} userId
 * @returns {Promise<Object>}
 */
const getDashboardData = async (userId) => {
  const { end: todayEnd, lookupStart: todayLookupStart } = dayRange();
  const [
    latestWeight,
    latestWater,
    latestMood,
    latestTemperature,
    latestFat,
    latestBmi,
    latestBodyStatus,
    latestStep,
    latestSleep,
    latestWorkout,
    latestHeartRate,
    caloriesTarget
  ] = await Promise.all([
    WeightTracker.getLatestByUserId(userId),
    WaterTracker.findOne({ userId }).sort({ date: -1 }),
    Mood.findOne({ userId }).sort({ createdAt: -1 }),
    TemperatureTracker.getLatestByUserId(userId),
    FatTracker.getLatestByUserId(userId),
    BmiTracker.getLatestByUserId(userId),
    BodyStatus.getLatestByUserId(userId),
    StepTracker.findOne({
      userId,
      isActive: true,
      measurementDate: { $gte: todayLookupStart, $lt: todayEnd },
    }).sort({ measurementDate: -1 }),
    SleepTracker.findOne({ userId }).sort({ date: -1 }),
    WorkoutTracker.findOne({ userId }).sort({ date: -1 }),
    HeartRateTracker.getLatestByUserId(userId),
    getCaloriesTarget(userId)
  ]);

  return {
    weight: latestWeight,
    water: latestWater,
    mood: latestMood,
    temperature: latestTemperature,
    fat: latestFat,
    bmi: latestBmi,
    bodyStatus: latestBodyStatus,
    step: latestStep,
    sleep: latestSleep,
    workout: latestWorkout,
    heartRate: latestHeartRate,
    caloriesTarget
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let waterTracker = await WaterTracker.findOne({ 
    userId, 
    date: { 
      $gte: today, 
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
    } 
  });

  if (!waterTracker) {
    // Create new water tracker for today
    waterTracker = await WaterTracker.create({
      userId,
      date: today,
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let waterTracker = await WaterTracker.findOne({ 
    userId, 
    date: { 
      $gte: today, 
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
    } 
  });

  if (!waterTracker) {
    // Create default water tracker for today
    waterTracker = await WaterTracker.create({
      userId,
      date: today,
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
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const weeklyData = await WaterTracker.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });

  // Calculate statistics
  const totalDays = weeklyData.length;
  const totalIntake = weeklyData.reduce((sum, day) => sum + day.totalIntake, 0);
  const dailyAverage = totalDays > 0 ? Math.round(totalIntake / totalDays) : 0;
  const bestDay = Math.max(...weeklyData.map(day => day.totalIntake), 0);

  // Calculate streak (consecutive days with water intake)
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < days; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    
    const dayData = weeklyData.find(day => 
      day.date.getTime() === checkDate.getTime()
    );
    
    if (dayData && dayData.totalIntake > 0) {
      streak++;
    } else {
      break;
    }
  }

  // Format data for charts
  const chartData = weeklyData.map(day => ({
    date: day.date.toISOString().split('T')[0],
    totalMl: day.totalIntake,
    targetMl: day.targetMl,
    status: day.status
  }));

  return {
    period: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
    totalDays,
    dailyAverage,
    bestDay,
    streak,
    chartData,
    summary: {
      totalIntake,
      averagePerDay: dailyAverage,
      bestDay,
      currentStreak: streak
    }
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
 * Add fat entry
 * @param {ObjectId} userId
 * @param {Object} fatData
 * @returns {Promise<Object>}
 */
const addFatEntry = async (userId, fatData) => {
  return FatTracker.create({ userId, ...applyClientDate(fatData) });
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
  return BodyStatus.create({ userId, ...bodyStatusData });
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
  const { start: dayStart, end: dayEnd, lookupStart } = dayRange(workoutData.date);
  
  let workoutTracker = await WorkoutTracker.findOne({ 
    userId, 
    date: { 
      $gte: lookupStart, 
      $lt: dayEnd 
    } 
  });

  if (!workoutTracker) {
    workoutTracker = await WorkoutTracker.create({
      userId,
      date: dayStart,
      workoutEntries: [],
      totalWorkoutTime: 0,
      totalCaloriesBurned: 0,
      weeklySummary: [],
      workoutTypeSummary: [],
      totalWeeklyTime: 0,
      totalWeeklyCalories: 0
    });
  }

  // Add new workout entry
  const workoutEntry = {
    workoutType: workoutData.workoutType,
    intensity: workoutData.intensity,
    distance: workoutData.distance,
    duration: workoutData.duration,
    calories: workoutData.calories,
    date: dayStart,
    notes: workoutData.notes
  };

  workoutTracker.workoutEntries.push(workoutEntry);
  
  // Update daily totals
  workoutTracker.totalWorkoutTime += (workoutData.duration?.value || 0);
  workoutTracker.totalCaloriesBurned += workoutData.calories;

  // Update weekly summary
  const weekStart = new Date(dayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
  
  const existingWeekEntry = workoutTracker.weeklySummary.find(
    entry => entry.date.getTime() === dayStart.getTime()
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
      workoutCount: workoutTracker.workoutEntries.length
    });
  }

  // Update workout type summary
  const existingTypeSummary = workoutTracker.workoutTypeSummary.find(
    summary => summary.workoutType === workoutData.workoutType
  );

  if (existingTypeSummary) {
    // Update existing type summary
    existingTypeSummary.totalTime += (workoutData.duration?.value || 0);
    existingTypeSummary.totalCalories += workoutData.calories;
    existingTypeSummary.workoutCount += 1;
    existingTypeSummary.averageTime = existingTypeSummary.totalTime / existingTypeSummary.workoutCount;
    existingTypeSummary.averageCalories = existingTypeSummary.totalCalories / existingTypeSummary.workoutCount;
  } else {
    // Add new workout type summary
    workoutTracker.workoutTypeSummary.push({
      workoutType: workoutData.workoutType,
      totalTime: workoutData.duration?.value || 0,
      totalCalories: workoutData.calories,
      workoutCount: 1,
      averageTime: workoutData.duration?.value || 0,
      averageCalories: workoutData.calories
    });
  }

  // Calculate weekly statistics
  if (workoutTracker.weeklySummary.length > 0) {
    const totalWeeklyTime = workoutTracker.weeklySummary.reduce((sum, entry) => sum + entry.totalTime, 0);
    const totalWeeklyCalories = workoutTracker.weeklySummary.reduce((sum, entry) => sum + entry.totalCalories, 0);
    const daysWithData = workoutTracker.weeklySummary.length;
    
    workoutTracker.totalWeeklyTime = totalWeeklyTime;
    workoutTracker.totalWeeklyCalories = totalWeeklyCalories;
    workoutTracker.dailyAverage = Math.round((totalWeeklyTime / daysWithData) * 100) / 100;
    workoutTracker.bestDay = Math.max(...workoutTracker.weeklySummary.map(entry => entry.totalCalories));
    
    // Calculate streak (consecutive days with workouts)
    let streak = 0;
    const sortedEntries = workoutTracker.weeklySummary
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    for (const entry of sortedEntries) {
      if (entry.totalCalories > 0) {
        streak++;
      } else {
        break;
      }
    }
    workoutTracker.streak = streak;
  }

  await workoutTracker.save();
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
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const workoutData = await WorkoutTracker.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
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
  const chartData = workoutData.map(day => ({
    date: day.date.toISOString().split('T')[0],
    totalTime: day.totalWorkoutTime,
    totalCalories: day.totalCaloriesBurned,
    workoutCount: day.workoutEntries.length
  }));

  return {
    period: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
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

  // Update the entry
  const oldEntry = workoutTracker.workoutEntries[entryIndex];
  Object.assign(workoutTracker.workoutEntries[entryIndex], updateData);
  workoutTracker.markModified('workoutEntries');

  // Recalculate totals
  workoutTracker.totalWorkoutTime = workoutTracker.workoutEntries.reduce(
    (sum, entry) => sum + (entry.duration?.value || 0), 0
  );
  workoutTracker.totalCaloriesBurned = workoutTracker.workoutEntries.reduce(
    (sum, entry) => sum + entry.calories, 0
  );

  await workoutTracker.save();
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

  // Recalculate totals
  workoutTracker.totalWorkoutTime = workoutTracker.workoutEntries.reduce(
    (sum, entry) => sum + (entry.duration?.value || 0), 0
  );
  workoutTracker.totalCaloriesBurned = workoutTracker.workoutEntries.reduce(
    (sum, entry) => sum + entry.calories, 0
  );

  await workoutTracker.save();
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let waterTracker = await WaterTracker.findOne({ 
    userId, 
    date: { 
      $gte: today, 
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
    } 
  });

  if (!waterTracker) {
    // Create default water tracker for today
    waterTracker = await WaterTracker.create({
      userId,
      date: today,
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if today's calories target already exists
  let caloriesTarget = await CaloriesTarget.getTodayByUserId(userId);
  
  if (!caloriesTarget) {
    // Create new calories target for today
    caloriesTarget = await CaloriesTarget.create({
      userId,
      date: today,
      dailyTarget: targetData.dailyTarget || 2000,
      currentCalories: 0,
      caloriesBreakdown: {
        workout: 0,
        steps: 0,
        other: 0
      },
      weeklySummary: []
    });
  } else {
    // Update existing target
    if (targetData.dailyTarget) {
      caloriesTarget.dailyTarget = targetData.dailyTarget;
      await caloriesTarget.save();
    }
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let caloriesTarget = await CaloriesTarget.getTodayByUserId(userId);
  
  if (!caloriesTarget) {
    // Create new calories target for today
    caloriesTarget = await CaloriesTarget.create({
      userId,
      date: today,
      dailyTarget: targetData.dailyTarget,
      currentCalories: 0,
      caloriesBreakdown: {
        workout: 0,
        steps: 0,
        other: 0
      },
      weeklySummary: []
    });
  } else {
    // Update existing target
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let caloriesTarget = await CaloriesTarget.getTodayByUserId(userId);
  
  if (!caloriesTarget) {
    // Create default calories target for today
    caloriesTarget = await CaloriesTarget.create({
      userId,
      date: today,
      dailyTarget: 2000, // Default globally accepted calories target
      currentCalories: 0,
      caloriesBreakdown: {
        workout: 0,
        steps: 0,
        other: 0
      },
      weeklySummary: []
    });
  }
  
  // Calculate remaining calories
  const remainingCalories = Math.max(0, caloriesTarget.dailyTarget - caloriesTarget.currentCalories);
  
  return {
    ...caloriesTarget.toJSON(),
    remainingCalories,
    progressDisplay: `${caloriesTarget.currentCalories}/${caloriesTarget.dailyTarget}`
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let caloriesTarget = await CaloriesTarget.getTodayByUserId(userId);
  
  if (!caloriesTarget) {
    // Create new calories target for today
    caloriesTarget = await CaloriesTarget.create({
      userId,
      date: today,
      dailyTarget: 2000,
      currentCalories: 0,
      caloriesBreakdown: {
        workout: 0,
        steps: 0,
        other: 0
      },
      weeklySummary: []
    });
  }
  
  // Update calories from the specific source
  await caloriesTarget.updateCalories(source, calories);
  
  return caloriesTarget;
};

/**
 * Non-negative integer from a step/calorie field.
 * @param {unknown} value
 * @returns {number}
 */
const activityCount = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * Keep the higher same-day total so Health Connect cannot wipe a manual log with 0.
 * @param {unknown} existing
 * @param {unknown} incoming
 * @returns {number}
 */
const maxActivityCount = (existing, incoming) =>
  Math.max(activityCount(existing), activityCount(incoming));

/**
 * Source after a same-day merge. Manual stays unless the device strictly raised steps.
 * @param {string|undefined} existingSource
 * @param {string} incomingSource
 * @param {number} existingSteps
 * @param {number} mergedSteps
 * @returns {string}
 */
const mergeActivitySource = (
  existingSource,
  incomingSource,
  existingSteps,
  mergedSteps
) => {
  if (incomingSource === 'manual') return 'manual';
  if (existingSource === 'manual' && mergedSteps <= existingSteps) return 'manual';
  return incomingSource || existingSource || 'manual';
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

  const incomingSource = data.source || 'manual';
  const incomingSteps =
    data.steps && data.steps.value != null ? data.steps.value : null;
  const incomingCalories =
    data.activeCalories && data.activeCalories.value != null
      ? data.activeCalories.value
      : null;

  const set = { userId, measurementDate: start, isActive: true };

  if (incomingSteps != null) {
    set.steps = maxActivityCount(existing?.steps, incomingSteps);
  }
  if (incomingCalories != null) {
    set.calories = maxActivityCount(existing?.calories, incomingCalories);
  }
  if (data.distance) set.distance = data.distance;
  if (data.activeTime != null) set.activeTime = data.activeTime;
  if (data.notes) set.notes = data.notes;

  if (data.source || existing?.source) {
    set.source = mergeActivitySource(
      existing?.source,
      incomingSource,
      activityCount(existing?.steps),
      set.steps != null ? set.steps : activityCount(existing?.steps)
    );
  }

  if (data.goal != null) {
    set.goal = data.goal;
  } else if (!existing?.goal) {
    const previous = await StepTracker.findOne({ userId, isActive: true }).sort({
      measurementDate: -1,
    });
    if (previous?.goal) set.goal = previous.goal;
  }

  return StepTracker.findOneAndUpdate(
    { userId, measurementDate: { $gte: lookupStart, $lt: end } },
    { $set: set },
    { new: true, upsert: true, setDefaultsOnInsert: true, sort: { measurementDate: -1 } }
  );
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