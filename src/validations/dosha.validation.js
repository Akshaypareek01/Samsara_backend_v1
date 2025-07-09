import Joi from 'joi';
import { objectId } from './custom.validation.js';

export const startAssessment = {
  body: Joi.object().keys({
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
    assessmentId: Joi.string().custom(objectId).required(),
    answers: Joi.array().items(
      Joi.object().keys({
        questionId: Joi.string().custom(objectId).required(),
        selectedOptionIndex: Joi.number().integer().min(0).max(4).required()
      })
    ).min(1).required()
  })
};

export const calculateDoshaScore = {
  params: Joi.object().keys({
    assessmentId: Joi.string().custom(objectId).required()
  })
};

export const getAssessmentResults = {
  query: Joi.object().keys({
    assessmentType: Joi.string().valid('Prakriti', 'Vikriti')
  })
};

export const getAssessmentById = {
  params: Joi.object().keys({
    assessmentId: Joi.string().custom(objectId).required()
  })
}; 