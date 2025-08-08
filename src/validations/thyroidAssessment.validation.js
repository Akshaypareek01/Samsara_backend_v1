import Joi from 'joi';
import { objectId } from './custom.validation.js';

const answerOptions = {
    bowelMovements: ['Regular', 'Irregular', 'Urge of defecation just after eating', 'Constipated (>3 days)', 'Diarrhea'],
    acidity: ['Yes', 'No', 'Sometimes'],
    heatIntolerance: ['Yes', 'No'],
    weightIssues: ['Weight Gain', 'Weight Loss'],
    coldSensitivity: ['Yes', 'No'],
    appetite: ['Increased', 'Low', 'Regular'],
    jointStiffness: ['Yes', 'No'],
    facialSwelling: ['Yes', 'Sometimes', 'No'],
    anxiety: ['Yes', 'No', 'Stress Induced'],
    sleepPattern: ['7–8 hrs', 'Disturbed Sleep Pattern', 'Difficulty in Sleeping'],
    drySkinHair: ['Extremely Dry', 'Normal'],
    nails: ['Brittle', 'Healthy'],
    sweating: ['Extreme', 'Normal', 'Absent'],
    voiceHoarseness: ['Present', 'Absent'],
    pastIllness: ['Diabetes', 'Hypertension', 'Other'],
    familyHistory: ['Mother', 'Father', 'Maternal Family', 'Paternal Family', 'None'],
    thyroidProfileChecked: ['Yes (share reports)', 'No'],
    hairThinning: ['Yes', 'No'],
    heartRate: ['Too slow', 'Too fast', 'Normal'],
    neckSwelling: ['Yes', 'No']
};

const answersSchema = Joi.object({
    bowelMovements: Joi.string().valid(...answerOptions.bowelMovements).required().messages({
        'any.required': 'Bowel movements answer is required',
        'any.only': 'Invalid bowel movements option'
    }),
    acidity: Joi.string().valid(...answerOptions.acidity).required().messages({
        'any.required': 'Acidity answer is required',
        'any.only': 'Invalid acidity option'
    }),
    heatIntolerance: Joi.string().valid(...answerOptions.heatIntolerance).required().messages({
        'any.required': 'Heat intolerance answer is required',
        'any.only': 'Invalid heat intolerance option'
    }),
    weightIssues: Joi.string().valid(...answerOptions.weightIssues).required().messages({
        'any.required': 'Weight issues answer is required',
        'any.only': 'Invalid weight issues option'
    }),
    coldSensitivity: Joi.string().valid(...answerOptions.coldSensitivity).required().messages({
        'any.required': 'Cold sensitivity answer is required',
        'any.only': 'Invalid cold sensitivity option'
    }),
    appetite: Joi.string().valid(...answerOptions.appetite).required().messages({
        'any.required': 'Appetite answer is required',
        'any.only': 'Invalid appetite option'
    }),
    jointStiffness: Joi.string().valid(...answerOptions.jointStiffness).required().messages({
        'any.required': 'Joint stiffness answer is required',
        'any.only': 'Invalid joint stiffness option'
    }),
    facialSwelling: Joi.string().valid(...answerOptions.facialSwelling).required().messages({
        'any.required': 'Facial swelling answer is required',
        'any.only': 'Invalid facial swelling option'
    }),
    anxiety: Joi.string().valid(...answerOptions.anxiety).required().messages({
        'any.required': 'Anxiety answer is required',
        'any.only': 'Invalid anxiety option'
    }),
    sleepPattern: Joi.string().valid(...answerOptions.sleepPattern).required().messages({
        'any.required': 'Sleep pattern answer is required',
        'any.only': 'Invalid sleep pattern option'
    }),
    drySkinHair: Joi.string().valid(...answerOptions.drySkinHair).required().messages({
        'any.required': 'Dry skin/hair answer is required',
        'any.only': 'Invalid dry skin/hair option'
    }),
    nails: Joi.string().valid(...answerOptions.nails).required().messages({
        'any.required': 'Nails answer is required',
        'any.only': 'Invalid nails option'
    }),
    sweating: Joi.string().valid(...answerOptions.sweating).required().messages({
        'any.required': 'Sweating answer is required',
        'any.only': 'Invalid sweating option'
    }),
    voiceHoarseness: Joi.string().valid(...answerOptions.voiceHoarseness).required().messages({
        'any.required': 'Voice hoarseness answer is required',
        'any.only': 'Invalid voice hoarseness option'
    }),
    pastIllness: Joi.array().items(Joi.string().valid(...answerOptions.pastIllness)).min(0).max(3).required().messages({
        'any.required': 'Past illness answer is required',
        'array.min': 'Past illness must be an array',
        'array.max': 'Past illness cannot have more than 3 items'
    }),
    pastIllnessOther: Joi.string().max(500).optional().messages({
        'string.max': 'Past illness other description cannot exceed 500 characters'
    }),
    familyHistory: Joi.array().items(Joi.string().valid(...answerOptions.familyHistory)).min(1).max(5).required().messages({
        'any.required': 'Family history answer is required',
        'array.min': 'Family history must have at least 1 item',
        'array.max': 'Family history cannot have more than 5 items'
    }),
    thyroidProfileChecked: Joi.string().valid(...answerOptions.thyroidProfileChecked).required().messages({
        'any.required': 'Thyroid profile checked answer is required',
        'any.only': 'Invalid thyroid profile checked option'
    }),
    hairThinning: Joi.string().valid(...answerOptions.hairThinning).required().messages({
        'any.required': 'Hair thinning answer is required',
        'any.only': 'Invalid hair thinning option'
    }),
    heartRate: Joi.string().valid(...answerOptions.heartRate).required().messages({
        'any.required': 'Heart rate answer is required',
        'any.only': 'Invalid heart rate option'
    }),
    neckSwelling: Joi.string().valid(...answerOptions.neckSwelling).required().messages({
        'any.required': 'Neck swelling answer is required',
        'any.only': 'Invalid neck swelling option'
    })
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
        riskLevel: Joi.string().valid('Low', 'Moderate', 'High')
    })
};

export const thyroidAssessmentValidation = {
    createAssessment,
    getAssessment,
    updateAssessment,
    deleteAssessment,
    submitReassessment,
    calculateRisk,
    getAssessmentHistory
};
