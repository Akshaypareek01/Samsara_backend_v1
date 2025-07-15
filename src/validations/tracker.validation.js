import Joi from 'joi';
import { objectId } from './custom.validation.js';

const createWeightTracker = {
  body: Joi.object().keys({
    currentWeight: Joi.object({
      value: Joi.number().required(),
      unit: Joi.string().valid('kg', 'lbs').default('kg')
    }).required(),
    goalWeight: Joi.object({
      value: Joi.number().required(),
      unit: Joi.string().valid('kg', 'lbs').default('kg')
    }).required(),
    startingWeight: Joi.object({
      value: Joi.number(),
      unit: Joi.string().valid('kg', 'lbs').default('kg')
    }),
    notes: Joi.string().max(500)
  }),
};

const createWaterTracker = {
  body: Joi.object().keys({
    targetGlasses: Joi.number().min(1).max(20),
    targetMl: Joi.number().min(500).max(5000),
    intakeTimeline: Joi.array().items(
      Joi.object({
        amountMl: Joi.number().required(),
        time: Joi.string().required()
      })
    ),
    totalIntake: Joi.number().min(0),
    notes: Joi.string().max(500)
  }),
};

const createMoodTracker = {
  body: Joi.object().keys({
    mood: Joi.string().valid(
      'Happy', 'Sad', 'Angry', 'Anxious', 'Excited', 
      'Calm', 'Stressed', 'Energetic', 'Tired', 'Neutral'
    ).required(),
    note: Joi.string().max(500)
  }),
};

const createTemperatureTracker = {
  body: Joi.object().keys({
    temperature: Joi.object({
      value: Joi.number().required(),
      unit: Joi.string().valid('F', 'C').default('F')
    }).required(),
    notes: Joi.string().max(500)
  }),
};

const createFatTracker = {
  body: Joi.object().keys({
    age: Joi.number().min(1).max(120).required(),
    gender: Joi.string().valid('Male', 'Female', 'Other').required(),
    height: Joi.object({
      value: Joi.number().required(),
      unit: Joi.string().valid('cm', 'ft').default('cm')
    }).required(),
    weight: Joi.object({
      value: Joi.number().required(),
      unit: Joi.string().valid('kg', 'lbs').default('kg')
    }).required(),
    bodyFat: Joi.object({
      value: Joi.number().min(0).max(100).required(),
      unit: Joi.string().valid('%').default('%')
    }).required(),
    goal: Joi.number().min(0).max(100),
    notes: Joi.string().max(500)
  }),
};

const createBmiTracker = {
  body: Joi.object().keys({
    age: Joi.number().min(1).max(120).required(),
    gender: Joi.string().valid('Male', 'Female', 'Other').required(),
    height: Joi.object({
      value: Joi.number().required(),
      unit: Joi.string().valid('cm', 'ft').default('cm')
    }).required(),
    weight: Joi.object({
      value: Joi.number().required(),
      unit: Joi.string().valid('kg', 'lbs').default('kg')
    }).required(),
    notes: Joi.string().max(500)
  }),
};

const createBodyStatusTracker = {
  body: Joi.object().keys({
    height: Joi.object({
      value: Joi.number().required(),
      unit: Joi.string().valid('cm', 'ft').default('cm')
    }).required(),
    weight: Joi.object({
      value: Joi.number().required(),
      unit: Joi.string().valid('kg', 'lbs').default('kg')
    }).required(),
    chest: Joi.object({
      value: Joi.number(),
      unit: Joi.string().valid('cm', 'inches').default('cm')
    }),
    waist: Joi.object({
      value: Joi.number(),
      unit: Joi.string().valid('cm', 'inches').default('cm')
    }),
    hips: Joi.object({
      value: Joi.number(),
      unit: Joi.string().valid('cm', 'inches').default('cm')
    }),
    arms: Joi.object({
      value: Joi.number(),
      unit: Joi.string().valid('cm', 'inches').default('cm')
    }),
    thighs: Joi.object({
      value: Joi.number(),
      unit: Joi.string().valid('cm', 'inches').default('cm')
    }),
    bodyFat: Joi.object({
      value: Joi.number().min(0).max(100),
      unit: Joi.string().valid('%').default('%')
    }),
    notes: Joi.string().max(500)
  }),
};

const createStepTracker = {
  body: Joi.object().keys({
    steps: Joi.number().min(0).max(100000).required(),
    goal: Joi.number().min(1000).max(50000).default(10000),
    distance: Joi.object({
      value: Joi.number().min(0),
      unit: Joi.string().valid('km', 'mi').default('km')
    }),
    calories: Joi.number().min(0),
    activeTime: Joi.number().min(0),
    notes: Joi.string().max(500)
  }),
};

const createSleepTracker = {
  body: Joi.object().keys({
    sleepRate: Joi.number().min(0).max(100),
    sleepTime: Joi.number().min(0), // in minutes
    hoursSlept: Joi.number().min(0).max(24),
    bedtime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
    wakeUpTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
    goal: Joi.number().min(1).max(24).default(8),
    notes: Joi.string().max(500)
  }),
};

const updateTrackerEntry = {
  params: Joi.object().keys({
    trackerType: Joi.string().valid(
      'weight', 'water', 'mood', 'temperature', 'fat', 
      'bmi', 'bodyStatus', 'step', 'sleep'
    ).required(),
    entryId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    // Allow any valid tracker data based on type
    // Validation will be handled in the service layer
  }).min(1),
};

const deleteTrackerEntry = {
  params: Joi.object().keys({
    trackerType: Joi.string().valid(
      'weight', 'water', 'mood', 'temperature', 'fat', 
      'bmi', 'bodyStatus', 'step', 'sleep'
    ).required(),
    entryId: Joi.string().custom(objectId).required(),
  }),
};

const getTrackerHistory = {
  query: Joi.object().keys({
    days: Joi.number().integer().min(1).max(365).default(30),
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

const deleteWaterIntake = {
  params: Joi.object().keys({
    trackerId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    amountMl: Joi.number().min(1).required(),
  }),
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
  createSleepTracker,
  updateTrackerEntry,
  deleteTrackerEntry,
  getTrackerHistory,
  getTrackerEntryById,
  updateWaterTarget,
  deleteWaterIntake,
  addWaterIntake,
  getTodayWaterData,
}; 