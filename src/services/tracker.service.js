import httpStatus from 'http-status';
import { 
  WeightTracker, 
  WaterTracker, 
  Mood, 
  TemperatureTracker, 
  FatTracker, 
  BmiTracker, 
  BodyStatus, 
  StepTracker, 
  SleepTracker,
  WorkoutTracker,
  CaloriesTarget
} from '../models/index.js';
import ApiError from '../utils/ApiError.js';

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

    // Create new BMI Tracker entry if height, weight, age, or gender is provided
    if (profileData.height || profileData.weight || profileData.age || profileData.gender) {
      const bmiData = {};
      if (profileData.height) bmiData.height = { value: parseFloat(profileData.height), unit: 'cm' };
      if (profileData.weight) bmiData.weight = { value: parseFloat(profileData.weight), unit: 'kg' };
      if (profileData.age) bmiData.age = parseInt(profileData.age);
      if (profileData.gender) bmiData.gender = profileData.gender;
      
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
      if (profileData.gender) fatData.gender = profileData.gender;
      
      updates.push(
        FatTracker.create({ userId, ...fatData })
      );
    }

    // Create new Body Status entry if height or weight is provided
     // Create new Body Status entry if height, weight, age, or gender is provided
     if (profileData.height || profileData.weight || profileData.age || profileData.gender) {
      const bodyStatusData = {};
      if (profileData.height) bodyStatusData.height = { value: parseFloat(profileData.height), unit: 'cm' };
      if (profileData.weight) bodyStatusData.weight = { value: parseFloat(profileData.weight), unit: 'kg' };
      if (profileData.age) bodyStatusData.age = parseInt(profileData.age);
      if (profileData.gender) bodyStatusData.gender = profileData.gender;
      
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
 * Get all tracker data for dashboard
 * @param {ObjectId} userId
 * @returns {Promise<Object>}
 */
const getDashboardData = async (userId) => {
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
    caloriesTarget
  ] = await Promise.all([
    WeightTracker.getLatestByUserId(userId),
    WaterTracker.findOne({ userId }).sort({ date: -1 }),
    Mood.findOne({ userId }).sort({ createdAt: -1 }),
    TemperatureTracker.getLatestByUserId(userId),
    FatTracker.getLatestByUserId(userId),
    BmiTracker.getLatestByUserId(userId),
    BodyStatus.getLatestByUserId(userId),
    StepTracker.getLatestByUserId(userId),
    SleepTracker.findOne({ userId }).sort({ date: -1 }),
    WorkoutTracker.findOne({ userId }).sort({ date: -1 }),
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
  return WeightTracker.create({ userId, ...weightData });
};

/**
 * Add water entry with enhanced functionality
 * @param {ObjectId} userId
 * @param {Object} waterData
 * @returns {Promise<Object>}
 */
const addWaterEntry = async (userId, waterData) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Find or create today's water tracker
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
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
  
  // Find or create weekly summary entry for today
  const existingWeekEntry = waterTracker.weeklySummary.find(
    entry => entry.date.getTime() === today.getTime()
  );

  if (existingWeekEntry) {
    // Update existing entry
    existingWeekEntry.totalMl = waterTracker.totalIntake;
  } else {
    // Add new weekly summary entry
    waterTracker.weeklySummary.push({
      date: today,
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
 * Delete water intake entry
 * @param {ObjectId} userId
 * @param {ObjectId} trackerId - water tracker ID
 * @param {number} amountMl - amount to remove
 * @returns {Promise<Object>}
 */
const deleteWaterIntake = async (userId, trackerId, amountMl) => {
  const waterTracker = await WaterTracker.findOne({ 
    _id: trackerId,
    userId
  });

  if (!waterTracker) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Water tracker not found');
  }

  // Remove the specific intake event
  const eventIndex = waterTracker.intakeTimeline.findIndex(
    event => event.amountMl === amountMl
  );

  if (eventIndex === -1) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Water intake event not found');
  }

  // Remove the event and update total
  const removedEvent = waterTracker.intakeTimeline.splice(eventIndex, 1)[0];
  waterTracker.totalIntake -= removedEvent.amountMl;

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
  return waterTracker;
};

/**
 * Add mood entry
 * @param {ObjectId} userId
 * @param {Object} moodData
 * @returns {Promise<Object>}
 */
const addMoodEntry = async (userId, moodData) => {
  return Mood.create({ userId, ...moodData });
};

/**
 * Add temperature entry
 * @param {ObjectId} userId
 * @param {Object} temperatureData
 * @returns {Promise<Object>}
 */
const addTemperatureEntry = async (userId, temperatureData) => {
  return TemperatureTracker.create({ userId, ...temperatureData });
};

/**
 * Add fat entry
 * @param {ObjectId} userId
 * @param {Object} fatData
 * @returns {Promise<Object>}
 */
const addFatEntry = async (userId, fatData) => {
  return FatTracker.create({ userId, ...fatData });
};

/**
 * Add BMI entry
 * @param {ObjectId} userId
 * @param {Object} bmiData
 * @returns {Promise<Object>}
 */
const addBmiEntry = async (userId, bmiData) => {
  return BmiTracker.create({ userId, ...bmiData });
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
  return SleepTracker.create({ userId, ...sleepData });
};

/**
 * Add workout entry
 * @param {ObjectId} userId
 * @param {Object} workoutData
 * @returns {Promise<Object>}
 */
const addWorkoutEntry = async (userId, workoutData) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Find or create today's workout tracker
  let workoutTracker = await WorkoutTracker.findOne({ 
    userId, 
    date: { 
      $gte: today, 
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
    } 
  });

  if (!workoutTracker) {
    // Create new workout tracker for today
    workoutTracker = await WorkoutTracker.create({
      userId,
      date: today,
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
    date: new Date(),
    notes: workoutData.notes
  };

  workoutTracker.workoutEntries.push(workoutEntry);
  
  // Update daily totals
  workoutTracker.totalWorkoutTime += (workoutData.duration?.value || 0);
  workoutTracker.totalCaloriesBurned += workoutData.calories;

  // Update weekly summary
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
  
  // Find or create weekly summary entry for today
  const existingWeekEntry = workoutTracker.weeklySummary.find(
    entry => entry.date.getTime() === today.getTime()
  );

  if (existingWeekEntry) {
    // Update existing entry
    existingWeekEntry.totalTime = workoutTracker.totalWorkoutTime;
    existingWeekEntry.totalCalories = workoutTracker.totalCaloriesBurned;
    existingWeekEntry.workoutCount = workoutTracker.workoutEntries.length;
  } else {
    // Add new weekly summary entry
    workoutTracker.weeklySummary.push({
      date: today,
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
  
  return WorkoutTracker.find({
    userId,
    date: { $gte: startDate }
  }).sort({ date: -1 });
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

  return WorkoutTracker.find(query).sort({ date: -1 });
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
    entry => entry._id.toString() === entryId
  );

  if (entryIndex === -1) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Workout entry not found');
  }

  // Update the entry
  const oldEntry = workoutTracker.workoutEntries[entryIndex];
  Object.assign(workoutTracker.workoutEntries[entryIndex], updateData);

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
    entry => entry._id.toString() === entryId
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
 * @param {string} trackerType
 * @param {ObjectId} entryId
 * @param {Object} updateData
 * @returns {Promise<Object>}
 */
const updateTrackerEntry = async (trackerType, entryId, updateData) => {
  const trackerModels = {
    weight: WeightTracker,
    water: WaterTracker,
    mood: Mood,
    temperature: TemperatureTracker,
    fat: FatTracker,
    bmi: BmiTracker,
    bodyStatus: BodyStatus,
    step: StepTracker,
    sleep: SleepTracker
  };

  const model = trackerModels[trackerType];
  if (!model) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid tracker type');
  }

  const entry = await model.findByIdAndUpdate(entryId, updateData, { new: true });
  if (!entry) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Entry not found');
  }

  return entry;
};

/**
 * Delete tracker entry
 * @param {string} trackerType
 * @param {ObjectId} entryId
 * @returns {Promise<void>}
 */
const deleteTrackerEntry = async (trackerType, entryId) => {
  const trackerModels = {
    weight: WeightTracker,
    water: WaterTracker,
    mood: Mood,
    temperature: TemperatureTracker,
    fat: FatTracker,
    bmi: BmiTracker,
    bodyStatus: BodyStatus,
    step: StepTracker,
    sleep: SleepTracker
  };

  const model = trackerModels[trackerType];
  if (!model) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid tracker type');
  }

  const entry = await model.findByIdAndDelete(entryId);
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

export {
  createInitialTrackers,
  updateTrackersFromProfile,
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