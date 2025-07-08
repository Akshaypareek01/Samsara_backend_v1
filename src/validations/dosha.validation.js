import Joi from 'joi';
import { objectId } from './custom.validation.js';

export const startAssessment = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
    assessmentType: Joi.string().valid('Prakriti', 'Vikriti').required()
  })
};

export const getAssessmentQuestions = {
  params: Joi.object().keys({
    assessmentType: Joi.string().valid('Prakriti', 'Vikriti').required()
  })
};

export const submitAnswer = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
    assessmentId: Joi.string().custom(objectId).required(),
    questionId: Joi.string().custom(objectId).required(),
    selectedOptionIndex: Joi.number().integer().min(0).max(4).required()
  })
};

export const calculateDoshaScore = {
  params: Joi.object().keys({
    assessmentId: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    userId: Joi.string().required()
  })
};

export const getAssessmentResults = {
  query: Joi.object().keys({
    userId: Joi.string().required(),
    assessmentType: Joi.string().valid('Prakriti', 'Vikriti')
  })
};

export const getAssessmentById = {
  params: Joi.object().keys({
    assessmentId: Joi.string().custom(objectId).required()
  }),
  query: Joi.object().keys({
    userId: Joi.string().required()
  })
}; 