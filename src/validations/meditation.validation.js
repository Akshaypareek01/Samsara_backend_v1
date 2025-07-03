import Joi from 'joi';
import { objectId } from './custom.validation.js';

const createMeditation = {
  body: Joi.object().keys({
    title: Joi.string().required().trim(),
    description: Joi.string().trim(),
    duration: Joi.number().required().min(1).max(480), // 1 minute to 8 hours
    level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced', 'All Levels'),
    imageUrl: Joi.string().uri(),
    audioUrl: Joi.string().uri(),
    category: Joi.string().custom(objectId).required(),
    tags: Joi.array().items(Joi.string().trim()),
    benefits: Joi.string().trim(),
    howToPractice: Joi.array().items(Joi.string().trim()),
    focus: Joi.number().min(0).max(100),
    mood: Joi.string().trim(),
    recommended: Joi.array().items(Joi.string().custom(objectId)),
    isActive: Joi.boolean(),
  }),
};

const getMeditations = {
  query: Joi.object().keys({
    title: Joi.string(),
    level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced', 'All Levels'),
    mood: Joi.string(),
    category: Joi.string().custom(objectId),
    isActive: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getMeditation = {
  params: Joi.object().keys({
    meditationId: Joi.string().custom(objectId).required(),
  }),
};

const updateMeditation = {
  params: Joi.object().keys({
    meditationId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().trim(),
      description: Joi.string().trim(),
      duration: Joi.number().min(1).max(480),
      level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced', 'All Levels'),
      imageUrl: Joi.string().uri(),
      audioUrl: Joi.string().uri(),
      category: Joi.string().custom(objectId),
      tags: Joi.array().items(Joi.string().trim()),
      benefits: Joi.string().trim(),
      howToPractice: Joi.array().items(Joi.string().trim()),
      focus: Joi.number().min(0).max(100),
      mood: Joi.string().trim(),
      recommended: Joi.array().items(Joi.string().custom(objectId)),
      isActive: Joi.boolean(),
    })
    .min(1),
};

const deleteMeditation = {
  params: Joi.object().keys({
    meditationId: Joi.string().custom(objectId).required(),
  }),
};

const getMeditationsByCategory = {
  params: Joi.object().keys({
    categoryId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getMeditationsByLevel = {
  params: Joi.object().keys({
    level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced', 'All Levels').required(),
  }),
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getMeditationsByMood = {
  params: Joi.object().keys({
    mood: Joi.string().required(),
  }),
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const searchMeditations = {
  query: Joi.object().keys({
    searchTerm: Joi.string().required(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getRecommendedMeditations = {
  params: Joi.object().keys({
    meditationId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export {
  createMeditation,
  getMeditations,
  getMeditation,
  updateMeditation,
  deleteMeditation,
  getMeditationsByCategory,
  getMeditationsByLevel,
  getMeditationsByMood,
  searchMeditations,
  getRecommendedMeditations,
}; 