import Joi from 'joi';
import { objectId } from './custom.validation.js';

const answerOptions = {
    irregularPeriods: ['Yes, frequently', 'Sometimes', 'Rarely', 'No, Never'],
    fatigue: ['Always tired', 'Often tired', 'Sometimes tired', 'Rarely tired'],
    weightChanges: ['Significant weight gain', 'Slight weight gain', 'Weight remains stable', 'Weight loss'],
    sleepQuality: ['Very poor sleep', 'Poor sleep', 'Average sleep', 'Good sleep'],
    moodSwings: ['Very frequently', 'Frequently', 'Sometimes', 'Never']
};

const answersSchema = Joi.object({
    irregularPeriods: Joi.string().valid(...answerOptions.irregularPeriods).required(),
    fatigue: Joi.string().valid(...answerOptions.fatigue).required(),
    weightChanges: Joi.string().valid(...answerOptions.weightChanges).required(),
    sleepQuality: Joi.string().valid(...answerOptions.sleepQuality).required(),
    moodSwings: Joi.string().valid(...answerOptions.moodSwings).required()
});

const createAssessment = {
    body: Joi.object().keys({
        answers: answersSchema.required()
    })
};

const getAssessment = {
    params: Joi.object().keys({
        assessmentId: Joi.string().custom(objectId).required()
    })
};

const updateAssessment = {
    params: Joi.object().keys({
        assessmentId: Joi.string().custom(objectId).required()
    }),
    body: Joi.object().keys({
        answers: answersSchema.required()
    })
};

const deleteAssessment = {
    params: Joi.object().keys({
        assessmentId: Joi.string().custom(objectId).required()
    })
};

const submitReassessment = {
    body: Joi.object().keys({
        answers: answersSchema.required()
    })
};

const calculateRisk = {
    body: Joi.object().keys({
        answers: answersSchema.required()
    })
};

export const menopauseAssessmentValidation = {
    createAssessment,
    getAssessment,
    updateAssessment,
    deleteAssessment,
    submitReassessment,
    calculateRisk
};
