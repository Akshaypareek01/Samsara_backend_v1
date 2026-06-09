import Joi from 'joi';
import { objectId } from './custom.validation.js';

const createTrainerRating = {
  body: Joi.object().keys({
    bookingId: Joi.string().custom(objectId).required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    feedback: Joi.string().trim().max(1000).allow('', null).optional(),
  }),
};

const updateTrainerRating = {
  params: Joi.object().keys({
    bookingId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      rating: Joi.number().integer().min(1).max(5).required(),
      feedback: Joi.string().trim().max(1000).allow('', null).optional(),
    })
    .min(1),
};

const getTrainerRatingSummary = {
  params: Joi.object().keys({
    trainerId: Joi.string().custom(objectId).required(),
  }),
};

const getTrainerReviews = {
  params: Joi.object().keys({
    trainerId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(50),
    sortBy: Joi.string(),
  }),
};

const getBookingRating = {
  params: Joi.object().keys({
    bookingId: Joi.string().custom(objectId).required(),
  }),
};

const getPendingRatings = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(50),
  }),
};

export {
  createTrainerRating,
  updateTrainerRating,
  getTrainerRatingSummary,
  getTrainerReviews,
  getBookingRating,
  getPendingRatings,
};
