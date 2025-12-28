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
import { getLocalDayRange } from '../utils/date.utils.js';


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


// NOTE: All "today" water logic uses UTC day boundaries intentionally
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
 * Get today's water data
 * @param {ObjectId} userId
 * @returns {Promise<Object>}
 */

const getTodayWaterData = async (userId) => {
  const { start, end } = getLocalDayRange();

  const waterTracker = await WaterTracker.findOne({
    userId,
    date: { $gte: start, $lte: end }
  }).sort({ date: -1 });

  // ❌ DO NOT CREATE DATA IN GET
  if (!waterTracker) {
    return {
      userId,
      date: start,
      totalIntake: 0,
      targetMl: 2000,
      targetGlasses: 8,
      intakeTimeline: [],
      status: 'Dehydrated'
    };
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
 * Get hydration status based on current intake and target
 * @param {ObjectId} userId
 * @returns {Promise<Object>}
 */
const getHydrationStatus = async (userId) => {
  const { start, end } = getLocalDayRange();

  const waterTracker = await WaterTracker.findOne({
    userId,
    date: { $gte: start, $lte: end }
  });

  if (!waterTracker) {
    return {
      currentIntake: 0,
      targetMl: 2000,
      targetGlasses: 8,
      percentage: 0,
      status: 'Dehydrated',
      remainingMl: 2000,
      remainingGlasses: 8,
      intakeTimeline: [],
      date: start
    };
  }

  const percentage = (waterTracker.totalIntake / waterTracker.targetMl) * 100;

  let status = 'Dehydrated';
  if (percentage >= 100) status = 'Hydrated';
  else if (percentage >= 75) status = 'Mildly dehydrated';

  return {
    currentIntake: waterTracker.totalIntake,
    targetMl: waterTracker.targetMl,
    targetGlasses: waterTracker.targetGlasses,
    percentage: Math.round(percentage * 100) / 100,
    status,
    remainingMl: Math.max(0, waterTracker.targetMl - waterTracker.totalIntake),
    remainingGlasses: Math.max(
      0,
      Math.ceil((waterTracker.targetMl - waterTracker.totalIntake) / 250)
    ),
    intakeTimeline: waterTracker.intakeTimeline,
    date: waterTracker.date
  };
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


export {
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
  getTodayWaterData,
  getWeeklyWaterSummary,
  getWorkoutHistory,
  getWorkoutByType,
  getWorkoutSummary,
  getHydrationStatus,
  getCaloriesTarget
}; 