import Joi from 'joi';

const updateDailyLog = {
  body: Joi.object().keys({
    date: Joi.date().required(),
    flowIntensity: Joi.number().min(0).max(5),
    crampingIntensity: Joi.string().valid('None', 'Mild', 'Moderate', 'Strong', 'Severe'),
    painLevel: Joi.number().min(0).max(10),
    energyPattern: Joi.string().valid('Low', 'Low-Mid', 'Moderate', 'Mid-High', 'High'),
    restNeeded: Joi.boolean(),
    symptoms: Joi.array().items(Joi.string()),
    cravings: Joi.array().items(Joi.string()),
    medicationTaken: Joi.boolean(),
    supplementTaken: Joi.boolean(),
    exercise: Joi.object({
      type: Joi.string(),
      minutes: Joi.number().min(0),
      intensity: Joi.string()
    }),
    discharge: Joi.object({
      type: Joi.string(),
      color: Joi.string(),
      consistency: Joi.string(),
      amount: Joi.string(),
      notableChanges: Joi.array().items(Joi.string())
    }),
    sexualActivity: Joi.object({
      hadSex: Joi.boolean(),
      protected: Joi.boolean()
    }),
    pregnancyTest: Joi.object({
      taken: Joi.boolean(),
      result: Joi.string().valid('Positive', 'Negative', 'Unknown')
    }),
    notes: Joi.string().max(1000)
  })
};

const updateNotes = {
  body: Joi.object().keys({
    cycleNotes: Joi.string().max(2000).required()
  })
};

export const periodCycleValidation = {
  updateDailyLog,
  updateNotes
};
