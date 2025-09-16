import Joi from 'joi';
import { objectId } from './custom.validation.js';

const createMood = {
  body: Joi.object().keys({
    mood: Joi.string()
      .valid('Normal', 'Angry', 'Happy', 'Sad', 'Exhausted', 'Anxious', 'Depressed', 'In Love', 'Bored', 'Confident', 'Excited', 'Relaxed')
      .required(),
    moodId: Joi.number()
      .valid(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)
      .required(),
  }),
};

const getMoods = {
  query: Joi.object().keys({
    userId: Joi.string().custom(objectId),
    mood: Joi.string().valid('Normal', 'Angry', 'Happy', 'Sad', 'Exhausted', 'Anxious', 'Depressed', 'In Love', 'Bored', 'Confident', 'Excited', 'Relaxed'),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

const getMood = {
  params: Joi.object().keys({
    moodId: Joi.string().custom(objectId).required(),
  }),
};

const updateMood = {
  params: Joi.object().keys({
    moodId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      mood: Joi.string().valid('Normal', 'Angry', 'Happy', 'Sad', 'Exhausted', 'Anxious', 'Depressed', 'In Love', 'Bored', 'Confident', 'Excited', 'Relaxed'),
      moodId: Joi.number().valid(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12),
    })
    .min(1),
};

const deleteMood = {
  params: Joi.object().keys({
    moodId: Joi.string().custom(objectId).required(),
  }),
};

const getMoodAnalytics = {
  query: Joi.object().keys({
    period: Joi.string().valid('daily', 'weekly', 'monthly', '6months', 'yearly').required(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
};

const getMoodKPIs = {
  query: Joi.object().keys({
    period: Joi.string().valid('daily', 'weekly', 'monthly', '6months', 'yearly').required(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
};

export {
  createMood,
  getMoods,
  getMood,
  updateMood,
  deleteMood,
  getMoodAnalytics,
  getMoodKPIs,
};
