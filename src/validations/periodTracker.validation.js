import Joi from 'joi';
import { objectId } from './custom.validation.js';

const isoDate = Joi.date();
const timeHHmm = Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/);

export const getCalendar = {
  query: Joi.object().keys({
    month: Joi.string().pattern(/^\d{4}-\d{2}$/), // YYYY-MM
  }),
};

const dailyLogSchema = Joi.object().keys({
  date: isoDate.required(),
  flowIntensity: Joi.number().min(0).max(5),
  crampingIntensity: Joi.string().valid('None', 'Mild', 'Moderate', 'Strong', 'Severe'),
  painLevel: Joi.number().min(0).max(10),
  energyPattern: Joi.string().valid('Low', 'Low-Mid', 'Moderate', 'Mid-High', 'High'),
  restNeeded: Joi.boolean(),
  symptoms: Joi.array().items(Joi.string()),
  cravings: Joi.array().items(Joi.string()),
  medicationTaken: Joi.boolean(),
  supplementTaken: Joi.boolean(),
  exercise: Joi.object({ type: Joi.string(), minutes: Joi.number(), intensity: Joi.string() }),
  discharge: Joi.object({
    type: Joi.string(),
    color: Joi.string(),
    consistency: Joi.string(),
    amount: Joi.string(),
    notableChanges: Joi.array().items(Joi.string()),
  }),
  sexualActivity: Joi.object({ hadSex: Joi.boolean(), protected: Joi.boolean() }),
  pregnancyTest: Joi.object({ taken: Joi.boolean(), result: Joi.string().valid('Positive', 'Negative', 'Unknown') }),
  notes: Joi.string().max(1000),
});

export const startPeriod = {
  body: Joi.object().keys({
    date: isoDate.required(),
    cycleEndDate: isoDate.optional(), // For historical completed cycles
    periodDurationDays: Joi.number().min(1).max(15).optional(),
    cycleStatus: Joi.string().valid('Active', 'Completed').optional(),
    dailyLogs: Joi.array().items(dailyLogSchema).optional(),
  }),
};

export const stopPeriod = {
  body: Joi.object().keys({
    date: isoDate.required(),
  }),
};

export const upsertLog = {
  params: Joi.object().keys({
    date: Joi.string().required(), // YYYY-MM-DD
  }),
  body: Joi.object()
    .keys({
      flowIntensity: Joi.number().min(0).max(5),
      crampingIntensity: Joi.string().valid('None', 'Mild', 'Moderate', 'Strong', 'Severe'),
      painLevel: Joi.number().min(0).max(10),
      energyPattern: Joi.string().valid('Low', 'Low-Mid', 'Moderate', 'Mid-High', 'High'),
      restNeeded: Joi.boolean(),
      symptoms: Joi.array().items(Joi.string()),
      cravings: Joi.array().items(Joi.string()),
      medicationTaken: Joi.boolean(),
      supplementTaken: Joi.boolean(),
      exercise: Joi.object({ type: Joi.string(), minutes: Joi.number(), intensity: Joi.string() }),
      discharge: Joi.object({
        type: Joi.string(),
        color: Joi.string(),
        consistency: Joi.string(),
        amount: Joi.string(),
        notableChanges: Joi.array().items(Joi.string()),
      }),
      sexualActivity: Joi.object({ hadSex: Joi.boolean(), protected: Joi.boolean() }),
      pregnancyTest: Joi.object({ taken: Joi.boolean(), result: Joi.string().valid('Positive', 'Negative', 'Unknown') }),
      notes: Joi.string().max(1000),
    })
    .min(1),
};

export const getHistory = {
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).max(24).default(6),
  }),
};

export const getDay = {
  params: Joi.object().keys({
    date: Joi.string().required(),
  }),
};

export const getSettings = {};

export const updateSettings = {
  body: Joi.object()
    .keys({
      trackingReminderEnabled: Joi.boolean(),
      trackingReminderTime: timeHHmm,
      defaultCycleLengthDays: Joi.number().min(15).max(60),
      lutealPhaseDays: Joi.number().min(10).max(20),
      // Pregnancy mode
      pregnancyModeEnabled: Joi.boolean(),
      pregnancyStartDate: isoDate.optional(),
      pregnancyDueDate: isoDate.optional(),
      pregnancyWeek: Joi.number().min(0).max(42).optional(),
      // PMS settings
      pmsPredictionEnabled: Joi.boolean(),
      pmsDaysBeforePeriod: Joi.number().min(1).max(10),
      // Sync
      syncEnabled: Joi.boolean(),
    })
    .min(1),
};

export const getBirthControl = {};

export const updateBirthControl = {
  body: Joi.object()
    .keys({
      method: Joi.string().valid('pill', 'iud', 'implant', 'condom', 'ring', 'spermicide', 'shot', 'patch', 'none', 'other'),
      reminderEnabled: Joi.boolean(),
      nextPillTime: timeHHmm,
      pillTimezone: Joi.string(),
      pillPackStartDate: isoDate,
      pillPackLength: Joi.number().integer().min(1).max(120),
      pillFreeDays: Joi.number().integer().min(0).max(14),
      pillsTakenDates: Joi.array().items(isoDate),
      pillPackStatus: Joi.string().valid('Active', 'Break', 'Unknown'),
      lastCheckupDate: isoDate,
      checkupReminderEnabled: Joi.boolean(),
    })
    .min(1),
};

export const takePill = {
  body: Joi.object().keys({
    date: isoDate.optional(),
  }),
};

export const bulkImportHistoricalCycles = {
  body: Joi.object().keys({
    cycles: Joi.array()
      .items(
        Joi.object().keys({
          cycleStartDate: isoDate.required(),
          cycleEndDate: isoDate.optional(),
          periodDurationDays: Joi.number().min(1).max(15).optional(),
          cycleStatus: Joi.string().valid('Active', 'Completed').optional(),
          dailyLogs: Joi.array().items(dailyLogSchema).optional(),
          cycleNotes: Joi.string().max(2000).optional(),
        })
      )
      .min(1)
      .max(50) // Limit to 50 cycles per request
      .required(),
  }),
};

export const deleteCycle = {
  params: Joi.object().keys({
    cycleId: Joi.string().custom(objectId).required(),
  }),
};

export const updateCycle = {
  params: Joi.object().keys({
    cycleId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    cycleStartDate: isoDate.optional(),
    cycleEndDate: isoDate.optional(),
    periodDurationDays: Joi.number().min(1).max(15).optional(),
    cycleStatus: Joi.string().valid('Active', 'Completed', 'Predicted').optional(),
    cycleNotes: Joi.string().max(2000).optional(),
    currentPhase: Joi.string().valid('Menstruation', 'Follicular', 'Ovulation', 'Luteal').optional(),
  }).min(1),
};

export const deleteDailyLog = {
  params: Joi.object().keys({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(), // YYYY-MM-DD
  }),
};
