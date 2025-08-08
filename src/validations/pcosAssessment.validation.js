import Joi from 'joi';
import { objectId } from './custom.validation.js';

const answerOptions = {
    cycleRegularity: ['Regular', 'Irregular'],
    periodDuration: ['1-2 days', '3-5 days', '5-7 days', '7+ days'],
    menstrualFlow: ['Normal', 'Scanty', 'Heavy'],
    bloodColor: ['Bright red', 'Brown-Blackish', 'Initially brown then red'],
    facialHair: ['Yes', 'No'],
    weightGain: ['Yes', 'No'],
    hormonalMedications: ['Yes', 'No'],
    periodPain: ['Absent', 'Bearable', 'Unbearable'],
    facialAcne: ['Yes', 'No'],
    lowLibido: ['Yes', 'No'],
    hairLoss: ['Excess', 'Normal', 'Absent'],
    darkSkinPatches: ['Yes', 'No'],
    difficultyConceiving: ['Never conceived', 'Conceived once, then failure', 'Second conception failed', 'Other']
};

const answersSchema = Joi.object({
    lastCycleDate: Joi.date().required().messages({
        'any.required': 'Last cycle date is required',
        'date.base': 'Last cycle date must be a valid date'
    }),
    cycleRegularity: Joi.string().valid(...answerOptions.cycleRegularity).required(),
    periodDuration: Joi.string().valid(...answerOptions.periodDuration).required(),
    menstrualFlow: Joi.string().valid(...answerOptions.menstrualFlow).required(),
    bloodColor: Joi.string().valid(...answerOptions.bloodColor).required(),
    facialHair: Joi.string().valid(...answerOptions.facialHair).required(),
    weightGain: Joi.string().valid(...answerOptions.weightGain).required(),
    foodCravings: Joi.string().min(1).max(500).required().messages({
        'string.min': 'Food cravings description must be at least 1 character long',
        'string.max': 'Food cravings description cannot exceed 500 characters'
    }),
    hormonalMedications: Joi.string().valid(...answerOptions.hormonalMedications).required(),
    periodPain: Joi.string().valid(...answerOptions.periodPain).required(),
    facialAcne: Joi.string().valid(...answerOptions.facialAcne).required(),
    lowLibido: Joi.string().valid(...answerOptions.lowLibido).required(),
    hairLoss: Joi.string().valid(...answerOptions.hairLoss).required(),
    darkSkinPatches: Joi.string().valid(...answerOptions.darkSkinPatches).required(),
    difficultyConceiving: Joi.string().valid(...answerOptions.difficultyConceiving).required()
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

const getAssessmentHistory = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100),
        riskLevel: Joi.string().valid('Low risk', 'Moderate risk', 'High risk')
    })
};

export const pcosAssessmentValidation = {
    createAssessment,
    getAssessment,
    updateAssessment,
    deleteAssessment,
    submitReassessment,
    calculateRisk,
    getAssessmentHistory
};
