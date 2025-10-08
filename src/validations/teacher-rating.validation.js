import Joi from 'joi';
import { objectId } from './custom.validation.js';

// ==================== TEACHER RATINGS ====================

const addTeacherRating = {
  params: Joi.object().keys({
    teacherId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    rating: Joi.number().integer().min(1).max(5).required(),
    review: Joi.string().max(1000).optional(),
    isAnonymous: Joi.boolean().default(false),
  }),
};

const updateTeacherRating = {
  params: Joi.object().keys({
    teacherId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    rating: Joi.number().integer().min(1).max(5).required(),
    review: Joi.string().max(1000).optional(),
    isAnonymous: Joi.boolean(),
  }),
};

const deleteTeacherRating = {
  params: Joi.object().keys({
    teacherId: Joi.string().custom(objectId).required(),
  }),
};

const getTeacherRatingsByTeacherId = {
  params: Joi.object().keys({
    teacherId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    minRating: Joi.number().min(1).max(5),
    maxRating: Joi.number().min(1).max(5),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getTeacherRatingsByUserId = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    minRating: Joi.number().min(1).max(5),
    maxRating: Joi.number().min(1).max(5),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getTeacherAverageRating = {
  params: Joi.object().keys({
    teacherId: Joi.string().custom(objectId).required(),
  }),
};

const getTeacherRatingByUserAndTeacher = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId).required(),
    teacherId: Joi.string().custom(objectId).required(),
  }),
};

export {
  addTeacherRating,
  updateTeacherRating,
  deleteTeacherRating,
  getTeacherRatingsByTeacherId,
  getTeacherRatingsByUserId,
  getTeacherAverageRating,
  getTeacherRatingByUserAndTeacher,
};

