import Joi from 'joi';
import { objectId } from './custom.validation.js';

const createMedicationTracker = {
  body: Joi.object().keys({
    healthConditions: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        diagnosedYear: Joi.number().min(1900).max(new Date().getFullYear()),
        analysis: Joi.string().max(1000),
        isActive: Joi.boolean().default(true),
      })
    ),
    medications: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('Prescription', 'Supplement').required(),
        name: Joi.string().required(),
        dosage: Joi.string(),
        instruction: Joi.string().max(500),
        quantityLeft: Joi.number().min(0),
        frequency: Joi.string(),
        times: Joi.array().items(Joi.string()),
        isActive: Joi.boolean().default(true),
        schedulePattern: Joi.string().valid('daily', 'weekly', 'monthly', 'custom').default('daily'),
        daysOfWeek: Joi.array().items(Joi.string().valid('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
      })
    ),
  }),
};

const addHealthCondition = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    diagnosedYear: Joi.number().min(1900).max(new Date().getFullYear()),
    analysis: Joi.string().max(1000),
    level: Joi.string().valid('High', 'Moderate', 'Low'),
    isActive: Joi.boolean().default(true),
  }),
};

const updateHealthCondition = {
  params: Joi.object().keys({
    conditionId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      diagnosedYear: Joi.number().min(1900).max(new Date().getFullYear()),
      analysis: Joi.string().max(1000),
      level: Joi.string().valid('High', 'Moderate', 'Low'),
      isActive: Joi.boolean(),
    })
    .min(1),
};

const deleteHealthCondition = {
  params: Joi.object().keys({
    conditionId: Joi.string().custom(objectId).required(),
  }),
};

const addMedication = {
  body: Joi.object().keys({
    category: Joi.string().valid('Medication', 'Supplement').required(),
    medicineType: Joi.string().valid('Pills', 'Capsule', 'Syrup', 'Injection', 'Other').required(),
    medicineName: Joi.string().required(),
    dosage: Joi.object()
      .keys({
        quantity: Joi.number().required(),
        unit: Joi.string().required(),
      })
      .required(),
    duration: Joi.object().keys({
      startDate: Joi.date(),
      endDate: Joi.date(),
      preset: Joi.string().valid('1 week', '1 month', '3 months', 'Ongoing'),
    }),
    frequency: Joi.string().valid('Daily', 'Weekly', 'Custom').required(),
    daysOfWeek: Joi.array().items(Joi.string().valid('M', 'T', 'W', 'Th', 'F', 'S', 'Su')),
    times: Joi.array().items(
      Joi.object().keys({
        time: Joi.string().required(),
        ampm: Joi.string().valid('AM', 'PM').required(),
      })
    ),
    consumptionInstructions: Joi.array().items(
      Joi.string().valid('Before Meals', 'During Meals', 'After Meals', 'Empty Stomach', 'Before Sleep')
    ),
    additionalNotes: Joi.string(),
    reminderNotifications: Joi.boolean(),
    isActive: Joi.boolean().default(true),
  }),
};

const updateMedication = {
  params: Joi.object().keys({
    medicationId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      category: Joi.string().valid('Medication', 'Supplement'),
      medicineType: Joi.string().valid('Pills', 'Capsule', 'Syrup', 'Injection', 'Other'),
      medicineName: Joi.string(),
      dosage: Joi.object().keys({
        quantity: Joi.number(),
        unit: Joi.string(),
      }),
      duration: Joi.object().keys({
        startDate: Joi.date(),
        endDate: Joi.date(),
        preset: Joi.string().valid('1 week', '1 month', '3 months', 'Ongoing'),
      }),
      frequency: Joi.string().valid('Daily', 'Weekly', 'Custom'),
      daysOfWeek: Joi.array().items(Joi.string().valid('M', 'T', 'W', 'Th', 'F', 'S', 'Su')),
      times: Joi.array().items(
        Joi.object().keys({
          time: Joi.string(),
          ampm: Joi.string().valid('AM', 'PM'),
        })
      ),
      consumptionInstructions: Joi.array().items(
        Joi.string().valid('Before Meals', 'During Meals', 'After Meals', 'Empty Stomach', 'Before Sleep')
      ),
      additionalNotes: Joi.string(),
      reminderNotifications: Joi.boolean(),
      isActive: Joi.boolean(),
    })
    .min(1),
};

const deleteMedication = {
  params: Joi.object().keys({
    medicationId: Joi.string().custom(objectId).required(),
  }),
};

const createDailySchedule = {
  body: Joi.object().keys({
    date: Joi.date().required(),
    schedule: Joi.array().items(
      Joi.object({
        time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
        period: Joi.string(),
        medications: Joi.array().items(Joi.string()),
        isCompleted: Joi.boolean().default(false),
        completedAt: Joi.date(),
      })
    ),
  }),
};

const updateDailySchedule = {
  params: Joi.object().keys({
    scheduleId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      date: Joi.date(),
      schedule: Joi.array().items(
        Joi.object({
          time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          period: Joi.string(),
          medications: Joi.array().items(Joi.string()),
          isCompleted: Joi.boolean(),
          completedAt: Joi.date(),
        })
      ),
    })
    .min(1),
};

const markMedicationTaken = {
  params: Joi.object().keys({
    scheduleId: Joi.string().custom(objectId).required(),
    timeSlot: Joi.string().required(), // time in HH:MM format
  }),
};

const getMedicationHistory = {
  query: Joi.object().keys({
    days: Joi.number().integer().min(1).max(365).default(30),
    medicationId: Joi.string().custom(objectId),
    type: Joi.string().valid('Prescription', 'Supplement'),
  }),
};

const getScheduleByDate = {
  query: Joi.object().keys({
    date: Joi.date().required(),
  }),
};

const getScheduleByDateRange = {
  query: Joi.object().keys({
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
  }),
};

const refillMedication = {
  params: Joi.object().keys({
    medicationId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    quantityAdded: Joi.number().min(1).required(),
    notes: Joi.string().max(500),
  }),
};

const getMedicationReminders = {
  query: Joi.object().keys({
    date: Joi.date().default(() => new Date()),
    includeCompleted: Joi.boolean().default(false),
  }),
};

export {
  createMedicationTracker,
  addHealthCondition,
  updateHealthCondition,
  deleteHealthCondition,
  addMedication,
  updateMedication,
  deleteMedication,
  createDailySchedule,
  updateDailySchedule,
  markMedicationTaken,
  getMedicationHistory,
  getScheduleByDate,
  getScheduleByDateRange,
  refillMedication,
  getMedicationReminders,
};
