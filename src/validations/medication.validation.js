import Joi from 'joi';
import { objectId } from './custom.validation.js';

const createMedicationTracker = {
  body: Joi.object().keys({
    healthConditions: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        diagnosedYear: Joi.number().min(1900).max(new Date().getFullYear()),
        analysis: Joi.string().max(1000),
        isActive: Joi.boolean().default(true)
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
        daysOfWeek: Joi.array().items(Joi.string().valid('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'))
      })
    )
  })
};

const addHealthCondition = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    diagnosedYear: Joi.number().min(1900).max(new Date().getFullYear()),
    analysis: Joi.string().max(1000),
    isActive: Joi.boolean().default(true)
  })
};

const updateHealthCondition = {
  params: Joi.object().keys({
    conditionId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    diagnosedYear: Joi.number().min(1900).max(new Date().getFullYear()),
    analysis: Joi.string().max(1000),
    isActive: Joi.boolean()
  }).min(1)
};

const deleteHealthCondition = {
  params: Joi.object().keys({
    conditionId: Joi.string().custom(objectId).required(),
  })
};

const addMedication = {
  body: Joi.object().keys({
    type: Joi.string().valid('Prescription', 'Supplement').required(),
    name: Joi.string().required(),
    dosage: Joi.string(),
    instruction: Joi.string().max(500),
    quantityLeft: Joi.number().min(0),
    frequency: Joi.string(),
    times: Joi.array().items(Joi.string()),
    isActive: Joi.boolean().default(true),
    schedulePattern: Joi.string().valid('daily', 'weekly', 'monthly', 'custom').default('daily'),
    daysOfWeek: Joi.array().items(Joi.string().valid('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'))
  })
};

const updateMedication = {
  params: Joi.object().keys({
    medicationId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    type: Joi.string().valid('Prescription', 'Supplement'),
    name: Joi.string(),
    dosage: Joi.string(),
    instruction: Joi.string().max(500),
    quantityLeft: Joi.number().min(0),
    frequency: Joi.string(),
    times: Joi.array().items(Joi.string()),
    isActive: Joi.boolean(),
    schedulePattern: Joi.string().valid('daily', 'weekly', 'monthly', 'custom'),
    daysOfWeek: Joi.array().items(Joi.string().valid('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'))
  }).min(1)
};

const deleteMedication = {
  params: Joi.object().keys({
    medicationId: Joi.string().custom(objectId).required(),
  })
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
        completedAt: Joi.date()
      })
    )
  })
};

const updateDailySchedule = {
  params: Joi.object().keys({
    scheduleId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    date: Joi.date(),
    schedule: Joi.array().items(
      Joi.object({
        time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        period: Joi.string(),
        medications: Joi.array().items(Joi.string()),
        isCompleted: Joi.boolean(),
        completedAt: Joi.date()
      })
    )
  }).min(1)
};

const markMedicationTaken = {
  params: Joi.object().keys({
    scheduleId: Joi.string().custom(objectId).required(),
    timeSlot: Joi.string().required(), // time in HH:MM format
  })
};

const getMedicationHistory = {
  query: Joi.object().keys({
    days: Joi.number().integer().min(1).max(365).default(30),
    medicationId: Joi.string().custom(objectId),
    type: Joi.string().valid('Prescription', 'Supplement')
  })
};

const getScheduleByDate = {
  query: Joi.object().keys({
    date: Joi.date().required()
  })
};

const getScheduleByDateRange = {
  query: Joi.object().keys({
    startDate: Joi.date().required(),
    endDate: Joi.date().required()
  })
};

const refillMedication = {
  params: Joi.object().keys({
    medicationId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    quantityAdded: Joi.number().min(1).required(),
    notes: Joi.string().max(500)
  })
};

const getMedicationReminders = {
  query: Joi.object().keys({
    date: Joi.date().default(() => new Date()),
    includeCompleted: Joi.boolean().default(false)
  })
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
  getMedicationReminders
}; 