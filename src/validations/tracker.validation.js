import Joi from 'joi';
import { objectId } from './custom.validation.js';
import { createBodyStatusBody } from './bodyStatus.schema.js';

const dateKey = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/);

const createWeightTracker = {
  body: Joi.object().keys({
    date: dateKey,
    currentWeight: Joi.object({
      value: Joi.number().greater(0).max(500).required(),
      unit: Joi.string().valid('kg', 'lbs').default('kg'),
    }).required(),
    goalWeight: Joi.object({
      value: Joi.number().greater(0).max(500).required(),
      unit: Joi.string().valid('kg', 'lbs').default('kg'),
    }).required(),
    startingWeight: Joi.object({
      value: Joi.number().greater(0).max(500),
      unit: Joi.string().valid('kg', 'lbs').default('kg'),
    }),
    notes: Joi.string().max(500),
  }),
};

const createWaterTracker = {
  body: Joi.object().keys({
    targetGlasses: Joi.number().min(1).max(20),
    targetMl: Joi.number().min(500).max(5000),
    intakeTimeline: Joi.array().items(
      Joi.object({
        amountMl: Joi.number().required(),
        time: Joi.string().required(),
      })
    ),
    totalIntake: Joi.number().min(0),
    notes: Joi.string().max(500),
    date: dateKey,
  }),
};

const createMoodTracker = {
  body: Joi.object().keys({
    date: dateKey,
    mood: Joi.string()
      .valid('Normal', 'Angry', 'Happy', 'Sad', 'Exhausted', 'Anxious', 'Depressed', 'In Love', 'Bored', 'Confident', 'Excited', 'Relaxed')
      .required(),
    moodId: Joi.number()
      .valid(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)
      .required(),
    whatWasItAbout: Joi.array()
      .items(Joi.string().valid('work', 'study', 'relationship', 'school', 'friends', 'health', 'job', 'life', 'politics', 'coworkers', 'self harm'))
      .optional(),
    comments: Joi.string()
      .max(500)
      .optional(),
    note: Joi.string().max(500), // Keep for backward compatibility
  }),
};

const createTemperatureTracker = {
  body: Joi.object().keys({
    date: dateKey,
    temperature: Joi.object({
      value: Joi.number().greater(0).max(115).required(),
      unit: Joi.string().valid('F', 'C').default('F'),
    }).required(),
    notes: Joi.string().max(500),
  }),
};

const createFatTracker = {
  body: Joi.object().keys({
    date: dateKey,
    age: Joi.number().min(1).max(120),
    gender: Joi.string().valid('Male', 'Female', 'Other'),
    height: Joi.object({
      value: Joi.number().greater(0).max(300),
      unit: Joi.string().valid('cm', 'ft').default('cm'),
    }),
    weight: Joi.object({
      value: Joi.number().greater(0).max(500),
      unit: Joi.string().valid('kg', 'lbs').default('kg'),
    }),
    bodyFat: Joi.object({
      value: Joi.number().greater(0).max(100).required(),
      unit: Joi.string().valid('%').default('%'),
    }).required(),
    goal: Joi.number().greater(0).max(100),
    notes: Joi.string().max(500),
  }),
};

const createBmiTracker = {
  body: Joi.object().keys({
    date: dateKey,
    age: Joi.number().min(1).max(120).required(),
    gender: Joi.string().valid('Male', 'Female', 'Other').required(),
    height: Joi.object({
      value: Joi.number().greater(0).max(300).required(),
      unit: Joi.string().valid('cm', 'ft').default('cm'),
    }).required(),
    weight: Joi.object({
      value: Joi.number().greater(0).max(500).required(),
      unit: Joi.string().valid('kg', 'lbs').default('kg'),
    }).required(),
    notes: Joi.string().max(500),
  }),
};

const createBodyStatusTracker = {
  body: createBodyStatusBody,
};

const createStepTracker = {
  body: Joi.object().keys({
    steps: Joi.number().min(0).max(100000).required(),
    goal: Joi.number().min(1000).max(50000).default(10000),
    distance: Joi.object({
      value: Joi.number().min(0),
      unit: Joi.string().valid('km', 'mi').default('km'),
    }),
    calories: Joi.number().min(0),
    activeTime: Joi.number().min(0),
    notes: Joi.string().max(500),
  }),
};

// Daily activity (device steps + active calories), upsert by date.
const createActivityTracker = {
  body: Joi.object()
    .keys({
      date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
      steps: Joi.object({
        value: Joi.number().integer().min(0).max(200000).required(),
      }),
      activeCalories: Joi.object({
        value: Joi.number().min(0),
        unit: Joi.string().default('kcal'),
      }),
      distance: Joi.object({
        value: Joi.number().min(0),
        unit: Joi.string().valid('km', 'mi').default('km'),
      }),
      activeTime: Joi.number().min(0),
      source: Joi.string().valid('healthkit', 'healthconnect', 'manual', 'system'),
      notes: Joi.string().max(500),
    })
    .or('steps', 'activeCalories'),
};

// Daily heart-rate summary, upsert by date.
const createHeartRateTracker = {
  body: Joi.object().keys({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    summary: Joi.object({
      avg: Joi.number().min(0).max(300),
      min: Joi.number().min(0).max(300),
      max: Joi.number().min(0).max(300),
      latest: Joi.number().min(0).max(300),
      unit: Joi.string().default('count/min'),
    }).required(),
    measuredAt: Joi.string().isoDate(),
    source: Joi.string().valid('healthkit', 'healthconnect', 'manual', 'system'),
    notes: Joi.string().max(500),
  }),
};

const createSleepTracker = {
  body: Joi.object().keys({
    date: dateKey,
    sleepRate: Joi.number().min(0).max(100),
    sleepTime: Joi.number().min(0), // in minutes; overwritten from clock times in service
    // No max(24): Android DateTimePicker date-subtraction can send huge values.
    // addSleepEntry recomputes hoursSlept from bedtime/wakeUpTime.
    hoursSlept: Joi.number().min(0),
    bedtime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
    wakeUpTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
    goal: Joi.number().min(1).max(24).default(8),
    notes: Joi.string().max(500).allow(''),
  }),
};

const TRACKER_TYPES = ['weight', 'water', 'mood', 'temperature', 'fat', 'bmi', 'bodyStatus', 'step', 'sleep', 'heart-rate'];

const updateTrackerEntry = {
  params: Joi.object().keys({
    trackerType: Joi.string().valid(...TRACKER_TYPES).required(),
    entryId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().min(1).unknown(true),
};

const deleteTrackerEntry = {
  params: Joi.object().keys({
    trackerType: Joi.string().valid(...TRACKER_TYPES).required(),
    entryId: Joi.string().custom(objectId).required(),
  }),
};

const getTrackerHistory = {
  query: Joi.object().keys({
    days: Joi.number().integer().min(1).max(730).default(30),
    limit: Joi.number().integer().min(1).max(100),
  }),
};

const getTrackerEntryById = {
  params: Joi.object().keys({
    entryId: Joi.string().custom(objectId).required(),
  }),
};

const addWaterIntake = {
  body: Joi.object().keys({
    amountMl: Joi.number().min(1).max(5000).required(),
    date: dateKey,
  }),
};

const getTodayWaterData = {
  // No validation needed for this endpoint
};

const updateWaterTarget = {
  body: Joi.object().keys({
    targetMl: Joi.number().min(500).max(5000).required(),
    targetGlasses: Joi.number().min(1).max(20).required(),
  }),
};

const updateStepGoal = {
  body: Joi.object().keys({
    goal: Joi.number().integer().min(1000).max(50000).required(),
  }),
};

const updateFatGoal = {
  body: Joi.object().keys({
    goal: Joi.number().greater(0).max(100).required(),
  }),
};

const deleteWaterIntake = {
  params: Joi.object().keys({
    trackerId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    amountMl: Joi.number().min(1).required(),
    time: Joi.string(),
  }),
};

const createWorkoutTracker = {
  body: Joi.object().keys({
    date: dateKey,
    workoutType: Joi.string().valid('Running', 'Yoga', 'Swimming', 'Cycling', 'Gym', 'Dancing').required(),
    intensity: Joi.string().valid('Low', 'Medium', 'High').required(),
    distance: Joi.object({
      value: Joi.number().greater(0).max(200).required(),
      unit: Joi.string().valid('km', 'mi').default('km'),
    }),
    duration: Joi.object({
      value: Joi.number().greater(0).max(24).required(),
      unit: Joi.string().valid('h', 'min').default('h'),
    }).required(),
    calories: Joi.number().integer().greater(0).max(9999).required(),
    notes: Joi.string().max(500),
  }),
};

const addWorkoutEntry = {
  body: Joi.object().keys({
    date: dateKey,
    workoutType: Joi.string().valid('Running', 'Yoga', 'Swimming', 'Cycling', 'Gym', 'Dancing').required(),
    intensity: Joi.string().valid('Low', 'Medium', 'High').required(),
    distance: Joi.object({
      value: Joi.number().greater(0).max(200).required(),
      unit: Joi.string().valid('km', 'mi').default('km'),
    }),
    duration: Joi.object({
      value: Joi.number().greater(0).max(24).required(),
      unit: Joi.string().valid('h', 'min').default('h'),
    }).required(),
    calories: Joi.number().integer().greater(0).max(9999).required(),
    notes: Joi.string().max(500),
  }),
};

const getWorkoutByType = {
  query: Joi.object().keys({
    workoutType: Joi.string().valid('Running', 'Yoga', 'Swimming', 'Cycling', 'Gym', 'Dancing'),
    days: Joi.number().integer().min(1).max(730).default(30),
  }),
};

const getWorkoutSummary = {
  query: Joi.object().keys({
    period: Joi.string().valid('daily', 'weekly', 'monthly', '6months', 'yearly').default('weekly'),
    days: Joi.number().integer().min(1).max(730).default(7),
  }),
};

const updateWorkoutEntry = {
  params: Joi.object().keys({
    entryId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      workoutType: Joi.string().valid('Running', 'Yoga', 'Swimming', 'Cycling', 'Gym', 'Dancing'),
      intensity: Joi.string().valid('Low', 'Medium', 'High'),
      distance: Joi.object({
        value: Joi.number().greater(0).max(200).required(),
        unit: Joi.string().valid('km', 'mi'),
      }),
      duration: Joi.object({
        value: Joi.number().greater(0).max(24).required(),
        unit: Joi.string().valid('h', 'min'),
      }),
      calories: Joi.number().integer().greater(0).max(9999),
      notes: Joi.string().max(500),
      date: dateKey,
    })
    .min(1),
};

const deleteWorkoutEntry = {
  params: Joi.object().keys({
    entryId: Joi.string().custom(objectId).required(),
  }),
};

// Calories Target validations
const createCaloriesTarget = {
  body: Joi.object().keys({
    dailyTarget: Joi.number().min(500).max(5000).default(2000),
  }),
};

const updateCaloriesTarget = {
  body: Joi.object().keys({
    dailyTarget: Joi.number().min(500).max(5000).required(),
  }),
};

const getCaloriesTarget = {
  // No validation needed for this endpoint
};

export {
  createWeightTracker,
  createWaterTracker,
  createMoodTracker,
  createTemperatureTracker,
  createFatTracker,
  createBmiTracker,
  createBodyStatusTracker,
  createStepTracker,
  createActivityTracker,
  createHeartRateTracker,
  createSleepTracker,
  createWorkoutTracker,
  updateTrackerEntry,
  deleteTrackerEntry,
  getTrackerHistory,
  getTrackerEntryById,
  updateWaterTarget,
  updateStepGoal,
  updateFatGoal,
  deleteWaterIntake,
  addWaterIntake,
  getTodayWaterData,
  addWorkoutEntry,
  getWorkoutByType,
  getWorkoutSummary,
  updateWorkoutEntry,
  deleteWorkoutEntry,
  createCaloriesTarget,
  updateCaloriesTarget,
  getCaloriesTarget,
};
