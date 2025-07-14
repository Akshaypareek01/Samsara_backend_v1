import Joi from 'joi';
import { objectId } from './custom.validation.js';

export const createQuestion = {
  body: Joi.object().keys({
    assessmentType: Joi.string().valid('Prakriti', 'Vikriti').required(),
    questionText: Joi.string().required(),
    options: Joi.array().items(
      Joi.object().keys({
        text: Joi.string().required(),
        dosha: Joi.string().valid('Vata', 'Pitta', 'Kapha').required(),
        description: Joi.string().optional()
      })
    ).min(2).max(5).required(),
    order: Joi.number().integer().min(1).optional(),
    isActive: Joi.boolean().optional()
  })
};

export const getQuestions = {
  query: Joi.object().keys({
    assessmentType: Joi.string().valid('Prakriti', 'Vikriti'),
    isActive: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer()
  })
};

export const getQuestion = {
  params: Joi.object().keys({
    questionId: Joi.string().custom(objectId).required()
  })
};

export const updateQuestion = {
  params: Joi.object().keys({
    questionId: Joi.string().custom(objectId).required()
  }),
  body: Joi.object()
    .keys({
      assessmentType: Joi.string().valid('Prakriti', 'Vikriti'),
      questionText: Joi.string(),
      options: Joi.array().items(
        Joi.object().keys({
          text: Joi.string().required(),
          dosha: Joi.string().valid('Vata', 'Pitta', 'Kapha').required(),
          description: Joi.string().optional()
        })
      ).min(2).max(5),
      order: Joi.number().integer().min(1),
      isActive: Joi.boolean()
    })
    .min(1)
};

export const startAssessment = {
  body: Joi.object().keys({
    assessmentType: Joi.string().valid('Prakriti', 'Vikriti').required()
  })
};

export const submitAnswer = {
  body: Joi.object().keys({
    assessmentId: Joi.string().custom(objectId).required(),
    questionId: Joi.string().custom(objectId).required(),
    selectedOptionIndex: Joi.number().integer().min(0).max(4).required()
  })
};

export const getAssessment = {
  params: Joi.object().keys({
    assessmentId: Joi.string().custom(objectId).required()
  })
};

export const getAssessmentResults = {
  query: Joi.object().keys({
    assessmentType: Joi.string().valid('Prakriti', 'Vikriti'),
    limit: Joi.number().integer(),
    page: Joi.number().integer()
  })
};

export const getAssessmentQuestions = {
  params: Joi.object().keys({
    assessmentType: Joi.string().valid('Prakriti', 'Vikriti').required()
  })
};

export const bulkCreateQuestions = {
  body: Joi.array().items(
    Joi.object().keys({
      assessmentType: Joi.string().valid('Prakriti', 'Vikriti').required(),
      questionText: Joi.string().required(),
      options: Joi.array().items(
        Joi.object().keys({
          text: Joi.string().required(),
          dosha: Joi.string().valid('Vata', 'Pitta', 'Kapha').required(),
          description: Joi.string().optional()
        })
      ).min(2).max(5).required(),
      order: Joi.number().integer().min(1).optional(),
      isActive: Joi.boolean().optional()
    })
  ).min(1).required()
}; 